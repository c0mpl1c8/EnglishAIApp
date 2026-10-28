import assert from 'node:assert/strict'
import test from 'node:test'
import { isValidConversationReply } from './voiceTurnReview.mjs'

test('natural requests for help are not grammar mistakes', () => {
  for (const reply of ["I don't know.", 'I dont know', 'I do not know!', "I'm not sure.", 'No idea.', 'Can you give me a hint?']) {
    assert.equal(isValidConversationReply(reply), true, reply)
  }
})

test('incorrect variants still reach grammar review', () => {
  for (const reply of ['I does not know', 'I dont knows', 'He dont know', 'I need a new dog.']) {
    assert.equal(isValidConversationReply(reply), false, reply)
  }
})
