const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase()

export function orderListeningQuestions(transcript, questions, expectedTypes) {
  if (questions.length !== expectedTypes.length) return null
  const actualTypes = questions.map((question) => question?.type).sort()
  if (actualTypes.some((type, index) => type !== [...expectedTypes].sort()[index])) return null

  const spoken = normalize(transcript)
  const located = questions.map((question) => {
    const evidence = normalize(question?.evidence)
    if (evidence.length < 8) return null
    const start = spoken.indexOf(evidence)
    if (start < 0 || spoken.indexOf(evidence, start + 1) >= 0) return null
    if (!['multiple_choice', 'matching'].includes(question.type) && !evidence.includes(normalize(question.answer))) return null
    return { ...question, start, end: start + evidence.length }
  })
  if (located.some((question) => !question)) return null
  located.sort((a, b) => a.start - b.start)
  if (located.some((question, index) => index > 0 && question.start < located[index - 1].end)) return null
  return located.map(({ evidence, start, end, ...question }) => question)
}
