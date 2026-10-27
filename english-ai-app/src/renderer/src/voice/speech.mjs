export function cleanSpeechText(text) {
  let speechText = String(text ?? '').trim()

  // Some model/API paths return the complete structured response instead of
  // the reply string. Never send JSON syntax or its metadata to the TTS engine.
  const candidate = speechText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  if (/^[{[]/.test(candidate)) {
    try {
      const parsed = JSON.parse(candidate)
      if (typeof parsed === 'string') speechText = parsed
      else if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const reply = ['reply', 'text', 'content', 'message']
          .map((key) => parsed[key])
          .find((value) => typeof value === 'string' && value.trim())
        speechText = reply || ''
      } else speechText = ''
    } catch {
      // A JSON-like but malformed response is not useful speech. In particular,
      // don't make the device read braces and field names character by character.
      speechText = ''
    }
  }

  return speechText
    .replace(/\*\*/g, '')
    .replace(/\([^()]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function decodeSpeechAudio(blob, { environment = globalThis, targetSampleRate = 16000 } = {}) {
  const AudioContext = environment?.AudioContext || environment?.webkitAudioContext
  if (typeof AudioContext !== 'function') throw new Error('LOCAL_ASR_FAILED')

  const context = new AudioContext()
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer())
    const mono = new Float32Array(decoded.length)
    for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
      const samples = decoded.getChannelData(channel)
      for (let index = 0; index < samples.length; index++) mono[index] += samples[index] / decoded.numberOfChannels
    }
    if (decoded.sampleRate === targetSampleRate) return { audio: mono, sampleRate: targetSampleRate }

    const outputLength = Math.max(1, Math.floor(mono.length * targetSampleRate / decoded.sampleRate))
    const resampled = new Float32Array(outputLength)
    const ratio = decoded.sampleRate / targetSampleRate
    for (let index = 0; index < outputLength; index++) {
      const sourceIndex = index * ratio
      const left = Math.floor(sourceIndex)
      const right = Math.min(left + 1, mono.length - 1)
      const fraction = sourceIndex - left
      resampled[index] = mono[left] * (1 - fraction) + mono[right] * fraction
    }
    return { audio: resampled, sampleRate: targetSampleRate }
  } finally {
    await context.close().catch(() => {})
  }
}

export function speechErrorMessage(error) {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Chưa có quyền truy cập micro. Hãy bật quyền micro trong cài đặt ứng dụng.'
    case 'no-speech':
      return 'Không nghe thấy giọng nói. Hãy nói gần micro và thử lại.'
    case 'no-microphone':
      return 'Không tìm thấy micro. Hãy kết nối micro rồi thử lại.'
    case 'microphone-busy':
      return 'Micro đang bận hoặc không hoạt động. Hãy đóng ứng dụng khác đang dùng micro rồi thử lại.'
    case 'audio-capture':
      return 'Không truy cập được micro. Kiểm tra thiết bị và quyền truy cập micro.'
    case 'network':
      return 'Mất kết nối với dịch vụ nhận dạng giọng nói. Kiểm tra internet rồi thử lại.'
    case 'unsupported':
      return 'Thiết bị này không hỗ trợ ghi âm để nhận diện giọng nói cục bộ.'
    case 'LOCAL_MODEL_DOWNLOAD_FAILED':
      return 'Chưa tải được mô hình nhận diện cục bộ. Lần đầu cần Internet; hãy kết nối mạng rồi thử lại.'
    case 'LOCAL_ASR_FAILED':
      return 'Mô hình nhận diện cục bộ chưa chạy được. Hãy thử lại hoặc kiểm tra dung lượng bộ nhớ máy.'
    case 'transcription-failed':
    case 'TRANSCRIPTION_FAILED':
      return 'Đã thu âm nhưng chưa nhận diện được thành chữ. Hãy nói chậm, rõ hơn rồi thử lại.'
    default:
      return 'Chưa xác định được lỗi micro. Kiểm tra quyền truy cập và thiết bị micro rồi thử lại.'
  }
}

