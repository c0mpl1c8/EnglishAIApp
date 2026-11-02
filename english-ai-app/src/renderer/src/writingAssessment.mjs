export const writingAssessmentPrompts = [
  'Write about a memorable day. Explain what happened, who was involved, and why it mattered to you.',
  'Describe a place you enjoy visiting. Say where it is, what people can do there, and why you like it.',
  'Write about a person who is important to you. Describe them, explain what you do together, and say why they matter to you.',
  'Describe your daily routine. Explain what you usually do and one thing you would like to change.',
  'Write about a useful skill you learned. Explain how you learned it, when you use it, and why it is useful.',
  'Describe a trip you enjoyed or would like to take. Say where you went or would go, what you did or would do, and why.',
  'Write about a goal you have. Explain why it is important and what steps you will take to reach it.',
  'Describe your favorite way to spend your free time. Explain what you do and what makes it enjoyable.'
]

export function chooseWritingAssessmentPrompt(previousPrompt, random = Math.random) {
  const choices = writingAssessmentPrompts.filter((prompt) => prompt !== previousPrompt)
  const index = Math.min(choices.length - 1, Math.max(0, Math.floor(random() * choices.length)))
  return choices[index]
}
