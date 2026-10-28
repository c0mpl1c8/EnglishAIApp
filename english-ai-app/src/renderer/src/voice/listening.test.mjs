import assert from 'node:assert/strict'
import test from 'node:test'
import { isListeningAnswerCorrect } from './listening.mjs'

test('listening completion accepts case, punctuation and listed alternatives', () => {
  const question = { type: 'note_completion', answer: 'Central Library', acceptedAnswers: ['the Central Library'] }
  assert.equal(isListeningAnswerCorrect(question, ' central library! '), true)
  assert.equal(isListeningAnswerCorrect(question, 'The Central Library'), true)
  assert.equal(isListeningAnswerCorrect(question, 'City Library'), false)
})

test('listening choice requires the selected option index', () => {
  assert.equal(isListeningAnswerCorrect({ type: 'matching', answer: 2 }, 2), true)
  assert.equal(isListeningAnswerCorrect({ type: 'matching', answer: 2 }, 1), false)
})
