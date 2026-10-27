// Small, curated local reference corpus for grounded English-learning replies.
// Retrieval is deliberately local and deterministic: no embeddings or extra service required.
const ENGLISH_KNOWLEDGE = [
  { id: 'present-simple', tags: 'present simple hiện tại đơn habit routine frequency', title: 'Present simple', rule: 'Use the base verb; add -s/-es with he, she, or it. Use do/does for questions and negatives.', example: 'She works every day. / Do they work here?' },
  { id: 'past-simple', tags: 'past simple quá khứ đơn yesterday last ago finished', title: 'Past simple', rule: 'Use the past form for completed actions at a finished time. Regular verbs usually take -ed; irregular forms must be learned.', example: 'We visited Da Nang last summer.' },
  { id: 'present-perfect', tags: 'present perfect hiện tại hoàn thành since for experience', title: 'Present perfect', rule: 'Use have/has + past participle for experience or a past action connected to now; use since for a starting point and for for a duration.', example: 'I have lived here for two years.' },
  { id: 'articles', tags: 'article a an the mạo từ countable', title: 'Articles', rule: 'Use a/an for one nonspecific singular countable noun; use the for something specific or already known; use no article for plural or uncountable nouns in general.', example: 'I saw a dog. The dog was friendly.' },
  { id: 'subject-verb', tags: 'agreement subject verb hòa hợp chủ ngữ động từ', title: 'Subject–verb agreement', rule: 'A singular subject takes a singular verb; a plural subject takes a plural verb. In the present simple, he/she/it usually takes -s.', example: 'My brother goes to school. They go together.' },
  { id: 'prepositions-time', tags: 'preposition giới từ time time at on in', title: 'Time prepositions', rule: 'Use at for clock times, on for days and dates, and in for months, years, and longer periods.', example: 'at 7:00, on Monday, in October' },
  { id: 'prepositions-place', tags: 'preposition giới từ place at in on', title: 'Place prepositions', rule: 'Use in for enclosed spaces or areas, on for surfaces, and at for a point or destination.', example: 'in the room, on the table, at the station' },
  { id: 'word-order', tags: 'word order trật tự từ sentence adverb adjective', title: 'Basic word order', rule: 'A common English statement order is subject + verb + object. Adjectives usually come before the noun they describe.', example: 'She bought a red bag.' },
  { id: 'first-conditional', tags: 'conditional câu điều kiện loại 1 will if', title: 'First conditional', rule: 'Use if + present simple, then will + base verb for a realistic future possibility. Do not normally put will in the if-clause.', example: 'If it rains, we will stay inside.' },
  { id: 'passive', tags: 'passive bị động be past participle', title: 'Passive voice', rule: 'Form the passive with the correct form of be + past participle. Use it when the action or result matters more than the doer.', example: 'The room is cleaned every day.' },
  { id: 'comparatives', tags: 'comparative superlative so sánh hơn nhất', title: 'Comparatives', rule: 'Use -er or more + adjective with than to compare two things. Use the + -est or the most for the highest degree in a group.', example: 'This route is shorter than the other one.' },
  { id: 'gerund-infinitive', tags: 'gerund infinitive v-ing to verb enjoy want', title: 'Gerunds and infinitives', rule: 'Some verbs are followed by an -ing form (enjoy doing); others by to + base verb (want to do). Learn the pattern with each verb.', example: 'I enjoy reading. I want to learn.' }
]

const normalize = (text) => String(text || '').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
const words = (text) => normalize(text).match(/[a-z0-9]+/g) || []

export function retrieveEnglishKnowledge(query, limit = 3) {
  const queryWords = new Set(words(query).filter((word) => word.length > 2))
  if (!queryWords.size) return []
  return ENGLISH_KNOWLEDGE.map((item) => {
    const corpusWords = new Set(words(`${item.title} ${item.tags} ${item.rule} ${item.example}`))
    let score = 0
    for (const word of queryWords) if (corpusWords.has(word)) score += word.length > 5 ? 2 : 1
    return { item, score }
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map(({ item }) => item)
}

export function formatEnglishKnowledge(query, limit = 3) {
  return retrieveEnglishKnowledge(query, limit)
    .map((item) => `- ${item.title}: ${item.rule} Example: ${item.example}`)
    .join('\n')
}
