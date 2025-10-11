// Mode Selector - Intelligently select reply mode based on context

import type { ReplyMode, CreatorIntelligence, TweetData, UserProfile } from "./types";
import { getExamplesByNiche } from "./example-library";
import type { KeywordExtractionResult } from "./keyword-extractor";

export function selectOptimalMode(
  creator: CreatorIntelligence,
  post: TweetData
): ReplyMode {
  console.log(`🎯 Selecting optimal mode for @${creator.username}...`);
  console.log(`   Primary Niche: ${creator.primaryNiche}`);
  console.log(`   SaaS Relevance: ${creator.crossoverPotential.saasRelevance}/5`);
  console.log(`   MMA Relevance: ${creator.crossoverPotential.mmaRelevance}/5`);

  // RULE 1: Check PRIMARY NICHE first (most important!)
  
  // If mindset/personal development niche → always use mindset_crossover
  if (creator.primaryNiche === "mindset" || 
      creator.secondaryNiches.includes("mindset") ||
      creator.audience.demographics.primaryInterests.some(i => 
        i.includes("mindset") || i.includes("personal development") || 
        i.includes("self-improvement") || i.includes("positivity")
      )) {
    console.log(`   ✅ Mindset-focused creator → mindset_crossover`);
    return "mindset_crossover";
  }
  
  // If pure MMA niche
  if (creator.primaryNiche === "mma" || creator.crossoverPotential.mmaRelevance >= 4) {
    console.log(`   ✅ MMA-focused creator → pure_mma`);
    return "pure_mma";
  }

  // If pure SaaS niche
  if (creator.primaryNiche === "saas" || 
      creator.primaryNiche === "tech" ||
      creator.crossoverPotential.saasRelevance >= 4) {
    console.log(`   ✅ SaaS/Tech-focused creator → pure_saas`);
    return "pure_saas";
  }
  
  // RULE 2: Check if finance niche
  if (creator.primaryNiche === "finance") {
    console.log(`   ✅ Finance creator → pure_saas`);
    return "pure_saas";
  }

  // RULE 3: Check if post is technical
  if (containsKeywords(post.text, ["code", "api", "architecture", "system", "database", "engineering"])) {
    console.log(`   ✅ Technical content → technical mode`);
    return "technical";
  }

  // RULE 4: Check for discipline/mindset crossover potential
  if (
    containsKeywords(post.text, ["discipline", "mental", "mindset", "performance", "execution", "focus"]) &&
    creator.crossoverPotential.disciplineTopics >= 3
  ) {
    console.log(`   ✅ Discipline post + receptive audience → mindset_crossover`);
    return "mindset_crossover";
  }

  // Default based on highest relevance score
  if (creator.crossoverPotential.saasRelevance >= creator.crossoverPotential.mmaRelevance) {
    console.log(`   ⚠️  Defaulting to pure_saas (SaaS score higher)`);
    return "pure_saas";
  } else {
    console.log(`   ⚠️  Defaulting to mindset_crossover (balanced approach)`);
    return "mindset_crossover";
  }
}

function containsKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

