export function selectFocusedQuestions(questions, skill, focus, minimum = 6) {
  const expected = String(focus || '').trim().toLocaleLowerCase()
  const selected = (questions || []).filter((question) =>
    question.skill === skill && String(question.focus || '').trim().toLocaleLowerCase() === expected
  )
  return selected.length >= minimum ? selected : null
}
