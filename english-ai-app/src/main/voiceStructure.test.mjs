import assert from 'node:assert/strict'
import test from 'node:test'
import { hasActionablePracticePrompt, isLearnerStuck, isVoiceStructureReset, makeVoiceStructureNextStep, makeVoiceStructureRedirect, makeVoiceStructureSameScenePrompt, needsVoiceStructureRedirect } from './voiceStructure.mjs'

test('a hint followed by an instruction to answer is already a complete tutor turn', () => {
  const reply = "No problem. Let's try a hint: The teacher writes. So, you can say: She writes on the board. Now, please try to say a full sentence about the teacher using 'She' or 'He'."
  assert.equal(hasActionablePracticePrompt(reply), true)
  assert.equal(isLearnerStuck('I do not know.'), true)
  assert.equal(needsVoiceStructureRedirect(reply, 'Hòa hợp chủ ngữ – động từ', 'I do not know.'), false)
  assert.match(makeVoiceStructureSameScenePrompt('Hòa hợp chủ ngữ – động từ'), /same|stay/i)
})

test('a yes/no question does not count as practicing There is / There are', () => {
  assert.equal(needsVoiceStructureRedirect('Hello! There is a cat in your room, right?', 'There is / There are'), true)
  assert.match(makeVoiceStructureRedirect('There is / There are', 'There is a book on the table.'), /full sentence starting with "There is" or "There are/)
})

test('an explicit sentence task stays in the chosen structure', () => {
  assert.equal(needsVoiceStructureRedirect('Hello! What do you do on weekends?', 'There is / There are'), true)
  assert.equal(needsVoiceStructureRedirect('What is in your room? Please answer with a full sentence using "There is".', 'There is / There are'), false)
  assert.equal(needsVoiceStructureRedirect('What will you do if it rains tomorrow?', 'Câu điều kiện loại 1'), false)
})

test('valid learner attempts keep contextual AI feedback instead of a generic repeated prompt', () => {
  assert.equal(needsVoiceStructureRedirect('Great! Now what does your friend need?', 'Hòa hợp chủ ngữ – động từ', 'I need a new dog.'), false)
  assert.equal(needsVoiceStructureRedirect('Well done! What does your sister want?', 'Hòa hợp chủ ngữ – động từ', 'He needs a new pet.'), false)
  assert.equal(needsVoiceStructureRedirect('Nice! What else is in your room?', 'There is / There are', 'There is a table.'), false)
  assert.equal(needsVoiceStructureRedirect('Hi! How are you?', 'Hòa hợp chủ ngữ – động từ', 'Hello'), true)
})

test('missing mentor question gets a concrete new setting and a task', () => {
  assert.match(makeVoiceStructureNextStep('Hòa hợp chủ ngữ – động từ', 0), /café.*What do you need/)
  assert.match(makeVoiceStructureNextStep('Hòa hợp chủ ngữ – động từ', 1), /At school.*What does your classmate need/)
})

test('generic student greeting and repeated AI turns are rejected', () => {
  assert.equal(isVoiceStructureReset("Hello! Since you are a student, let's practice the sentence pattern again. Remember: He / She / It + V."), true)
  assert.equal(isVoiceStructureReset('Hi! What does your friend need?', ['Hi! What does your friend need?']), true)
  assert.equal(isVoiceStructureReset('You used “She needs” correctly. What does your friend need?', []), false)
})
