import { useState ,useEffect,useLayoutEffect } from "react";

const fs = (px) => `calc(${px}px * var(--fs))`

const fontScales = { small: '0.9', medium: '1', large: '1.15', xlarge: '1.3' }

const themes = {
  light: {
    '--bg': 'radial-gradient(circle at 30% 30%, #e9d5ff 0%, #ffffff 50%, #ffffff 100%)',
    '--surface': '#ffffff',
    '--surface-soft': '#fafafa',
    '--panel': 'rgba(255,255,255,0.65)',
    '--text': '#1a1a1a',
    '--text-strong': '#111111',
    '--text-soft': '#555555',
    '--text-muted': '#666666',
    '--border': '#d4d4d8',
    '--border-soft': '#eeeeee',
    '--btn-border': '#111111',
    '--btn-text': '#111111',
    '--bubble-user-bg': '#111111',
    '--bubble-user-text': '#ffffff',
    '--bubble-ai-bg': '#f0f0f0',
    '--accent': '#6366f1',
    '--accent-soft': '#eef2ff',
    '--accent-text': '#4f46e5',
    '--dot-off': '#e5e5e5',
    '--warn-bg': '#fff8e1',
    '--warn-border': '#ffe082',
    '--warn-text': '#5c4400',
    '--shadow': '0 8px 30px rgba(0, 0, 0, 0.08)'
  },
  dark: {
    '--bg': 'radial-gradient(circle at 30% 30%, #2e1f5e 0%, #12111a 55%, #0b0b10 100%)',
    '--surface': '#1c1b26',
    '--surface-soft': '#22212e',
    '--panel': 'rgba(28,27,38,0.7)',
    '--text': '#ececf1',
    '--text-strong': '#ffffff',
    '--text-soft': '#b8b8c4',
    '--text-muted': '#9a9aab',
    '--border': '#3a3948',
    '--border-soft': '#2c2b3a',
    '--btn-border': '#ececf1',
    '--btn-text': '#ececf1',
    '--bubble-user-bg': '#6366f1',
    '--bubble-user-text': '#ffffff',
    '--bubble-ai-bg': '#2a2937',
    '--accent': '#818cf8',
    '--accent-soft': '#26254a',
    '--accent-text': '#a5b4fc',
    '--dot-off': '#3a3948',
    '--warn-bg': '#3a3115',
    '--warn-border': '#6b5a1e',
    '--warn-text': '#f5e6b0',
    '--shadow': '0 8px 30px rgba(0, 0, 0, 0.5)'
  }
}

const defaultSettings = { theme: 'light', fontSize: 'medium', showInlineMistakes: true }

function loadSettings() {
  try {
    const saved = localStorage.getItem('appSettings')
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
  } catch {
    return defaultSettings
  }
}

const iconPaths = {
  book: ['M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  settings: ['M21 4h-7', 'M10 4H3', 'M21 12h-9', 'M8 12H3', 'M21 20h-5', 'M12 20H3', 'M14 2v4', 'M8 10v4', 'M16 18v4'],
  sun: [
    'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z',
    'M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41',
    'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'
  ],
  moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
  monitor: ['M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M8 21h8', 'M12 17v4'],
  close: ['M18 6 6 18', 'm6 6 12 12'],
  warning: ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4', 'M12 17h.01'],
  back: ['m12 19-7-7 7-7', 'M19 12H5']
}

function Icon({ name, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      {iconPaths[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}


const fadeStyle = `
  .fade-in {
    transform: translate3d(40px, 0, 0);
    animation: slideIn 1000ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    will-change: transform;
  }

  @keyframes slideIn {
    from {
      transform: translate3d(40px, 0, 0);
    }
    to {
      transform: translate3d(0, 0, 0);
    }
  }
`;

const layoutCss = `
  @media (max-width: 1100px) { .right-panel { display: none !important; } }
  @media (max-width: 800px) { .sidebar { display: none !important; } }
`

const goalLabels = {
  travel: 'Du lịch',
  work: 'Công việc',
  exam: 'Thi cử',
  general: 'Giao tiếp chung'
}

const chatSuggestions = ['Hello, my name is...', 'Can you help me practice ordering food?', 'Let\'s talk about my day']



function ProgressDots({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current - 1 ? '24px' : '8px',
            height: '8px',
            borderRadius: '999px',
            background: i <= current - 1 ? 'var(--accent)' : 'var(--dot-off)',
            transition: 'all 0.3s ease'
          }}
        />
      ))}
    </div>
  )
}

