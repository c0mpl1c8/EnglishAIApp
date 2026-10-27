import test from 'node:test'
import assert from 'node:assert/strict'
import { matchesSpokenSentence } from './answer.mjs'

test('a full spoken cloze answer ignores punctuation and capitalization', () => {
  assert.equal(matchesSpokenSentence('I am doing good today.', 'I am doing good today'), true)
  assert.equal(matchesSpokenSentence('i am doing good today!', 'I am doing good today'), true)
})

test('a spoken cloze answer must contain the full sentence', () => {
  assert.equal(matchesSpokenSentence('good', 'I am doing good today'), false)
})

test('a genuinely different word is not mistaken for punctuation', () => {
  assert.equal(matchesSpokenSentence('I am doing good today.', 'I am doing well today'), false)
})
