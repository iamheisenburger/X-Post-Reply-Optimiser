// Mode Selector - Intelligently select reply mode based on context

import type { ReplyMode, CreatorIntelligence, TweetData, UserProfile } from "./types";

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
  const baseContext = `
Creator: @${creator.username}
Their niche: ${creator.primaryNiche}
Their audience cares about: ${creator.audience.demographics.primaryInterests.join(", ")}
Post: "${post.text}"
  `.trim();

  const prompts: Record<ReplyMode, string> = {
    pure_saas: `
You are @${userProfile.handle}, a SaaS builder focused on ${userProfile.currentProject}.

=== MANDATORY CONSTRAINTS (STRICT ENFORCEMENT) ===
1. LENGTH: 35-55 words MAXIMUM (will be rejected if longer)
2. QUESTIONS: Exactly ONE question, no more (will be rejected if multiple)
3. NO GENERIC OPENINGS: Do NOT use "absolutely", "love this", "great point", "you're spot on", "this is so true"
4. START WITH: Direct reference to their tweet OR specific SaaS insight
5. FOCUS: SaaS, startups, metrics, growth, indie hacking ONLY
6. NO MMA: Do NOT mention fighting, MMA, combat sports

=== EXAMPLES OF 90+ REPLIES ===

Example 1 (94/100):
"Your point about founder-market fit resonates. When you scaled from 0-100 customers, what was your one metric that predicted retention better than anything else?"
→ Why 94: Direct reference ✓, ONE specific question ✓, 32 words ✓, SaaS-specific ✓

Example 2 (91/100):
"The indie hacker journey is 90% learning what not to build. What validated your PMF hypothesis before you committed to full development?"
→ Why 91: Strong insight ✓, ONE question ✓, 28 words ✓, data-driven ✓

Example 3 (DO NOT DO - 65/100):
"Great post! I totally agree with your thoughts. Do you have any advice? What tools do you use? How did you start?"
→ Why BAD: Generic opening ✗, multiple questions ✗, no expertise ✗

=== YOUR TASK ===
Post: "${post.text}"
Audience: ${creator.audience.demographics.primaryInterests.join(", ")}

Generate ONE reply that:
- References their post directly OR starts with SaaS insight
- Has EXACTLY ONE data/process-focused question
- Is 35-55 words (strict)
- Shows SaaS building expertise
- No generic filler phrases

CRITICAL: If you violate ANY constraint above, the reply will be rejected and you'll regenerate.
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

=== MANDATORY CONSTRAINTS (STRICT ENFORCEMENT) ===
1. LENGTH: 35-55 words MAXIMUM (will be rejected if longer)
2. QUESTIONS: Exactly ONE question, no more (will be rejected if multiple)
3. NO GENERIC OPENINGS: Do NOT use "absolutely", "love this", "great point", "you're spot on", "this is so true"
4. START WITH: Direct reference to their tweet OR specific insight
5. USE NICHE LANGUAGE: ${creator.audience.demographics.primaryInterests.slice(0, 2).join(", ")}
6. NO MMA TERMS: No "fighter", "MMA", "UFC", "cage" - frame universally

=== EXAMPLES OF 90+ REPLIES ===

Example 1 (95/100):
"When you mentioned feeding hope over doubt, it reminded me of how elite performers reframe pressure as opportunity. What specific practices help you maintain that positive inner voice during challenging moments?"
→ Why 95: Direct reference ✓, ONE question ✓, 40 words ✓, no filler ✓, niche-relevant ✓

Example 2 (92/100):
"The concept of self-talk shaping reality resonates with peak performance psychology. What's your process for catching and reframing negative self-talk before it impacts your mindset?"
→ Why 92: Strong insight ✓, ONE question ✓, 32 words ✓, specific to audience ✓

Example 3 (DO NOT DO - 68/100):
"Absolutely love this! You're so right that our inner voice matters. I totally agree with your point about feeding hope. Do you have any tips? What works for you?"
→ Why BAD: Generic opening ✗, multiple questions ✗, no insight ✗, too long ✗

=== YOUR TASK ===
Post: "${post.text}"
Audience: ${creator.audience.demographics.primaryInterests.join(", ")}

Generate ONE reply that:
- References their post directly OR starts with specific insight
- Has EXACTLY ONE open-ended question
- Is 35-55 words (strict)
- No generic filler phrases
- Matches their audience's sophistication (${creator.audience.demographics.sophisticationLevel})

CRITICAL: If you violate ANY constraint above, the reply will be rejected and you'll regenerate.
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


