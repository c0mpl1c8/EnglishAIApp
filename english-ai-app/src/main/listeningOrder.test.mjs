import test from 'node:test'
import assert from 'node:assert/strict'
import { containsVietnameseText, isListeningAnswerWithinLimit, normalizeListeningQuestionText, orderListeningQuestions, resolveListeningOptionIndex, selectListeningQuestionsByType, validateAndOrderListeningQuestions } from './listeningOrder.mjs'

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

test('matches evidence and answers despite punctuation or capitalization differences', () => {
  const variedTranscript = 'FIRST, we meet at the station! Then buy two tickets; finally take the blue train.'
  const variedQuestions = questions.map((question) => ({
    ...question,
    evidence: question.evidence === 'buy two tickets' ? 'BUY TWO tickets!' : question.evidence.toUpperCase(),
    answer: question.answer === 'two' ? 'TWO.' : question.answer
  }))

  const ordered = orderListeningQuestions(variedTranscript, variedQuestions, ['multiple_choice', 'note_completion', 'short_answer'])
  assert.deepEqual(ordered.map((question) => question.type), ['multiple_choice', 'note_completion', 'short_answer'])
})

test('normalizes missing completion markers when the answer is present in the question', () => {
  assert.equal(normalizeListeningQuestionText('note_completion', 'They will meet on Friday.', 'Friday'), 'They will meet on ____.')
  assert.equal(normalizeListeningQuestionText('sentence_completion', 'The train leaves at _____.', 'Friday'), 'The train leaves at ____.')
  assert.equal(normalizeListeningQuestionText('note_completion', 'They will meet on _.', 'Friday'), 'They will meet on ____.')
  assert.equal(normalizeListeningQuestionText('note_completion', 'Where will they meet?', 'Friday'), null)
  assert.equal(normalizeListeningQuestionText('short_answer', 'Where will they meet?', 'Friday'), 'Where will they meet?')
})

test('resolves multiple-choice answers by index or normalized option text', () => {
  const options = ['The blue train.', 'A red bus', 'A taxi', 'A bicycle']
  assert.equal(resolveListeningOptionIndex(options, undefined, 0), 0)
  assert.equal(resolveListeningOptionIndex(options, ' the blue train ', undefined), 0)
  assert.equal(resolveListeningOptionIndex(options, 'Blue train', undefined), -1)
  assert.equal(resolveListeningOptionIndex(options, 'The blue train.', 5), -1)
})

test('limits short-answer length without rejecting longer completion answers', () => {
  assert.equal(isListeningAnswerWithinLimit('short_answer', 'at the community center'), false)
  assert.equal(isListeningAnswerWithinLimit('short_answer', 'community center'), true)
  assert.equal(isListeningAnswerWithinLimit('note_completion', 'at the community center'), true)
  assert.equal(isListeningAnswerWithinLimit('sentence_completion', 'a quiet community center near the river'), true)
  assert.equal(isListeningAnswerWithinLimit('note_completion', 'x'.repeat(81)), false)
})

test('keeps one question of every required type when the model returns extras', () => {
  const extras = [
    { type: 'multiple_choice', id: 'first-choice' },
    { type: 'multiple_choice', id: 'extra-choice' },
    { type: 'matching', id: 'matching' },
    { type: 'note_completion', id: 'note' },
    { type: 'short_answer', id: 'short' },
    { type: 'sentence_completion', id: 'sentence' }
  ]
  const selected = selectListeningQuestionsByType(extras, ['multiple_choice', 'matching', 'note_completion', 'short_answer', 'sentence_completion'])
  assert.deepEqual(selected.map((question) => question.id), ['first-choice', 'matching', 'note', 'short', 'sentence'])
  assert.equal(selectListeningQuestionsByType(extras.slice(2), ['multiple_choice', 'matching', 'note_completion', 'short_answer', 'sentence_completion']), null)
})

test('reports why listening question evidence was rejected', () => {
  const result = validateAndOrderListeningQuestions(
    transcript,
    [{ ...questions[0], evidence: 'the red train' }, ...questions.slice(1)],
    ['multiple_choice', 'note_completion', 'short_answer']
  )
  assert.equal(result.questions, null)
  assert.equal(result.error, 'evidence does not match the transcript')
})

test('detects Vietnamese learner-facing content without rejecting English dialogue', () => {
  assert.equal(containsVietnameseText('Lập kế hoạch sửa chữa điện thoại. Chi phí thay màn hình là năm trăm đồng.'), true)
  assert.equal(containsVietnameseText('The phone screen is cracked, and repairs cost five hundred dollars.'), false)
  assert.equal(containsVietnameseText('Please bring a café menu.'), false)
})
