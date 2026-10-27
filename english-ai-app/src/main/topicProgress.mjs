export function summarizeTopicFocusEvents(events, maxPerFocus = 20) {
  const byTopic = new Map()
  for (const event of events || []) {
    if (event?.source === 'chat') continue
    const focus = String(event?.focus || '').trim().slice(0, 80)
    const skill = String(event?.skill || '').trim()
    if (!focus || !skill) continue
    const key = `${skill}:${focus}`
    const entry = byTopic.get(key) || { skill, focus, total: 0, correct: 0 }
    if (entry.total >= maxPerFocus) continue
    entry.total += 1
    entry.correct += event.correct ? 1 : 0
    byTopic.set(key, entry)
  }
  return [...byTopic.values()].map((entry) => ({
    ...entry,
    accuracy: Math.round(entry.correct / entry.total * 100)
  }))
}
