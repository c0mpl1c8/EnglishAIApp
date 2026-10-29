import test from 'node:test'
import assert from 'node:assert/strict'
import { advanceA1AssessmentRank } from './assessmentRank.mjs'

test('five passing A1 assessments unlock the A2 assessment', () => {
  let rank = 1
  for (let i = 0; i < 5; i += 1) rank = advanceA1AssessmentRank(rank, 36, 40)
  assert.equal(rank, 6)
})

test('a failed assessment moves back one rank, with a floor at rank one', () => {
  assert.equal(advanceA1AssessmentRank(4, 35, 40), 3)
  assert.equal(advanceA1AssessmentRank(1, 35, 40), 1)
  assert.equal(advanceA1AssessmentRank(3, 36, 40), 4)
})