export function createAudioSpeechCapture({
  environment = globalThis,
  onTranscript = () => {},
  onInterim = () => {},
  shouldTranscribeInterim = () => true,
  onSpeechDetected = () => {},
  onTranscribing = () => {},
  onStateChange = () => {},
  onError = () => {},
  transcribe = async () => ''
} = {}) {
  const supported = Boolean(
    environment?.navigator?.mediaDevices?.getUserMedia &&
      environment?.MediaRecorder &&
      (environment?.AudioContext || environment?.webkitAudioContext)
  )
  let stream
  let recorder
  let audioContext
  let source
  let analyser
  let frame
  let interimTimer
  let interimInFlight = false
  let interimCount = 0
  let interimPromise = null
  let sessionId = 0
  let finalTranscriptReceived = false
  let startedAt = 0
  let lastVoiceAt = 0
  let heardVoice = false
  let reportedSpeech = false
  let stopped = false

  const release = () => {
    if (interimTimer != null) environment.clearInterval(interimTimer)
    interimTimer = null
    if (frame != null) environment.cancelAnimationFrame(frame)
    frame = null
    source?.disconnect()
    analyser?.disconnect()
    audioContext?.close().catch(() => {})
    audioContext = source = analyser = null
    stream?.getTracks().forEach((track) => track.stop())
    stream = null
    recorder = null
    onStateChange(false)
  }

  const stopRecording = () => {
    if (!recorder || recorder.state === 'inactive') return
    stopped = true
    recorder.stop()
  }

  const detectSpeech = () => {
    if (!analyser || stopped) return
    const samples = new Uint8Array(analyser.fftSize)
    analyser.getByteTimeDomainData(samples)
    let energy = 0
    for (const sample of samples) {
      const normalized = (sample - 128) / 128
      energy += normalized * normalized
    }
    const rms = Math.sqrt(energy / samples.length)
    const now = Date.now()
    if (rms > 0.018) {
      heardVoice = true
      lastVoiceAt = now
      if (!reportedSpeech) {
        reportedSpeech = true
        onSpeechDetected(true)
      }
    }
    if (heardVoice && now - lastVoiceAt > 1000) {
      stopRecording()
      return
    }
    if (now - startedAt > (heardVoice ? 15000 : 7000)) {
      stopRecording()
      return
    }
    frame = environment.requestAnimationFrame(detectSpeech)
  }

  return {
    supported,
    async start() {
      if (!supported || recorder) return false
      try {
        stopped = false
        sessionId++
        finalTranscriptReceived = false
        const currentSession = sessionId
        heardVoice = false
        reportedSpeech = false
        onSpeechDetected(false)
        lastVoiceAt = 0
        stream = await environment.navigator.mediaDevices.getUserMedia({ audio: true })
        const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
          .find((type) => environment.MediaRecorder.isTypeSupported?.(type))
        recorder = mimeType
          ? new environment.MediaRecorder(stream, { mimeType })
          : new environment.MediaRecorder(stream)
        const chunks = []
        interimInFlight = false
        interimCount = 0
        interimPromise = null
        recorder.ondataavailable = (event) => {
          if (event.data?.size) chunks.push(event.data)
        }
        recorder.onerror = () => {
          release()
          onError('audio-capture')
        }
        recorder.onstop = async () => {
          const blob = new environment.Blob(chunks, { type: recorder?.mimeType || mimeType || 'audio/webm' })
          const hadSpeech = heardVoice
          release()
          if (!hadSpeech || !blob.size) {
            onError('no-speech')
            return
          }
          onTranscribing(true)
          try {
            const transcript = await transcribe({ blob, mimeType: blob.type })
            if (transcript?.trim()) {
              if (currentSession === sessionId) finalTranscriptReceived = true
              onTranscript(transcript)
            }
            else onError('no-speech')
          } catch (error) {
            onError(error?.message || 'transcription-failed')
          } finally {
            onTranscribing(false)
          }
        }
        recorder.start(250)
        const requestInterim = () => {
          if (stopped || !heardVoice || !shouldTranscribeInterim() || interimInFlight || interimCount >= 2 || chunks.length === 0) return
          interimInFlight = true
          interimCount++
          interimPromise = (async () => {
            try {
              const snapshot = new environment.Blob(chunks, { type: recorder?.mimeType || mimeType || 'audio/webm' })
              const transcript = await transcribe({ blob: snapshot, mimeType: snapshot.type, interim: true })
              if (currentSession === sessionId && !finalTranscriptReceived && transcript?.trim()) onInterim(transcript.trim())
            } catch {
              // Interim recognition is best-effort; final transcription remains authoritative.
            } finally {
              interimInFlight = false
            }
          })()
        }
        if (shouldTranscribeInterim()) {
          interimTimer = environment.setTimeout(() => {
            requestInterim()
            interimTimer = environment.setInterval(requestInterim, 1800)
          }, 600)
        }
        const AudioContext = environment.AudioContext || environment.webkitAudioContext
        audioContext = new AudioContext()
        source = audioContext.createMediaStreamSource(stream)
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 2048
        source.connect(analyser)
        startedAt = Date.now()
        onStateChange(true)
        frame = environment.requestAnimationFrame(detectSpeech)
        return true
      } catch (error) {
        release()
        const errorName = error?.name
        const code = ['NotAllowedError', 'SecurityError'].includes(errorName)
          ? 'not-allowed'
          : ['NotFoundError', 'DevicesNotFoundError'].includes(errorName)
            ? 'no-microphone'
            : ['NotReadableError', 'TrackStartError'].includes(errorName)
              ? 'microphone-busy'
              : 'audio-capture'
        onError(code)
        return false
      }
    },
    stop() {
      stopped = true
      if (recorder && recorder.state !== 'inactive') recorder.stop()
      else release()
    }
  }
}

