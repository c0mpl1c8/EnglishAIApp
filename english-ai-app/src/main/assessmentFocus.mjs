export const normalizeFocusName = (value) => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim()

const aliases = [
  ['present_simple', /\b(present simple|simple present|hien tai don)\b/],
  ['present_continuous', /\b(present continuous|present progressive|hien tai tiep dien)\b/],
  ['past_simple', /\b(past simple|simple past|qua khu don)\b/],
  ['past_continuous', /\b(past continuous|past progressive|qua khu tiep dien)\b/],
  ['present_perfect', /\b(present perfect|hien tai hoan thanh)\b/],
  ['past_perfect', /\b(past perfect|qua khu hoan thanh)\b/],
  ['future_forms', /\b(future tense|will vs going to|be going to|tuong lai)\b/],
  ['agreement', /\b(subject verb agreement|subject verb concord|hoa hop chu ngu dong tu)\b/],
  ['articles', /\b(articles?|mao tu|indefinite article|definite article)\b/],
  ['word_order', /\b(word order|trat tu tu)\b/],
  ['prepositions', /\b(prepositions?|gioi tu)\b/],
  ['word_forms', /\b(word forms?|parts of speech|tu loai)\b/],
  ['questions', /\b(questions? with do|do does did|cau hoi voi do)\b/],
  ['cond_1', /\b(first conditional|conditional type 1|cau dieu kien loai 1)\b/],
  ['cond_2', /\b(second conditional|conditional type 2|cau dieu kien loai 2)\b/],
  ['cond_3', /\b(third conditional|conditional type 3|cau dieu kien loai 3)\b/],
  ['passive', /\b(passive voice|cau bi dong)\b/],
  ['reported', /\b(reported speech|indirect speech|cau gian tiep)\b/],
  ['comparative', /\b(comparatives?|so sanh hon)\b/],
  ['superlative', /\b(superlatives?|so sanh nhat)\b/],
  ['modals', /\b(modal verbs?|dong tu khuyet thieu)\b/]
]
export const assessmentStructureIds = aliases.map(([id]) => id)

export function structureIdForAssessmentFocus(focus) {
  const normalized = normalizeFocusName(focus)
  return aliases.find(([, pattern]) => pattern.test(normalized))?.[0] || null
}

export function summarizeAssessmentFocuses(details) {
  const grouped = new Map()
  for (const item of details || []) {
    const focus = String(item?.focus || '').trim().slice(0, 80)
    const skill = String(item?.skill || '').trim()
    if (!focus || !skill || skill === 'other') continue
    const inferredId = structureIdForAssessmentFocus(focus)
    const structureId = inferredId || (assessmentStructureIds.includes(item?.structureId) ? item.structureId : null)
    const key = structureId ? `structure:${structureId}` : `${skill}:${normalizeFocusName(focus)}`
    const entry = grouped.get(key) || { key, structureId, skill, focus, total: 0, correct: 0 }
    entry.total++
    entry.correct += item.picked === item.answer ? 1 : 0
    grouped.set(key, entry)
  }
  return [...grouped.values()].map((entry) => ({ ...entry, accuracy: Math.round(entry.correct / entry.total * 100) }))
}
