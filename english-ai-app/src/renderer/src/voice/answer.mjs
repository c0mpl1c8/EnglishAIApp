export function normalizeVoiceAnswer(text) {
  return String(text || '').toLocaleLowerCase().normalize('NFKC')
    .replace(/[’‘]/g, "'")
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bcan't\b|\bcannot\b/g, 'can not')
    .replace(/\b(\w+)n't\b/g, '$1 not')
    .replace(/\b(\w+)'re\b/g, '$1 are')
    .replace(/\b(\w+)'ve\b/g, '$1 have')
    .replace(/\b(\w+)'ll\b/g, '$1 will')
    .replace(/\b(\w+)'m\b/g, '$1 am')
    .replace(/\b(\w+)'s\b/g, '$1 is')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ').trim()
}

export function matchesSpokenSentence(spoken, sentence) {
  const answer = normalizeVoiceAnswer(spoken)
  return Boolean(answer) && answer === normalizeVoiceAnswer(sentence)
}
