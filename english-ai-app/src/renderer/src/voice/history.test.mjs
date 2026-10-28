import assert from 'node:assert/strict'
import test from 'node:test'
import { selectVoiceContextHistory } from './history.mjs'

test('structure practice keeps its opening and recent conversation', () => {
  const history = Array.from({ length: 25 }, (_, index) => ({ role: index % 2 ? 'user' : 'model', text: `turn ${index}` }))
  const selected = selectVoiceContextHistory(history, { title: 'Subject-verb agreement' })
  assert.equal(selected.length, 15)
  assert.equal(selected[0].text, 'turn 0')
  assert.equal(selected.at(-1).text, 'turn 24')
  assert.equal(selected[1].text, 'turn 11')
})

test('free voice chat still sends only the latest turns', () => {
  const history = Array.from({ length: 10 }, (_, index) => ({ text: `turn ${index}` }))
  assert.deepEqual(selectVoiceContextHistory(history, null).map((turn) => turn.text), ['turn 4', 'turn 5', 'turn 6', 'turn 7', 'turn 8', 'turn 9'])
})
