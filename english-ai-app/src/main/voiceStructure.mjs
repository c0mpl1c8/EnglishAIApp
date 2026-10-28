const practiceCue = /\b(?:sentence|pattern|structure|using|answer with|start with|say a|make a|try a)\b/i

function isPatternAttempt(message, title) {
  const learnerText = String(message || '').trim()
  if (/^(?:hi|hello|hey|good morning|good afternoon|good evening|yes|no|okay|ok)\b/i.test(learnerText)) return false
  if (/there is\s*\/\s*there are/i.test(title)) return /\bthere\s+(?:is|are)\b|\bthere['’]s\b/i.test(learnerText)
  if (/câu điều kiện loại 1/i.test(title)) return /\bif\b[\s\S]*\bwill\b|\bwill\b[\s\S]*\bif\b/i.test(learnerText)
  if (/hòa hợp chủ ngữ/i.test(title)) return /^(?:i|you|we|they|he|she|it)\s+[a-z]+(?:['’][a-z]+)?\b/i.test(learnerText)
  return learnerText.split(/\s+/).length >= 4
}

export function isLearnerStuck(message) {
  return /^(?:i\s+(?:do\s+not|don['’]?t)\s+know|i['’]?m\s+not\s+sure|i\s+can['’]?t|not\s+sure|no\s+idea|i\s+need\s+help)\b/i.test(String(message || '').trim())
}

export function hasActionablePracticePrompt(reply) {
  const text = String(reply || '')
  return /\?/u.test(text) || /\b(?:say|make|give|create|answer|describe|repeat|try)\b[\s\S]{0,160}\b(?:sentence|pattern|using|about|starting with|start with)\b/i.test(text)
}

export function needsVoiceStructureRedirect(reply, title = '', learnerMessage = '') {
  const text = String(reply || '').trim()
  if (!text) return true
  if (isLearnerStuck(learnerMessage)) return false
  // A real attempt deserves contextual feedback from the tutor. Do not replace
  // it merely because the follow-up question omits the word "pattern".
  if (isPatternAttempt(learnerMessage, title)) return false
  const finalPrompt = text.split(/(?<=[.!?])\s+/).at(-1) || text
  if (/câu điều kiện loại 1/i.test(title) && /\bif\b/i.test(finalPrompt) && /\bwill\b/i.test(finalPrompt)) return false
  return !practiceCue.test(finalPrompt)
}

export function makeVoiceStructureRedirect(title, example, turn = 0) {
  const model = String(example || '').trim().replace(/[.!?]+$/, '')
  const exampleLine = model ? ` For example: "${model}."` : ''
  if (/there is\s*\/\s*there are/i.test(title)) {
    const places = ['your room', 'your classroom', 'your kitchen']
    const place = places[turn % places.length]
    return `Let's practice "There is" and "There are."${exampleLine} Tell me what is in ${place}. Please answer with one full sentence starting with "There is" or "There are."`
  }
  const topics = ['your home', 'your school or work', 'something you did today']
  return `Let's keep practicing this sentence pattern.${exampleLine} Now make one full sentence about ${topics[turn % topics.length]} using the same pattern.`
}

export function makeVoiceStructureNextStep(title, turn = 0) {
  if (/hòa hợp chủ ngữ/i.test(title)) {
    return [
      "Now we're ordering at a café. What do you need to drink? Start with 'I need'.",
      "At school, your classmate forgot something. What does your classmate need for class? Use 'He needs' or 'She needs'.",
      "Let's imagine we're packing for a trip. What does your friend need to bring? Answer with 'He needs' or 'She needs'."
    ][turn % 3]
  }
  if (/there is\s*\/\s*there are/i.test(title)) {
    return [
      "Imagine you're showing me your room. What is on your desk? Start with 'There is' or 'There are'.",
      "Now we're in a classroom. What can you see around us? Answer with 'There is' or 'There are'."
    ][turn % 2]
  }
  if (/câu điều kiện loại 1/i.test(title)) {
    return [
      'Imagine it rains during your trip tomorrow. What will you do if it rains?',
      'Your friend may be late for class. What will you do if your friend is late?'
    ][turn % 2]
  }
  return 'Imagine you are describing your day to a friend. What would you say using the sentence pattern we are practicing?'
}

export function makeVoiceStructureSameScenePrompt(title) {
  if (/hòa hợp chủ ngữ/i.test(title)) return "Let's stay with this person. Please try one full sentence using 'He' or 'She' and the correct verb form."
  if (/there is\s*\/\s*there are/i.test(title)) return "Let's stay in the same place. Please say one full sentence starting with 'There is' or 'There are'."
  if (/câu điều kiện loại 1/i.test(title)) return "Let's keep the same situation. Please try one full sentence starting with 'If' and ending with 'will' plus a verb."
  return 'Let\'s stay with the same situation. Please try one full sentence using the pattern from the example.'
}

export function isVoiceStructureReset(reply, previousReplies = []) {
  const text = String(reply || '').trim()
  const normalized = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  if (!normalized) return true
  if (/since you are a student|since you re a student|let s practice the sentence pattern again|remember he she it/i.test(normalized)) return true
  return previousReplies.some((previous) => String(previous || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim() === normalized)
}