function AppContent({ settings }) {
  const [step, setStep] = useState(0)
  const [profile, setProfile]= useState({
    nativeLanguage:'',
    targetLanguage:'',
    goal:''
  })
  const [profileId, setProfileId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [placementResult, setPlacementResult] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [mistakes, setMistakes] = useState([])
  const [showReview, setShowReview] = useState(false)
  const [username, setUsername] = useState('')
  const [existingProfiles, setExistingProfiles] = useState([])
  

  useEffect(() => {
  window.api.getProfiles().then((res) => {
    setExistingProfiles(res.profiles || [])
  })
}, [])
  
  const handleStartNewAccount = () => {
  if (!username.trim()) return
  setStep(1)
}

  const handleLoginExisting = async (p) => {
  setUsername(p.username)  
  setProfileId(p.id)
  setProfile({
    nativeLanguage: p.native_language,
    targetLanguage: p.target_language,
    goal: p.goal
  })
  setPlacementResult({ level: p.cefr_level, feedback: '' })

  const historyRes = await window.api.getChatHistory({ profileId: p.id })
  const loadedHistory = (historyRes.messages || []).map(m => ({ role: m.role, text: m.text }))
  setChatHistory(loadedHistory)

  setStep(5) // vào thẳng màn hình chat
}

  const handleNext = () => {
    setStep(step + 1)
  }
  const handleBack = () => {
  setStep(step - 1)
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

   const saveResult = await window.api.saveProfile({
  username: username,
  nativeLanguage: profile.nativeLanguage,
  targetLanguage: profile.targetLanguage,
  goal: profile.goal,
  cefrLevel: result.level,
  feedback: result.feedback
})

setProfileId(saveResult.id)
handleNext()

  } catch (error) {
    console.error('Error:', error)
  } finally {
    setIsLoading(false)
  }
}
  const handleOpenReview = async () => {
  const result = await window.api.getMistakes({ profileId })
  setMistakes(result.mistakes || [])
  setShowReview(true)
}
const refreshMistakes = async () => {
  if (!profileId) return
  const res = await window.api.getMistakes({ profileId })
  setMistakes(res.mistakes || [])
}

useEffect(() => {
  refreshMistakes()
}, [profileId])
const handleSendMessage = async () => {
  if (!chatInput.trim()) return

  const userMessage = { role: 'user', text: chatInput }
  const newHistory = [...chatHistory, userMessage]
  setChatHistory(newHistory)
  setChatInput('')
  setIsChatLoading(true)

  try {
    const result = await window.api.sendChatMessage({
      profileId: profileId,
      cefrLevel: placementResult?.level || 'A1',
      targetLanguage: profile.targetLanguage,
      nativeLanguage: profile.nativeLanguage,
      goal: profile.goal,
      history: chatHistory.slice(-6), // Send last 6 messages for context
      message: userMessage.text
    })
    setChatHistory([...newHistory, { role: 'model', text: result.reply, mistakes: result.mistakes || [] }])
    refreshMistakes() 
  } catch (error) {
    console.error('Error:', error)
  } finally {
    setIsChatLoading(false)
  }
}
const handleLogout = () => {
  setStep(0)
  setProfileId(null)
  setProfile({ nativeLanguage: '', targetLanguage: '', goal: '' })
  setPlacementResult(null)
  setChatHistory([])
  setMistakes([])
  setUsername('')
  setShowReview(false)
  window.api.getProfiles().then((res) => setExistingProfiles(res.profiles || []))
}
const categoryCounts = Object.entries(
  mistakes.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1
    return acc
  }, {})
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3)
if (step === 0) {
  return (
    <div style={styles.container} className="fade-in" key="login">
      <style>{fadeStyle}</style>
      <h2 style={styles.question}>Chào mừng trở lại!</h2>

      {existingProfiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
          {existingProfiles.map((p) => (
            <button key={p.id} style={styles.button} onClick={() => handleLoginExisting(p)}>
              {p.username} ({p.cefr_level})
            </button>
          ))}
        </div>
      )}

      <p style={{ fontSize: fs(14), color: 'var(--text-muted)' }}>— hoặc —</p>

      <input
        style={styles.input}
        type="text"
        placeholder="Nhập tên để tạo tài khoản mới"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button style={styles.button} onClick={handleStartNewAccount} disabled={!username.trim()}>
        Tạo tài khoản mới
      </button>
    </div>
  )
}