export function createSpeechRecognition({
  environment = globalThis,
  lang = 'en-US',
  onTranscript = () => {},
  onInterim = () => {},
  onStateChange = () => {},
  onError = () => {}
} = {}) {
  const Recognition = environment?.SpeechRecognition || environment?.webkitSpeechRecognition
  if (typeof Recognition !== 'function') {
    return { supported: false, start: () => false, stop: () => {} }
  }

  let recognition = null
  let active = false
  let starting = false
  let reportedListening = false
  const reportListening = (listening) => {
    if (reportedListening === listening) return
    reportedListening = listening
    onStateChange(listening)
  }

  return {
    supported: true,
    start() {
      if (active || starting) return false

      try {
        recognition = new Recognition()
        recognition.lang = lang
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1
        recognition.onstart = () => {
          starting = false
          active = true
          reportListening(true)
        }
        recognition.onresult = (event) => {
          const results = Array.from(event?.results || [])
          const interimTranscript = results
            .filter((result) => !result.isFinal)
            .map((result) => result?.[0]?.transcript || '')
            .filter(Boolean)
            .join(' ')
            .trim()
          const finalSegments = []
          const firstNewResult = Math.max(0, event?.resultIndex ?? 0)
          for (let index = firstNewResult; index < results.length; index++) {
            const result = results[index]
            if (!result?.isFinal) continue
            const segment = result?.[0]?.transcript?.trim()
            if (segment) finalSegments.push(segment)
          }
          if (interimTranscript) onInterim(interimTranscript)
          if (finalSegments.length) onTranscript(finalSegments.join(' '))
        }
        recognition.onerror = (event) => {
          starting = false
          active = false
          reportListening(false)
          onError(event?.error || 'unknown')
        }
        recognition.onend = () => {
          starting = false
          active = false
          reportListening(false)
        }
        starting = true
        recognition.start()
        return true
      } catch (error) {
        starting = false
        active = false
        reportListening(false)
        onError(error?.name || 'start-failed')
        return false
      }
    },
    stop() {
      const shouldStop = active || starting
      starting = false
      if (!recognition || !shouldStop) return
      try {
        recognition.stop()
      } catch {
        // The recognition service may already have stopped itself.
      }
      active = false
      reportListening(false)
    }
  }
}

export function speakText({ environment = globalThis, text, lang = 'en-US', onEnd } = {}) {
  const synthesis = environment?.speechSynthesis
  const Utterance = environment?.SpeechSynthesisUtterance
  if (!synthesis || typeof Utterance !== 'function') {
    onEnd?.()
    return false
  }

  let finished = false
  const finish = () => {
    if (finished) return
    finished = true
    onEnd?.()
  }

  try {
    synthesis.cancel()
    const utterance = new Utterance(cleanSpeechText(text))
    utterance.lang = lang
    utterance.onend = finish
    utterance.onerror = (event) => {
      if (event?.error !== 'canceled' && event?.error !== 'interrupted') finish()
    }
    synthesis.speak(utterance)
    return true
  } catch {
    finish()
    return false
  }
}

let activeSpeechContext = null
let activeSpeechSource = null

export function stopSpeechAudio(environment = globalThis) {
  try { activeSpeechSource?.stop() } catch { /* already stopped */ }
  activeSpeechSource = null
  const context = activeSpeechContext
  activeSpeechContext = null
  if (context && context.state !== 'closed') context.close().catch(() => {})
  environment?.speechSynthesis?.cancel()
}

export function playSpeechAudio({ environment = globalThis, audio, sampleRate = 24000, onEnd } = {}) {
  const AudioContext = environment?.AudioContext || environment?.webkitAudioContext
  if (typeof AudioContext !== 'function' || !audio?.length) {
    onEnd?.()
    return false
  }

  stopSpeechAudio(environment)
  try {
    const context = new AudioContext()
    const source = context.createBufferSource()
    const buffer = context.createBuffer(1, audio.length, sampleRate)
    buffer.copyToChannel(audio instanceof Float32Array ? audio : Float32Array.from(audio), 0)
    source.buffer = buffer
    source.connect(context.destination)
    activeSpeechContext = context
    activeSpeechSource = source
    source.onended = () => {
      if (activeSpeechSource !== source) return
      activeSpeechSource = null
      activeSpeechContext = null
      context.close().catch(() => {})
      onEnd?.()
    }
    source.start()
    return true
  } catch {
    stopSpeechAudio(environment)
    onEnd?.()
    return false
  }
}
