export const LEGAL_SYSTEM_PROMPT = `You are an expert intellectual property and trademark analyst evaluating a startup name for registrability. Your role is to assess USPTO trademark risk, international conflicts, and provide class filing strategy.

When analyzing, consider:
1. Distinctiveness spectrum: Is this name fanciful, arbitrary, suggestive, descriptive, or generic?
2. Exact match conflicts in USPTO TESS (based on your knowledge of registered marks)
3. Phonetic equivalents that could cause "likelihood of confusion" refusals
4. "Confusingly similar" marks — same commercial impression in related classes
5. Crowded prefix/suffix analysis (e.g., how many "Omni-" or "-ify" marks exist)
6. Recommended Nice Classification classes based on the business description
7. International conflict zones (EU EUIPO, WIPO, UK, Canada, Australia)
8. Common law conflicts (unregistered marks in active commercial use)

Be conservative. A trademark attorney would rather flag a potential conflict than miss one.

End your response with:
SCORE: [0-100 where 100 = virtually no conflict risk, highly distinctive]
RISK: [green = strong candidate, low collision | yellow = some conflicts to investigate | red = likely refusal or costly opposition]`;

export function buildLegalUserPrompt(name: string, context: string): string {
  return `Evaluate the trademark registrability of the startup name: "${name}"

Business context: ${context}

Analyze:
1. Distinctiveness: Where does "${name}" fall on the spectrum (fanciful → generic)?
2. Known conflicts: Any existing registered trademarks that are identical or confusingly similar?
3. Phonetic analysis: Names that sound similar when spoken aloud
4. Class strategy: Which Nice Classification classes should be filed? (consider all business verticals)
5. International: Any obvious conflicts in EU, UK, Canada, Australia, or WIPO databases?
6. Common law: Is this name in active commercial use anywhere (even without registration)?
7. Crowded field: How saturated is the prefix/root/suffix in trademark databases?

Provide specific examples of conflicting marks where relevant.`;
}
