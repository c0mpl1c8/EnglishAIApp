import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeTopicFocusEvents } from './topicProgress.mjs'

test('each sentence pattern keeps its own score inside the same skill', () => {
  const events = [
    ...Array.from({ length: 4 }, () => ({ skill: 'tense', focus: 'Hiện tại đơn', correct: 1, source: 'quiz' })),
    ...Array.from({ length: 4 }, () => ({ skill: 'tense', focus: 'Quá khứ đơn', correct: 0, source: 'quiz' }))
  ]
  assert.deepEqual(summarizeTopicFocusEvents(events), [
    { skill: 'tense', focus: 'Hiện tại đơn', total: 4, correct: 4, accuracy: 100 },
    { skill: 'tense', focus: 'Quá khứ đơn', total: 4, correct: 0, accuracy: 0 }
  ])
})

test('other topics cannot push a pattern out of its own recent sample', () => {
  const events = [
    ...Array.from({ length: 25 }, () => ({ skill: 'tense', focus: 'Quá khứ đơn', correct: 0, source: 'quiz' })),
    ...Array.from({ length: 4 }, () => ({ skill: 'tense', focus: 'Hiện tại đơn', correct: 1, source: 'quiz' }))
  ]
  const result = summarizeTopicFocusEvents(events)
  assert.equal(result.find((item) => item.focus === 'Quá khứ đơn').total, 20)
  assert.equal(result.find((item) => item.focus === 'Hiện tại đơn').correct, 4)
})

test('assessment answers are tracked separately from practice answers', () => {
  const events = [
    { skill: 'tense', focus: 'Hiện tại đơn', correct: 0, source: 'assessment' },
    { skill: 'tense', focus: 'Hiện tại đơn', correct: 1, source: 'quiz' }
  ]
  assert.deepEqual(summarizeTopicFocusEvents(events), [
    { skill: 'tense', focus: 'Hiện tại đơn', total: 1, correct: 1, accuracy: 100 }
  ])
})
