import { useState } from "react";

function App() {
  const [step, setStep] = useState(1)
  const [profile, setProfile]= useState({
    nativeLanguage:'',
    targetLanguage:'',
    goal:''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [placementResult, setPlacementResult] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const handleNext = () => {
    setStep(step + 1)
  }

  const handleChange = (field, value) =>{
    setProfile({...profile,[field]:value})
  }
  const handleSubmitPlacement = async () => {
  setIsLoading(true)
  try {
    const result = await window.api.assessPlacement({
      targetLanguage: profile.targetLanguage,
      answer: profile.placementAnswer
    })
    setPlacementResult(result)

    await window.api.saveProfile({
      nativeLanguage: profile.nativeLanguage,
      targetLanguage: profile.targetLanguage,
      goal: profile.goal,
      cefrLevel: result.level,
      feedback: result.feedback

    })
    handleNext()
  } catch (error) {
    console.error('Error:', error)
  } finally {
    setIsLoading(false)
  }
}

const handleSendMessage = async () => {
  if (!chatInput.trim()) return

  const userMessage = { role: 'user', text: chatInput }
  const newHistory = [...chatHistory, userMessage]
  setChatHistory(newHistory)
  setChatInput('')
  setIsChatLoading(true)

  try {
    const result = await window.api.sendChatMessage({
      cefrLevel: placementResult?.level || 'A1',
      targetLanguage: profile.targetLanguage,
      nativeLanguage: profile.nativeLanguage,
      goal: profile.goal,
      history: chatHistory,
      message: userMessage.text
    })
    setChatHistory([...newHistory, { role: 'model', text: result.reply }])
  } catch (error) {
    console.error('Error:', error)
  } finally {
    setIsChatLoading(false)
  }
}


  if(step==1){
    return(
      <div style={styles.container}>
       <h2 style={styles.question}>Bạn nói ngôn ngữ nào?</h2>
        <input
          style={styles.input}
          type="text"
          placeholder="Ví dụ: Tiếng Việt"
          value={profile.nativeLanguage}
          onChange={(e) => handleChange('nativeLanguage', e.target.value)}
        />
        <button style={styles.button} onClick={handleNext} disabled={!profile.nativeLanguage}>
          Tiếp theo
        </button>
      </div>
    )
  }

  if(step == 2){
    return(
       <div style={styles.container}>
        <h2 style={styles.question}>Bạn muốn học ngôn ngữ nào?</h2>
        <input
          style={styles.input}
          type="text"
          placeholder="Ví dụ: Tiếng Anh"
          value={profile.targetLanguage}
          onChange={(e) => handleChange('targetLanguage', e.target.value)}
        />
        <button style={styles.button} onClick={handleNext} disabled={!profile.targetLanguage}>
          Tiếp theo
        </button>
      </div>
    )
  }

  if (step == 3){
     return (
      <div style={styles.container}>
        <h2 style={styles.question}>Mục tiêu học của bạn là gì?</h2>
        <select
          style={styles.input}
          value={profile.goal}
          onChange={(e) => handleChange('goal', e.target.value)}
        >
          <option value="">-- Chọn mục tiêu --</option>
          <option value="travel">Du lịch</option>
          <option value="work">Công việc</option>
          <option value="exam">Thi cử (IELTS/TOEFL...)</option>
          <option value="general">Giao tiếp chung</option>
        </select>
        <button style={styles.button} onClick={handleNext} disabled={!profile.goal}>
          Hoàn tất
        </button>
      </div>
    )
  }

if (step === 4) {
  return (
    <div style={styles.container}>
      <h2 style={styles.question}>Đánh giá trình độ</h2>
      <p>Hãy viết 2-3 câu bằng {profile.targetLanguage} mô tả một ngày bình thường của bạn.</p>
      <textarea
        style={styles.textarea}
        placeholder="Type your answer here..."
        value={profile.placementAnswer || ''}
        onChange={(e) => handleChange('placementAnswer', e.target.value)}
        disabled={isLoading}
      />
      <button
        style={styles.button}
        onClick={handleSubmitPlacement}
        disabled={!profile.placementAnswer || isLoading}
      >
        {isLoading ? 'Đang chấm điểm...' : 'Nộp bài'}
      </button>
    </div>
  )
}

return (
  <div style={{ ...styles.container, justifyContent: 'flex-start', paddingTop: '30px' }}>
    <h2 style={styles.question}>Luyện tập cùng AI</h2>
    <p style={{ fontSize: '14px', color: '#666' }}>
      Trình độ: {placementResult?.level} | Mục tiêu: {profile.goal}
    </p>

    <div style={styles.chatBox}>
  {chatHistory.map((msg, i) => (
  <div
    key={i}
    style={{
      ...styles.chatBubble,
      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
      background: msg.role === 'user' ? '#111111' : '#f0f0f0',
      color: msg.role === 'user' ? '#ffffff' : '#111111'
    }}
  >
    {formatMessage(msg.text)}
  </div>
))}
      {isChatLoading && <div style={styles.chatBubble}>Đang trả lời...</div>}
    </div>

    <div style={{ display: 'flex', gap: '10px', width: '500px' }}>
      <input
        style={{ ...styles.input, width: '100%' }}
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        placeholder="Nhập tin nhắn..."
        disabled={isChatLoading}
      />
      <button style={styles.button} onClick={handleSendMessage} disabled={isChatLoading}>
        Gửi
      </button>
    </div>
  </div>
)
}

function formatMessage(text) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*.*?\*\*)/g)
    return (
      <div key={i} style={{ marginBottom: line.trim() ? '6px' : '0' }}>
        {parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={j}>{part.slice(2, -2)}</strong>
          ) : (
            part
          )
        )}
      </div>
    )
  })
}
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    gap: '24px',
    fontFamily: "'Segoe UI', sans-serif",
    background: 'radial-gradient(circle at 30% 30%, #e9d5ff 0%, #ffffff 50%, #ffffff 100%)',
    color: '#1a1a1a',
    padding: '20px',
    boxSizing: 'border-box',
    textAlign: 'center'
  },
  question: {
    fontFamily: "'Segoe UI', sans-serif",
    fontSize: '32px',
    fontWeight: '700',
    color: '#111111',
    margin: 0
  },
  input: {
    padding: '14px 20px',
    fontSize: '16px',
    width: '320px',
    borderRadius: '999px',
    border: '1.5px solid #d4d4d8',
    background: '#ffffff',
    color: '#1a1a1a',
    outline: 'none',
    textAlign: 'center'
  },
  textarea: {
    padding: '14px 20px',
    fontSize: '16px',
    width: '380px',
    height: '110px',
    borderRadius: '20px',
    border: '1.5px solid #d4d4d8',
    background: '#ffffff',
    color: '#1a1a1a',
    fontFamily: "'Segoe UI', sans-serif",
    outline: 'none',
    resize: 'none'
  },
  button: {
    padding: '14px 36px',
    fontSize: '15px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    borderRadius: '999px',
    border: '1.5px solid #111111',
    background: '#ffffff',
    color: '#111111',
    cursor: 'pointer',
    textTransform: 'uppercase'
  },


  chatBox: {
  width: '500px',
  height: '350px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  padding: '16px',
  border: '1.5px solid #d4d4d8',
  borderRadius: '16px',
  background: '#ffffff'
},
chatBubble: {
  padding: '10px 16px',
  lineHeight: '1.5',
  borderRadius: '16px',
  maxWidth: '75%',
  fontSize: '15px',
  textAlign: 'left'
},
}


export default App