if(step==1){
    return(
      <div style={styles.container} className="fade-in" key={step}>
       <style>{fadeStyle}</style>
       <ProgressDots current={1} total={4} />
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
       <div style={styles.container} className="fade-in" key={step}>
        <style>{fadeStyle}</style>
        <ProgressDots current={2} total={4} />
        <h2 style={styles.question}>Bạn muốn học ngôn ngữ nào?</h2>
        <input
          style={styles.input}
          type="text"
          placeholder="Ví dụ: Tiếng Anh"
          value={profile.targetLanguage}
          onChange={(e) => handleChange('targetLanguage', e.target.value)}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ ...styles.backButton, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={handleBack}>
            <Icon name="back" size={16} /> Quay lại
          </button>
          <button style={styles.button} onClick={handleNext} disabled={!profile.targetLanguage}>
            Tiếp theo
          </button>
        </div>
      </div>
    )
  }

if (step == 3){
     return (
      <div style={styles.container} className="fade-in" key={step}>
        <style>{fadeStyle}</style>
        <ProgressDots current={3} total={4} />
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
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ ...styles.backButton, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={handleBack}>
            <Icon name="back" size={16} /> Quay lại
          </button>
          <button style={styles.button} onClick={handleNext} disabled={!profile.goal}>
            Hoàn tất
          </button>
        </div>
      </div>
    )
  }

if (step === 4) {
  return (
    <div style={styles.container} className="fade-in" key={step}>
      <style>{fadeStyle}</style>
      <ProgressDots current={4} total={4} />
      <h2 style={styles.question}>Đánh giá trình độ</h2>
      <p>Hãy viết 2-3 câu bằng {profile.targetLanguage} mô tả một ngày bình thường của bạn.</p>
      <textarea
        style={styles.textarea}
        placeholder="Type your answer here..."
        value={profile.placementAnswer || ''}
        onChange={(e) => handleChange('placementAnswer', e.target.value)}
        disabled={isLoading}
      />
      <div style={{ display: 'flex', gap: '10px' }}>
        <button style={styles.backButton} onClick={handleBack} disabled={isLoading}><Icon name="back" size={16} /> Quay lại</button>
        <button
          style={styles.button}
          onClick={handleSubmitPlacement}
          disabled={!profile.placementAnswer || isLoading}
        >
          {isLoading ? 'Đang chấm điểm...' : 'Nộp bài'}
        </button>
      </div>
    </div>
  )
}

if (showReview) {
  return (
    <div style={{ ...styles.container, justifyContent: 'flex-start', paddingTop: '30px' }} className="fade-in" key="review">
      <style>{fadeStyle}</style>
      <h2 style={styles.question}>Sổ tay lỗi sai</h2>
      <p style={{ fontSize: fs(14), color: 'var(--text-muted)' }}>
        {mistakes.length} lỗi đã ghi nhận
      </p>

      <div style={styles.reviewBox}>
        {mistakes.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>Chưa có lỗi nào được ghi nhận. Hãy trò chuyện nhiều hơn!</p>
        )}
        {mistakes.map((m) => (
          <div key={m.id} style={styles.mistakeCard}>
            <div style={styles.mistakeCategory}>{m.category}</div>
            <div style={{ margin: '6px 0' }}>
              <span style={{ color: '#c0392b', textDecoration: 'line-through' }}>{m.original_text}</span>
              {' → '}
              <span style={{ color: '#27ae60', fontWeight: '600' }}>{m.corrected_text}</span>
            </div>
            <div style={{ fontSize: fs(13), color: 'var(--text-soft)' }}>{m.explanation}</div>
          </div>
        ))}
      </div>

      <button style={styles.button} onClick={() => setShowReview(false)}>
        Quay lại luyện tập
      </button>
    </div>
  )
}

