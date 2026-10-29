import test from 'node:test'
import assert from 'node:assert/strict'
import { orderListeningQuestions } from './listeningOrder.mjs'

const transcript = 'First we meet at the station. Then buy two tickets. Finally take the blue train.'
const questions = [
  { type: 'short_answer', answer: 'blue', evidence: 'the blue train', question: 'Which train?' },
  { type: 'multiple_choice', answer: 0, evidence: 'meet at the station', question: 'Where?' },
  { type: 'note_completion', answer: 'two', evidence: 'buy two tickets', question: 'Buy ____ tickets.' }
]

test('orders listening questions by where their evidence occurs in the audio', () => {
  const ordered = orderListeningQuestions(transcript, questions, ['multiple_choice', 'note_completion', 'short_answer'])
  assert.deepEqual(ordered.map((question) => question.type), ['multiple_choice', 'note_completion', 'short_answer'])
  assert.ok(ordered.every((question) => !('evidence' in question)))
})

test('rejects missing, overlapping, or unsupported evidence', () => {
  assert.equal(orderListeningQuestions(transcript, [{ ...questions[0], evidence: 'red train' }, ...questions.slice(1)], ['multiple_choice', 'note_completion', 'short_answer']), null)
  assert.equal(orderListeningQuestions(transcript, [{ ...questions[0], evidence: 'buy two tickets. Finally take the blue train' }, ...questions.slice(1)], ['multiple_choice', 'note_completion', 'short_answer']), null)
  assert.equal(orderListeningQuestions(transcript, [{ ...questions[0], answer: 'red' }, ...questions.slice(1)], ['multiple_choice', 'note_completion', 'short_answer']), null)
})
