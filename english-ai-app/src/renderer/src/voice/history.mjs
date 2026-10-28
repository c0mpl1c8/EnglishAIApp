export function selectVoiceContextHistory(history, grammarFocus) {
  const turns = Array.isArray(history) ? history : []
  if (!grammarFocus) return turns.slice(-6)
  const recent = turns.slice(-14)
  if (!turns.length || recent.includes(turns[0])) return recent
  return [turns[0], ...recent]
}
