const normalize = (value) => String(value || '').toLocaleLowerCase()
  .normalize('NFKC')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim()

export function containsVietnameseText(value) {
  const vietnameseDiacritics = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổộơờớợởỡùúủũụưừứửữựỳýỷỹỵđ]/iu
  const words = String(value || '').match(/\p{L}+/gu) || []
  return words.filter((word) => vietnameseDiacritics.test(word)).length >= 2
}

export function normalizeListeningQuestionText(type, text, answer) {
  if (!['note_completion', 'sentence_completion'].includes(type)) return text
  const normalizedText = String(text || '').replace(/_+/g, '____')
  if (normalizedText.includes('____')) return normalizedText

  const normalizedAnswer = String(answer || '').trim()
  if (!normalizedAnswer) return null
  const answerPattern = normalizedAnswer.split(/\s+/).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+')
  const answerMatch = new RegExp(`(^|[^\\p{L}\\p{N}])(${answerPattern})(?=$|[^\\p{L}\\p{N}])`, 'iu')
  return answerMatch.test(normalizedText)
    ? normalizedText.replace(answerMatch, '$1____')
    : null
}

export function resolveListeningOptionIndex(options, answer, answerIndex) {
  if (answerIndex !== undefined) {
    return Number.isInteger(answerIndex) && answerIndex >= 0 && answerIndex < options.length
      ? answerIndex
      : -1
  }
  const normalizedAnswer = normalize(answer)
  return options.findIndex((option) => normalize(option) === normalizedAnswer)
}

export function isListeningAnswerWithinLimit(type, answer) {
  const value = String(answer || '').trim()
  if (!value || value.length > 80) return false
  return type !== 'short_answer' || value.split(/\s+/).length <= 3
}

export function selectListeningQuestionsByType(questions, expectedTypes) {
  const selected = []
  for (const type of expectedTypes) {
    const question = questions.find((item) => item?.type === type && !selected.includes(item))
    if (!question) return null
    selected.push(question)
  }
  return selected
}

export function validateAndOrderListeningQuestions(transcript, questions, expectedTypes) {
  if (questions.length !== expectedTypes.length) return { questions: null, error: 'wrong question count' }
  const actualTypes = questions.map((question) => question?.type).sort()
  if (actualTypes.some((type, index) => type !== [...expectedTypes].sort()[index])) {
    return { questions: null, error: 'question types do not match the required set' }
  }

  const spoken = normalize(transcript)
  const located = questions.map((question) => {
    const evidence = normalize(question?.evidence)
    if (evidence.length < 8) return { error: 'evidence is too short' }
    const start = spoken.indexOf(evidence)
    if (start < 0) return { error: 'evidence does not match the transcript' }
    if (spoken.indexOf(evidence, start + 1) >= 0) return { error: 'evidence is not unique in the transcript' }
    if (!['multiple_choice', 'matching'].includes(question.type) && !evidence.includes(normalize(question.answer))) {
      return { error: 'fill-in answer is missing from its evidence' }
    }
    return { ...question, start, end: start + evidence.length }
  })
  const invalid = located.find((question) => question.error)
  if (invalid) return { questions: null, error: invalid.error }
  located.sort((a, b) => a.start - b.start)
  if (located.some((question, index) => index > 0 && question.start < located[index - 1].end)) {
    return { questions: null, error: 'question evidence overlaps' }
  }
  return {
    questions: located.map(({ evidence, start, end, ...question }) => question),
    error: null
  }
}

export function orderListeningQuestions(transcript, questions, expectedTypes) {
  return validateAndOrderListeningQuestions(transcript, questions, expectedTypes).questions
}
