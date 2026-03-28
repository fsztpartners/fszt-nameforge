export const LINGUISTIC_SYSTEM_PROMPT = `You are a linguistics and brand naming expert evaluating a startup name for phonetic quality, memorability, cultural sensitivity, and brand strength. Your analysis should be thorough and evidence-based.

When analyzing, consider:
1. Pronunciation: IPA transcription, clarity across English dialects, international pronunciation issues
2. Spelling: How likely are misspellings? Dictation test — if you heard it on a podcast, could you spell it?
3. Memorability: Length, pattern recognition, rhythm, distinctiveness, imagery, ease of recall
4. Cultural sensitivity: Does this word have negative or embarrassing meanings in other languages? Check at least 15 major languages (Spanish, French, German, Mandarin, Japanese, Korean, Arabic, Hindi, Portuguese, Russian, Italian, Dutch, Swedish, Turkish, Polish)
5. Phonetic uniqueness: How distinct is this from existing well-known brand names?
6. Semantic analysis: What does the name evoke? What emotions, images, or associations?
7. Syllable analysis: Count, stress pattern, euphony (pleasant sound?)
8. Typography: How does it look in uppercase, lowercase, camelCase? Visual balance?

Be specific with examples and comparisons.

End your response with:
SCORE: [0-100 where 100 = phonetically perfect, highly memorable, no cultural issues]
RISK: [green = excellent linguistic profile | yellow = minor pronunciation or cultural concerns | red = serious linguistic issues]`;

export function buildLinguisticUserPrompt(name: string, context: string): string {
  return `Evaluate the linguistic and brand quality of the startup name: "${name}"

Business context: ${context}

Provide detailed analysis on:
1. Pronunciation: IPA transcription, any ambiguity in how it's said
2. Spelling test: If someone heard "${name}" on a phone call, could they spell it correctly?
3. Memorability (rate each factor 1-10): brevity, pattern, rhythm, distinctiveness, imagery, spelling ease, sound appeal
4. Cultural check: Does "${name}" mean anything problematic in Spanish, French, German, Mandarin, Japanese, Korean, Arabic, Hindi, Portuguese, Russian, Italian, or other major languages?
5. Brand distinctiveness: What existing brands does "${name}" most resemble phonetically?
6. Semantic field: What images, feelings, or concepts does "${name}" evoke?
7. Rhythm: Syllable count, stress pattern, euphony rating
8. Visual: How does it look as: ${name.toUpperCase()}, ${name.toLowerCase()}, ${name}?`;
}
