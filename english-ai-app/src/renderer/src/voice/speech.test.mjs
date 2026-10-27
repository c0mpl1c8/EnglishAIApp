import assert from 'node:assert/strict'
import test from 'node:test'
import {
  cleanSpeechText,
  createAudioSpeechCapture,
  decodeSpeechAudio,
  createSpeechRecognition,
  speakText,
  speechErrorMessage
} from './speech.mjs'

class FakeRecognition {
  constructor() {
    FakeRecognition.instances.push(this)
  }

  start() {
    this.started = true
    this.onstart?.()
  }

  stop() {
    this.stopped = true
    this.onend?.()
  }
}
FakeRecognition.instances = []

test('unsupported browsers report speech recognition as unavailable', () => {
  const speech = createSpeechRecognition({ environment: {} })
  assert.equal(speech.supported, false)
  assert.equal(speech.start(), false)
})

test('recorded audio is mixed to mono and resampled for local Whisper', async () => {
  let closed = false
  class FakeAudioContext {
    async decodeAudioData() {
      return {
        numberOfChannels: 2,
        sampleRate: 32000,
        length: 4,
        getChannelData: (channel) => channel === 0
          ? Float32Array.from([1, 0.5, 0, -0.5])
          : Float32Array.from([0, 0.5, 1, -0.5])
      }
    }
    async close() { closed = true }
  }

  const result = await decodeSpeechAudio(
    { arrayBuffer: async () => new ArrayBuffer(1) },
    { environment: { AudioContext: FakeAudioContext } }
  )

  assert.equal(result.sampleRate, 16000)
  assert.deepEqual(Array.from(result.audio), [0.5, 0.5])
  assert.equal(closed, true)
})

test('captured recording reaches the local transcriber with its actual blob type', async () => {
  let animationFrame
  let finalTranscript
  let receivedMimeType
  class FakeBlob {
    constructor(parts, options = {}) {
      this.type = options.type || ''
      this.size = parts.length
    }
  }
  class FakeMediaRecorder {
    static isTypeSupported() { return true }
    constructor() {
      this.mimeType = 'audio/webm;codecs=opus'
      this.state = 'inactive'
    }
    start() { this.state = 'recording' }
    stop() {
      this.state = 'inactive'
      this.ondataavailable?.({ data: { size: 1 } })
      this.onstop?.()
    }
  }
  class FakeAudioContext {
    createMediaStreamSource() { return { connect() {}, disconnect() {} } }
    createAnalyser() {
      return {
        fftSize: 2048,
        getByteTimeDomainData(samples) { samples.fill(255) },
        disconnect() {}
      }
    }
    async close() {}
  }

  const capture = createAudioSpeechCapture({
    environment: {
      navigator: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } },
      MediaRecorder: FakeMediaRecorder,
      AudioContext: FakeAudioContext,
      Blob: FakeBlob,
      requestAnimationFrame(callback) { animationFrame = callback; return 1 },
      cancelAnimationFrame() {}
    },
    shouldTranscribeInterim: () => false,
    transcribe: async ({ blob, mimeType }) => {
      receivedMimeType = mimeType
      assert.equal(blob.type, 'audio/webm;codecs=opus')
      return 'hello there'
    },
    onTranscript: (text) => { finalTranscript = text }
  })

  assert.equal(await capture.start(), true)
  animationFrame()
  capture.stop()
  await new Promise((resolve) => setTimeout(resolve, 0))

  assert.equal(receivedMimeType, 'audio/webm;codecs=opus')
  assert.equal(finalTranscript, 'hello there')
})

test('speech recognition uses the target language and returns the recognized phrase', () => {
  FakeRecognition.instances = []
  const phrases = []
  const previews = []
  const states = []
  const speech = createSpeechRecognition({
    environment: { SpeechRecognition: FakeRecognition },
    lang: 'en-US',
    onTranscript: (phrase) => phrases.push(phrase),
    onInterim: (phrase) => previews.push(phrase),
    onStateChange: (listening) => states.push(listening)
  })

  assert.equal(speech.start(), true)
  const recognition = FakeRecognition.instances[0]
  assert.equal(recognition.lang, 'en-US')
  assert.equal(recognition.continuous, true)
  assert.equal(recognition.interimResults, true)
  recognition.onresult({
    resultIndex: 0,
    results: [
      { isFinal: true, 0: { transcript: 'Could you help me?' } },
      { isFinal: false, 0: { transcript: ' with this?' } }
    ]
  })
  recognition.onend()

  assert.deepEqual(phrases, ['Could you help me?'])
  assert.deepEqual(previews, ['with this?'])
  assert.deepEqual(states, [true, false])
})

test('stopping recognition releases the microphone and clears listening once', () => {
  FakeRecognition.instances = []
  const states = []
  const speech = createSpeechRecognition({
    environment: { webkitSpeechRecognition: FakeRecognition },
    onStateChange: (listening) => states.push(listening)
  })

  speech.start()
  speech.stop()

  assert.equal(FakeRecognition.instances[0].stopped, true)
  assert.deepEqual(states, [true, false])
})

test('microphone permission errors give a useful message', () => {
  assert.match(speechErrorMessage('not-allowed'), /micro/i)
  assert.match(speechErrorMessage('network'), /mạng|Internet/i)
})

test('speech synthesis failures release voice mode instead of throwing', () => {
  let finished = false
  const environment = {
    SpeechSynthesisUtterance: class {},
    speechSynthesis: { cancel() {}, speak() { throw new Error('speech failed') } }
  }

  assert.equal(speakText({ environment, text: 'Hello', onEnd: () => { finished = true } }), false)
  assert.equal(finished, true)
})

test('spoken replies are cleaned and use the requested language', () => {
  let spoken
  let finished = false
  class FakeUtterance {
    constructor(text) {
      this.text = text
    }
  }
  const environment = {
    SpeechSynthesisUtterance: FakeUtterance,
    speechSynthesis: {
      cancel() {},
      speak(utterance) {
        spoken = utterance
      }
    }
  }

  assert.equal(cleanSpeechText('**Hello** (softly) there'), 'Hello there')
  assert.equal(
    speakText({
      environment,
      text: '**Hello** (softly) there',
      lang: 'en-US',
      onEnd: () => {
        finished = true
      }
    }),
    true
  )
  assert.equal(spoken.text, 'Hello there')
  assert.equal(spoken.lang, 'en-US')
  spoken.onend()
  assert.equal(finished, true)
})

