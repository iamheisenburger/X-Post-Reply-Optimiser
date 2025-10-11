// Mode Selector - Intelligently select reply mode based on context

import type { ReplyMode, CreatorIntelligence, TweetData, UserProfile } from "./types";
import { getExamplesByNiche } from "./example-library";

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
  userProfile: UserProfile
): string {
  // Get 5 real examples for this niche (few-shot learning)
  const examples = getExamplesByNiche(creator.primaryNiche, 5);
  
  // Format examples for prompt
  const examplesSection = examples.map((ex, i) => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REAL EXAMPLE ${i + 1} (Score: ${ex.score}/100${ex.gotAuthorReply ? ', Got Author Reply ✅' : ''})

Original Tweet:
"${ex.tweet}"

Reply:
"${ex.reply}"

Why ${ex.score}/100:
${ex.why}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `).join("\n");
  
  const baseContext = `
Creator: @${creator.username}
Their niche: ${creator.primaryNiche}
Their audience cares about: ${creator.audience.demographics.primaryInterests.join(", ")}
Post: "${post.text}"
  `.trim();

  const prompts: Record<ReplyMode, string> = {
    pure_saas: `
You are @${userProfile.handle}, a SaaS builder focused on ${userProfile.currentProject}.

🎯 YOUR GOAL: Generate a 90%+ reply by learning from REAL examples below.

=== 5 REAL HIGH-PERFORMING REPLIES (Study These!) ===

${examplesSection}

=== 🔑 KEY PATTERN (From Examples Above) ===

All 90%+ replies share:
1. CONCRETE DETAILS: Specific numbers ("5K MRR", "3x"), timeframes ("last month", "3 weeks"), scenarios ("At [Company]", "When we built X")
2. MEASURABLE RESULTS: "40% faster", "50 users in 2 weeks", "2.3x better conversion"
3. TECHNICAL SPECIFICITY: Actual tools/techniques ("Redis cache", "circuit breakers", "automated testing gates")
4. ONE FOCUSED QUESTION: Specific to their context, not generic

AVOID:
❌ "I've found that..." (too vague)
❌ "In my experience..." (needs specific context)
❌ "Great point!" (no filler praise)
❌ Multiple questions

=== YOUR TASK ===

Creator: @${creator.username} (${creator.primaryNiche})
Tweet: "${post.text}"
Audience cares about: ${creator.audience.demographics.primaryInterests.join(", ")}

Generate ONE reply that matches the SPECIFICITY and CONCRETENESS of the examples above.
- 35-55 words
- Include at least 2 concrete elements (numbers, timeframe, specific scenario, action verbs)
- End with ONE specific question
- Model your reply on the examples' level of detail

CRITICAL: Your reply should be as specific as the examples. If it could apply to any tweet, it's too generic.
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

🎯 YOUR GOAL: Generate a 90%+ reply by learning from REAL examples below.

=== 5 REAL HIGH-PERFORMING REPLIES (Study These!) ===

${examplesSection}

=== 🔑 KEY PATTERN (From Examples Above) ===

All 90%+ replies share:
1. CONCRETE PERSONAL EXPERIENCES: Specific experiments ("tracked for 30 days", "tested over 3 years"), actual numbers ("68% negative", "5-year portfolio")
2. MEASURABLE TRANSFORMATIONS: "output doubled", "decision time cut 70%", "mental clarity 10x better"
3. SPECIFIC TECHNIQUES: Actual practices ("'yet' reframes", "courage compass", "evidence journals"), not generic advice
4. ONE FOCUSED QUESTION: About their specific practice/framework, not generic "any tips?"

AVOID:
❌ "I've found that..." (needs specifics: when? what exactly?)
❌ "This resonates" (no filler - jump to your experience)
❌ "Great point!" (never start with praise)
❌ Multiple questions

=== YOUR TASK ===

Creator: @${creator.username} (${creator.primaryNiche})
Tweet: "${post.text}"
Audience cares about: ${creator.audience.demographics.primaryInterests.join(", ")}
Sophistication: ${creator.audience.demographics.sophisticationLevel}

Generate ONE reply that matches the SPECIFICITY and CONCRETENESS of the examples above.
- 35-55 words
- Include at least 2 concrete elements (numbers, timeframe, specific practice/framework, measurable results)
- End with ONE specific question about their approach/framework
- Model your reply on the examples' level of detail

CRITICAL: Your reply should be as specific as the examples. If it could apply to any mindset tweet, it's too generic.
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


