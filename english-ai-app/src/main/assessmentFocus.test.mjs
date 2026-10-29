import test from 'node:test'
import assert from 'node:assert/strict'
import { structureIdForAssessmentFocus, summarizeAssessmentFocuses } from './assessmentFocus.mjs'

test('English assessment topics map to Vietnamese structure notes', () => {
  assert.equal(structureIdForAssessmentFocus('Present Simple Tense (Subject-Verb Agreement)'), 'present_simple')
  assert.equal(structureIdForAssessmentFocus('Subject-Verb Agreement (Possession)'), 'agreement')
  assert.equal(structureIdForAssessmentFocus('Hiện tại đơn'), 'present_simple')
  assert.equal(structureIdForAssessmentFocus('Question formation in Past Simple'), 'past_simple')
})

test('latest assessment answers are grouped by the same structure', () => {
  const result = summarizeAssessmentFocuses([
    { skill: 'tense', focus: 'Present Simple Tense', picked: 0, answer: 1 },
    { skill: 'tense', focus: 'Simple Present', picked: 2, answer: 2 },
    { skill: 'article', focus: 'Indefinite Article', picked: 0, answer: 1 }
  ])
  assert.deepEqual(result.map(({ structureId, correct, total }) => ({ structureId, correct, total })), [
    { structureId: 'present_simple', correct: 1, total: 2 },
    { structureId: 'articles', correct: 0, total: 1 }
  ])
})

test('stored structure id links a specific question when its focus wording varies', () => {
  const [result] = summarizeAssessmentFocuses([
    { skill: 'tense', focus: 'Daily routines', structureId: 'present_simple', picked: 1, answer: 1 }
  ])
  assert.equal(result.structureId, 'present_simple')
})
