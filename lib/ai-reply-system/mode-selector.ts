// Mode Selector - Intelligently select reply mode based on context

import type { ReplyMode, CreatorIntelligence, TweetData, UserProfile } from "./types";

export function selectOptimalMode(
  creator: CreatorIntelligence,
  post: TweetData,
  userProfile: UserProfile
): ReplyMode {
  console.log(`🎯 Selecting optimal mode for @${creator.username}...`);

  // RULE 1: If MMA is irrelevant to creator, NEVER use MMA mode
  if (creator.crossoverPotential.mmaRelevance <= 1) {
    console.log(`   MMA relevance: ${creator.crossoverPotential.mmaRelevance}/5 - Too low for MMA content`);
    
    // Check if post is about discipline/mindset AND they're receptive
    if (
      containsKeywords(post.text, ["discipline", "mindset", "focus", "performance", "execution", "mental"]) &&
      creator.crossoverPotential.disciplineTopics >= 3
    ) {
      console.log(`   Post about discipline + audience receptive → mindset_crossover`);
      return "mindset_crossover";
    }
    
    console.log(`   Default to pure_saas mode`);
    return "pure_saas";
  }

  // RULE 2: If creator is MMA-focused, use MMA mode
  if (creator.primaryNiche === "mma" || creator.crossoverPotential.mmaRelevance >= 4) {
    console.log(`   MMA relevance: ${creator.crossoverPotential.mmaRelevance}/5 - High → pure_mma`);
    return "pure_mma";
  }

  // RULE 3: If creator is SaaS-focused, use SaaS mode
  if (creator.primaryNiche === "saas" || creator.crossoverPotential.saasRelevance >= 4) {
    console.log(`   SaaS relevance: ${creator.crossoverPotential.saasRelevance}/5 - High → pure_saas`);
    return "pure_saas";
  }

  // RULE 4: Check if crossover makes sense
  if (
    containsKeywords(post.text, ["discipline", "mental", "mindset", "performance", "execution", "focus"]) &&
    creator.crossoverPotential.disciplineTopics >= 3 &&
    creator.audience.demographics.primaryInterests.some(i => 
      i.includes("personal development") || i.includes("mindset") || i.includes("performance")
    )
  ) {
    console.log(`   Discipline post + receptive audience → mindset_crossover`);
    return "mindset_crossover";
  }

  // RULE 5: If technical post, use technical mode
  if (containsKeywords(post.text, ["code", "api", "architecture", "system", "technical", "engineering"])) {
    console.log(`   Technical content → technical mode`);
    return "technical";
  }

  // Default: Match their primary niche
  const defaultMode = creator.primaryNiche === "saas" ? "pure_saas" : 
                      creator.primaryNiche === "mma" ? "pure_mma" : 
                      "pure_saas";
  
  console.log(`   Defaulting to ${defaultMode} based on primary niche`);
  return defaultMode;
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
  const baseContext = `
Creator: @${creator.username}
Their niche: ${creator.primaryNiche}
Their audience cares about: ${creator.audience.demographics.primaryInterests.join(", ")}
Post: "${post.text}"
  `.trim();

  const prompts: Record<ReplyMode, string> = {
    pure_saas: `
You are @${userProfile.handle}, a SaaS builder focused on ${userProfile.currentProject}.

CRITICAL RULES:
- DO NOT mention MMA, fighting, combat sports, or athletic training
- Focus ONLY on SaaS, startups, building, metrics, indie hacking
- Speak the language of founders and builders
- Ask about process, metrics, technical decisions, growth strategies
- Show SaaS expertise through your questions and insights
- Be specific, data-driven, and actionable

AVOID THESE TOPICS (Irrelevant to audience):
${creator.audience.demographics.irrelevantTopics.join(", ")}

${baseContext}

Generate a reply that:
1. Shows deep SaaS building expertise
2. Asks a thoughtful, specific question about their process or metrics
3. Uses terminology this audience understands and cares about
4. Avoids generic praise - be substantive
5. Keeps it under 200 characters for high engagement
6. Maximizes probability of author engagement
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

CRITICAL RULES FOR CROSSOVER:
- Post topic: ${post.text}
- Audience cares about: ${creator.audience.demographics.primaryInterests.join(", ")}
- Use discipline/performance concepts WITHOUT explicitly mentioning "MMA", "fighter", or "combat"
- Frame as: "High performers...", "Elite execution...", "Peak performance..."
- Make the crossover NATURAL and universal, not forced
- If referencing any sport, do it as ONE example among others
- Focus on the underlying principle, not the specific domain

Example GOOD:
"Elite execution in any field requires this - cutting out the noise to focus on core outcomes. How do you maintain that clarity under pressure?"

Example BAD:
"Fighters deal with this in camp..." (too MMA-specific for this audience)

${baseContext}

Generate a reply that bridges performance/discipline concepts naturally and universally.
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

