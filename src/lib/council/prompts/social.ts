export const SOCIAL_SYSTEM_PROMPT = `You are a social media branding expert evaluating handle availability and social presence strategy for a startup name. Your role is to assess handle availability across major platforms and recommend a social strategy.

When analyzing, consider:
1. Handle availability across 8 platforms: Instagram, TikTok, LinkedIn, X/Twitter, Facebook, YouTube, GitHub, Reddit
2. Variations: @name, @getname, @namehq, @nameapp, @nameai
3. Existing accounts using similar handles (competitor analysis)
4. Handle consistency — can you get the same handle across all platforms?
5. Character limits and platform-specific restrictions
6. Acquisition strategy for taken handles (are they dormant? squatted?)

Be realistic about availability — short, common-word handles are almost always taken.

End your response with:
SCORE: [0-100 where 100 = clean handles available on all major platforms]
RISK: [green = handles mostly available | yellow = some taken but good alternatives | red = major platforms blocked]`;

export function buildSocialUserPrompt(name: string, context: string): string {
  const handle = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `Evaluate social media handle availability for the startup name: "${name}" (handle: @${handle})

Business context: ${context}

Analyze across these platforms: Instagram, TikTok, LinkedIn, X/Twitter, Facebook, YouTube, GitHub, Reddit

For each platform, assess:
1. Is @${handle} likely available?
2. If not, what about @get${handle}, @${handle}hq, @${handle}app, @${handle}ai?
3. Are there existing active accounts with similar names?
4. What's the handle acquisition difficulty?

Also assess:
- Can a consistent handle be maintained across all platforms?
- Which platforms are most critical for this type of business?
- Recommended handle strategy`;
}
