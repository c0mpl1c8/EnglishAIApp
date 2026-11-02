import assert from 'node:assert/strict'
import test from 'node:test'
import { chooseWritingAssessmentPrompt, writingAssessmentPrompts } from './writingAssessment.mjs'

test('writing assessment prompts include varied topics', () => {
  assert.ok(writingAssessmentPrompts.length > 1)
  assert.ok(new Set(writingAssessmentPrompts).size === writingAssessmentPrompts.length)
})

test('chooses a different writing prompt from the previous assessment', () => {
  for (const previous of writingAssessmentPrompts) {
    const next = chooseWritingAssessmentPrompt(previous, () => 0)
    assert.notEqual(next, previous)
    assert.ok(writingAssessmentPrompts.includes(next))
  }
})

test('selects prompts across the full list', () => {
  assert.equal(chooseWritingAssessmentPrompt(null, () => 0), writingAssessmentPrompts[0])
  assert.equal(chooseWritingAssessmentPrompt(null, () => 0.99), writingAssessmentPrompts.at(-1))
})
