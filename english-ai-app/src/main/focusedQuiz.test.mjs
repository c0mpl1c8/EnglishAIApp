import test from 'node:test'
import assert from 'node:assert/strict'
import { selectFocusedQuestions } from './focusedQuiz.mjs'

test('a focused review never includes questions from another tense or skill', () => {
  const questions = [
    ...Array.from({ length: 6 }, (_, id) => ({ id, skill: 'tense', focus: 'Past Simple Tense' })),
    { id: 6, skill: 'tense', focus: 'Present Simple Tense' },
    { id: 7, skill: 'article', focus: 'Past Simple Tense' }
  ]
  assert.deepEqual(selectFocusedQuestions(questions, 'tense', 'Past Simple Tense').map((item) => item.id), [0, 1, 2, 3, 4, 5])
  assert.equal(selectFocusedQuestions(questions.slice(2), 'tense', 'Past Simple Tense'), null)
})
