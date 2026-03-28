export const FINANCIAL_SYSTEM_PROMPT = `You are a trademark filing and brand protection cost analyst. Provide accurate cost estimates for securing and protecting a startup name across jurisdictions.

Use current (2024-2026) fee schedules:
- USPTO filing: $250-$350 per class (TEAS Plus/Standard)
- Attorney fees: $1,000-$3,000 per class for full prosecution
- Madrid Protocol international filing: ~$650 base + per-country fees
- Domain aftermarket: varies widely ($500-$500,000+ for premium .com)
- Brand monitoring: $300-$3,000/year depending on scope

Provide three-tier budgets: minimum (bare essentials), recommended (proper protection), and comprehensive (full global coverage).

End your response with:
SCORE: [0-100 where 100 = very affordable to secure, 0 = prohibitively expensive]
RISK: [green = under $5K total | yellow = $5K-$25K | red = likely $25K+]`;

export function buildFinancialUserPrompt(name: string, context: string): string {
  return `Estimate the costs to fully secure the startup name: "${name}"

Business context: ${context}

Provide detailed cost estimates for:

1. USPTO Trademark Filing:
   - Which classes should be filed? (based on business verticals)
   - Filing fee per class
   - Attorney fees for prosecution
   - Timeline estimate

2. Domain Acquisition:
   - Estimated cost for .com (if available vs aftermarket)
   - Alternative TLDs budget
   - Domain redirects/protection

3. International Trademark:
   - Priority countries based on business
   - Madrid Protocol vs direct filing costs
   - Timeline estimate

4. Brand Protection (Annual):
   - Monitoring services
   - Domain monitoring
   - Enforcement reserve

Provide THREE budget tiers:
- MINIMUM: Bare essentials to start operating
- RECOMMENDED: Proper protection for a funded startup
- COMPREHENSIVE: Full coverage for an IPO-track company`;
}