return (
  <div style={styles.appLayout} className="fade-in" key={step}>
    <style>{fadeStyle}</style>
    <style>{layoutCss}</style>

    {/* Sidebar trái */}
    <aside className="sidebar" style={styles.sidebar}>
      <div style={styles.avatar}>{username ? username.charAt(0).toUpperCase() : '?'}</div>
      <div style={{ fontWeight: '700', fontSize: fs(18) }}>{username || 'Học viên'}</div>
      <div style={styles.levelBadge}>Trình độ {placementResult?.level}</div>
      <div style={{ fontSize: fs(13), color: 'var(--text-muted)' }}>
        Mục tiêu: {goalLabels[profile.goal] || profile.goal}
      </div>
      <div style={{ flex: 1 }} />
      <button style={{ ...styles.sidebarButton, display: 'flex', alignItems: 'center', gap: '10px' }} onClick={handleOpenReview}>
  <Icon name="book" /> Sổ tay lỗi sai
</button>
<button style={{ ...styles.sidebarButton, display: 'flex', alignItems: 'center', gap: '10px' }} onClick={handleLogout}>
  <Icon name="logout" /> Đăng xuất
</button>
    </aside>

    {/* Khu vực chat giữa */}
    <main style={styles.mainArea}>
      <h2 style={{ ...styles.question, fontSize: fs(26) }}>Luyện tập cùng AI</h2>

      <div style={styles.chatBoxFull}>
        {chatHistory.length === 0 && !isChatLoading && (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: '14px' }}>Bắt đầu cuộc trò chuyện — thử một gợi ý:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {chatSuggestions.map((s) => (
                <button key={s} style={styles.suggestionChip} onClick={() => setChatInput(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

       {chatHistory.map((msg, i) => (
  <div
    key={i}
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
    }}
  >
    <div
      style={{
        ...styles.chatBubble,
        background: msg.role === 'user' ? 'var(--bubble-user-bg)' : 'var(--bubble-ai-bg)',
        color: msg.role === 'user' ? 'var(--bubble-user-text)' : 'var(--text)'
      }}
    >
      {formatMessage(msg.text)}
    </div>
    {settings.showInlineMistakes && msg.mistakes && msg.mistakes.length > 0 && (
      <div style={styles.mistakeBox}>
        {msg.mistakes.map((m, j) => (
          <div key={j} style={{ marginBottom: j < msg.mistakes.length - 1 ? '8px' : 0 }}>
            <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
  <Icon name="warning" size={14} /> {m.category}:
</strong>{' '}
"{m.original}" → <strong>"{m.corrected}"</strong>
            <div style={{ fontSize: fs(13), color: 'var(--text-soft)', marginTop: '2px' }}>{m.explanation}</div>
          </div>
        ))}
      </div>
    )}
  </div>
))}
        {isChatLoading && <div style={styles.chatBubble}>Đang trả lời...</div>}
      </div>

      <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '980px' }}>
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
    </main>

    {/* Panel thống kê phải */}
    <aside className="right-panel" style={styles.rightPanel}>
      <h3 style={{ margin: 0, fontSize: fs(16), fontWeight: '700' }}>Thống kê của bạn</h3>

      <div style={styles.statCard}>
        <div style={{ fontSize: fs(32), fontWeight: '700', color: 'var(--accent)' }}>{mistakes.length}</div>
        <div style={{ fontSize: fs(13), color: 'var(--text-muted)' }}>lỗi đã ghi nhận</div>
      </div>

      <div style={styles.statCard}>
        <div style={{ fontSize: fs(13), fontWeight: '700', marginBottom: '8px' }}>Lỗi hay gặp nhất</div>
        {categoryCounts.length === 0 && <div style={{ fontSize: fs(13), color: 'var(--text-muted)' }}>Chưa có dữ liệu</div>}
        {categoryCounts.map(([cat, count]) => (
          <div key={cat} style={{ fontSize: fs(13), display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>{cat}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>

      <div style={styles.statCard}>
        <div style={{ fontSize: fs(13), fontWeight: '700', marginBottom: '8px' }}>Lỗi gần đây</div>
        {mistakes.length === 0 && <div style={{ fontSize: fs(13), color: 'var(--text-muted)' }}>Chưa có lỗi nào</div>}
        {mistakes.slice(0, 3).map((m) => (
          <div key={m.id} style={{ fontSize: fs(13), marginBottom: '8px' }}>
            <span style={{ color: '#c0392b', textDecoration: 'line-through' }}>{m.original_text}</span>
            {' → '}
            <span style={{ color: '#27ae60', fontWeight: '600' }}>{m.corrected_text}</span>
          </div>
        ))}
      </div>
    </aside>
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
    fontSize: fs(16),
    background: 'var(--bg)',
    color: 'var(--text)',
    padding: '20px',
    boxSizing: 'border-box',
    textAlign: 'center'
  },
  question: {
    fontFamily: "'Segoe UI', sans-serif",
    fontSize: fs(32),
    fontWeight: '700',
    color: 'var(--text-strong)',
    margin: 0
  },
  input: {
    padding: '14px 20px',
    fontSize: fs(16),
    width: '320px',
    borderRadius: '999px',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    outline: 'none',
    textAlign: 'center'
  },
  textarea: {
    padding: '14px 20px',
    fontSize: fs(16),
    width: '380px',
    height: '110px',
    borderRadius: '20px',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontFamily: "'Segoe UI', sans-serif",
    outline: 'none',
    resize: 'none'
  },
  button: {
    padding: '14px 36px',
    fontSize: fs(15),
    fontWeight: '700',
    letterSpacing: '0.5px',
    borderRadius: '999px',
    border: '1.5px solid var(--btn-border)',
    background: 'var(--surface)',
    color: 'var(--btn-text)',
    cursor: 'pointer',
    textTransform: 'uppercase'
  },
  backButton: {
    padding: '14px 24px',
    fontSize: fs(15),
    fontWeight: '600',
    borderRadius: '999px',
    border: '1.5px solid transparent',
    background: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer'
  },
  chatBubble: {
    padding: '10px 16px',
    lineHeight: '1.5',
    borderRadius: '16px',
    maxWidth: '75%',
    fontSize: fs(15),
    textAlign: 'left'
  },
  reviewBox: {
    width: '500px',
    maxHeight: '400px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  mistakeCard: {
    padding: '14px 18px',
    borderRadius: '14px',
    border: '1.5px solid var(--border-soft)',
    background: 'var(--surface-soft)',
    textAlign: 'left'
  },
  mistakeCategory: {
    fontSize: fs(12),
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'var(--accent)',
    letterSpacing: '0.5px'
  },
  reviewLink: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    fontSize: fs(14),
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0
  },
  appLayout: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    boxSizing: 'border-box',
    fontFamily: "'Segoe UI', sans-serif",
    fontSize: fs(16),
    background: 'var(--bg)',
    color: 'var(--text)'
  },
  sidebar: {
    width: '260px',
    flexShrink: 0,
    padding: '32px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--panel)',
    borderRight: '1px solid var(--border-soft)',
    boxSizing: 'border-box'
  },
  avatar: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: '#6366f1',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '30px',
    fontWeight: '700'
  },
  levelBadge: {
    padding: '6px 14px',
    borderRadius: '999px',
    background: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    fontWeight: '700',
    fontSize: fs(13)
  },
  sidebarButton: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid var(--border-soft)',
    background: 'var(--surface)',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: fs(14),
    fontWeight: '600',
    textAlign: 'left'
  },
  mainArea: {
    flex: 1,
    minWidth: 0,
    height: '100vh',
    boxSizing: 'border-box',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  chatBoxFull: {
    width: '100%',
    maxWidth: '980px',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '20px',
    borderRadius: '20px',
    background: 'var(--surface)',
    boxShadow: 'var(--shadow)',
    boxSizing: 'border-box'
  },
  rightPanel: {
    width: '300px',
    flexShrink: 0,
    padding: '32px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    background: 'var(--panel)',
    borderLeft: '1px solid var(--border-soft)',
    boxSizing: 'border-box',
    overflowY: 'auto'
  },
  statCard: {
    padding: '14px 16px',
    borderRadius: '14px',
    background: 'var(--surface)',
    border: '1.5px solid var(--border-soft)',
    textAlign: 'left'
  },
  suggestionChip: {
    padding: '8px 14px',
    borderRadius: '999px',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: fs(13)
  },
  mistakeBox: {
    padding: '10px 14px',
    borderRadius: '10px',
    maxWidth: '75%',
    fontSize: fs(14),
    background: 'var(--warn-bg)',
    border: '1px solid var(--warn-border)',
    color: 'var(--warn-text)',
    textAlign: 'left'
  }
}

const settingsStyles = {
  gear: {
    position: 'fixed',
    top: '12px',
    right: '16px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '18px',
    cursor: 'pointer',
    zIndex: 1000,
    boxShadow: 'var(--shadow)'
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000
  },
  modal: {
    width: '440px',
    maxWidth: '92vw',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '24px',
    borderRadius: '20px',
    background: 'var(--surface)',
    color: 'var(--text)',
    boxShadow: 'var(--shadow)',
    fontFamily: "'Segoe UI', sans-serif",
    textAlign: 'left',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '18px',
    cursor: 'pointer'
  },
  group: { marginBottom: '20px' },
  label: { fontSize: fs(14), fontWeight: '700', marginBottom: '8px' },
  optionRow: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  optionButton: {
    padding: '8px 14px',
    borderRadius: '999px',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: fs(13),
    cursor: 'pointer'
  },
  optionActive: {
    background: 'var(--accent)',
    borderColor: 'var(--accent)',
    color: '#ffffff'
  },
  preview: {
    marginTop: '12px',
    padding: '10px 14px',
    borderRadius: '12px',
    background: 'var(--surface-soft)',
    border: '1.5px solid var(--border-soft)',
    fontSize: fs(15)
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px'
  }
}

function SettingsModal({ settings, onChange, onClose }) {
  const choices = (key, items) => (
    <div style={settingsStyles.optionRow}>
      {items.map(([value, label]) => (
        <button
          key={value}
          style={{
            ...settingsStyles.optionButton,display: 'inline-flex', alignItems: 'center', gap: '6px',
            ...(settings[key] === value ? settingsStyles.optionActive : {})
          }}
          onClick={() => onChange({ [key]: value })}
        >
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <div style={settingsStyles.overlay} onClick={onClose}>
      <div style={settingsStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={settingsStyles.header}>
          <h3 style={{ margin: 0, fontSize: fs(20), fontWeight: '700' }}>Cài đặt</h3>
          <button style={{ ...settingsStyles.closeButton, display: 'flex', alignItems: 'center', }} onClick={onClose}><Icon name="close" /></button>
        </div>

        <div style={settingsStyles.group}>
          <div style={settingsStyles.label}>Giao diện</div>
          {choices('theme', [
  ['light', <><Icon name="sun" size={15} /> Sáng</>],
  ['dark', <><Icon name="moon" size={15} /> Tối</>],
  ['system', <><Icon name="monitor" size={15} /> Theo hệ thống</>]
])}
        </div>

        <div style={settingsStyles.group}>
          <div style={settingsStyles.label}>Cỡ chữ</div>
          {choices('fontSize', [
            ['small', 'Nhỏ'],
            ['medium', 'Vừa'],
            ['large', 'Lớn'],
            ['xlarge', 'Rất lớn']
          ])}
          <div style={settingsStyles.preview}>Xem trước: I like learning English every day.</div>
        </div>

        <div style={settingsStyles.toggleRow}>
          <div>
            <div style={settingsStyles.label}>Hiện gợi ý sửa lỗi trong khung chat</div>
            <div style={{ fontSize: fs(12), color: 'var(--text-muted)' }}>
              Lỗi vẫn được lưu vào Sổ tay dù tắt
            </div>
          </div>
          <button
            style={{
              ...settingsStyles.optionButton,display: 'inline-flex', alignItems: 'center', gap: '6px',
              ...(settings.showInlineMistakes ? settingsStyles.optionActive : {})
            }}
            onClick={() => onChange({ showInlineMistakes: !settings.showInlineMistakes })}
          >
            {settings.showInlineMistakes ? 'Bật' : 'Tắt'}
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [showSettings, setShowSettings] = useState(false)

  useLayoutEffect(() => {
    const apply = () => {
      const isDark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      const root = document.documentElement
      Object.entries(isDark ? themes.dark : themes.light).forEach(([k, v]) =>
        root.style.setProperty(k, v)
      )
      root.style.setProperty('--fs', fontScales[settings.fontSize] || '1')
    }

    apply()
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings))
    } catch {
      // bỏ qua nếu không lưu được
    }

    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [settings])

  const updateSettings = (patch) => setSettings((prev) => ({ ...prev, ...patch }))

  return (
    <>
      <AppContent settings={settings} />
      <button style={{ ...settingsStyles.gear, display: 'flex', alignItems: 'center', justifyContent: 'center', }} onClick={() => setShowSettings(true)} title="Cài đặt">
        <Icon name="settings" size={20} />
      </button>
      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  )
}

export default App