export function getModePrompt(
  mode: ReplyMode,
  creator: CreatorIntelligence,
  post: TweetData,
  userProfile: UserProfile,
  keywords?: KeywordExtractionResult
): string {
  // Get 5 real HONEST examples for this niche (few-shot learning)
  const examples = getExamplesByNiche(creator.primaryNiche, 5);
  
  // Format examples for prompt
  const examplesSection = examples.map((ex, i) => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REAL EXAMPLE ${i + 1} (Score: ${ex.score}/100${ex.gotAuthorReply ? ', Got Author Reply ✅' : ''})
Strategy: ${ex.strategy}

Original Tweet:
"${ex.tweet}"

Reply:
"${ex.reply}"

Why ${ex.score}/100:
${ex.why}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `).join("\n");
  
  // Build keywords section for content relevance
  const keywordsSection = keywords ? `
🔑 CRITICAL KEYWORDS (MUST use these exact words for high content relevance):

Primary Keywords: ${keywords.primaryKeywords.map(k => `"${k}"`).join(", ")}
${keywords.emotionalWords.length > 0 ? `Emotional Words: ${keywords.emotionalWords.map(k => `"${k}"`).join(", ")}` : ''}
${keywords.actionVerbs.length > 0 ? `Action Verbs: ${keywords.actionVerbs.map(k => `"${k}"`).join(", ")}` : ''}

⚠️  You MUST use at least 3-4 of these EXACT keywords in your reply. The X algorithm scores keyword matches, not synonyms.
Example: If tweet says "yourself" → use "yourself", NOT "self-talk" or "inner dialogue"
` : '';
  
  const baseContext = `
Creator: @${creator.username}
Their niche: ${creator.primaryNiche}
Their audience cares about: ${creator.audience.demographics.primaryInterests.join(", ")}
Post: "${post.text}"
  `.trim();

  const prompts: Record<ReplyMode, string> = {
    pure_saas: `
You are @${userProfile.handle}, a SaaS builder focused on ${userProfile.currentProject}.

🎯 YOUR GOAL: Generate an HONEST 90%+ reply using exact keywords from their tweet.

${keywordsSection}

=== 5 REAL HIGH-PERFORMING HONEST REPLIES (Study These!) ===

${examplesSection}

=== 🔑 KEY PATTERN (From Examples Above) ===

All 90%+ replies are HONEST and use these strategies:
1. **Thoughtful Specific Question**: Ask about ratios, thresholds, edge cases with NUMBERS
   Example: "Is 10 services with 90 calls worse than 20 services with 40 calls?"
   
2. **Explore Tradeoffs**: Question the balance between competing factors
   Example: "What's more costly - slow reviews causing context switching or fast reviews missing bugs?"
   
3. **Edge Case Curiosity**: Ask what happens at boundaries/extremes
   Example: "Is there a read:write ratio where indexes flip from helping to hurting?"

4. **Use EXACT Keywords**: If tweet says "microservices" → use "microservices", not "distributed systems"

AVOID COMPLETELY:
❌ Fake personal stories ("At 5K MRR we..." if you're not at 5K MRR)
❌ Fabricated experiences ("Last month I..." if it didn't happen)
❌ Generic praise ("Great point!")
❌ Synonyms for their keywords (use their EXACT words)

=== YOUR TASK ===

${baseContext}

Generate ONE HONEST reply that:
1. Uses 3-4 of the EXACT keywords from above (not synonyms!)
2. Asks a thoughtful specific question with NUMBERS/SPECIFICS
3. Shows analytical thinking about tradeoffs/thresholds/edge cases
4. Is 35-55 words
5. NO FAKE SCENARIOS - only honest curiosity

EXAMPLE FORMAT:
"When you mention [EXACT KEYWORD] - [thoughtful question with specific numbers/ratios/thresholds]? [Follow-up exploring edge case or tradeoff]?"
    `,

    pure_mma: `
You are @${userProfile.handle}, an MMA analyst with deep fight knowledge.

CRITICAL RULES:
- Focus ONLY on MMA, fighting, training, technique, fight analysis
- Minimal mention of SaaS/startups unless directly relevant to fight business
- Speak the language of fighters, coaches, fans, and media
- Analyze technique, strategy, mental game, fight dynamics
- Show MMA expertise through detailed analysis

${baseContext}

Generate a reply that:
1. Shows deep MMA knowledge and analytical ability
2. Analyzes technique, strategy, or mental aspects of the topic
3. Asks insightful question about fight game specifics
4. Uses MMA terminology correctly and naturally
5. Avoids casual fan takes - show expertise
6. Keeps it engaging and under 200 characters
    `,

    mindset_crossover: `
You are @${userProfile.handle}, bridging high-performance concepts across domains.

🎯 YOUR GOAL: Generate an HONEST 90%+ reply using exact keywords from their tweet.

${keywordsSection}

=== 5 REAL HIGH-PERFORMING HONEST REPLIES (Study These!) ===

${examplesSection}

=== 🔑 KEY PATTERN (From Examples Above) ===

All 90%+ replies are HONEST and use these strategies:
1. **Ratio/Threshold Questions**: Ask about quantities with SPECIFIC NUMBERS
   Example: "Does the ratio of hope to doubt matter more than absolute quantity? Like 10 hopeful + 2 doubts vs 3 hopeful + 0 doubts?"
   
2. **Implementation Curiosity**: Ask HOW to apply the concept
   Example: "Is it better to think of future self as 1 year away, 5 years, or 10 years for daily decisions?"
   
3. **Boundary Exploration**: What happens at extremes or edge cases?
   Example: "Is there a frequency threshold where consistency flips? Like 30min daily vs 1hr every 2 days?"

4. **Use EXACT Keywords**: If tweet says "mind" and "courage" → use those exact words, not "brain" and "bravery"

AVOID COMPLETELY:
❌ Fake personal experiences ("I tracked for 30 days..." if you didn't)
❌ Fabricated transformations ("My output doubled..." if it didn't)
❌ Generic statements ("This resonates")
❌ Synonyms for their keywords (use their EXACT words)

=== YOUR TASK ===

Creator: @${creator.username} (${creator.primaryNiche})
Tweet: "${post.text}"
Audience cares about: ${creator.audience.demographics.primaryInterests.join(", ")}

Generate ONE HONEST reply that:
1. Uses 3-4 of the EXACT keywords from above (not synonyms!)
2. Asks a thoughtful question with SPECIFIC NUMBERS/RATIOS/TIMEFRAMES
3. Explores practical implementation or boundary conditions
4. Is 35-55 words
5. NO FAKE EXPERIENCES - only honest curiosity and analytical thinking

EXAMPLE FORMAT:
"When you say [EXACT KEYWORD] - [question with specific numbers/ratios]? [Follow-up about implementation or edge case]?"
    `,

    technical: `
You are @${userProfile.handle}, a technical builder discussing systems and architecture.

CRITICAL RULES:
- Focus on technical implementation, architecture, systems thinking
- Be precise about technical concepts
- Ask about technical decisions and trade-offs
- Show engineering expertise
- Avoid buzzwords - be specific

${baseContext}

Generate a technical reply that shows deep understanding and asks about implementation details.
    `,

    storytelling: `
You are @${userProfile.handle}, sharing relevant personal experience.

CRITICAL RULES:
- Share a brief, relevant personal experience
- Connect it to the creator's post
- Be authentic and specific
- Keep it concise
- Add value through your unique perspective

${baseContext}

Generate a reply that shares relevant personal experience briefly and authentically.
    `,
  };

  return prompts[mode];
}


