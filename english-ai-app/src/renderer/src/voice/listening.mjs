export function normalizeListeningAnswer(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isListeningAnswerCorrect(question, response) {
  if (!question) return false
  if (question.type === 'multiple_choice' || question.type === 'matching') return Number.isInteger(response) && response === question.answer
  const given = normalizeListeningAnswer(response)
  return Boolean(given) && [question.answer, ...(question.acceptedAnswers || [])].some((answer) => normalizeListeningAnswer(answer) === given)
}
