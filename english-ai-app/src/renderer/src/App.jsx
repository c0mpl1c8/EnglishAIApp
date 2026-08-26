import { useState } from "react";

function App() {
  const [step, setStep] = useState(1)
  const [profile, setProfile]= useState({
    nativeLanguage:'',
    targetLanguage:'',
    goal:''
  })
  const handleNext = () => {
    setStep(step + 1)
  }

  const handleChange = (field, value) =>{
    setProfile({...profile,[field]:value})
  }

  if(step==1){
    return(
      <div style={styles.container}>
        <h2>Bạn nói ngôn ngữ nào?</h2>
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
        <h2>Bạn muốn học ngôn ngữ nào?</h2>
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
        <h2>Mục tiêu học của bạn là gì?</h2>
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

  return (
     <div style={styles.container}>
      <h2>Hoàn tất!</h2>
      <p>Ngôn ngữ mẹ đẻ: {profile.nativeLanguage}</p>
      <p>Ngôn ngữ muốn học: {profile.targetLanguage}</p>
      <p>Mục tiêu: {profile.goal}</p>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '16px',
    fontFamily: 'sans-serif'
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    width: '250px',
    borderRadius: '6px',
    border: '1px solid #ccc'
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    borderRadius: '6px',
    border: 'none',
    background: '#4a90d9',
    color: 'white',
    cursor: 'pointer'
  }
}

export default App