// These are complete, natural conversational replies even when they do not
// answer the tutor's exercise. Keep them out of the correction loop.
export function isValidConversationReply(value) {
  const text = String(value || '').trim().toLowerCase().replace(/[.!?…]+$/u, '').trim()
  return /^(?:i (?:do not|don't|dont) know|i(?: am|'m|’m) not sure|not sure|no idea|i (?:cannot|can't|cant) (?:remember|think of (?:anything|an answer)|answer (?:that|this))|could you (?:help me|give me a hint)|can you (?:help me|give me a hint)|please (?:help me|give me a hint))$/iu.test(text)
}
