/**
 * REPLY STRATEGY SELECTOR
 *
 * PROBLEM: Current system forces personal story into EVERY reply
 * SOLUTION: Dynamically select the best value-add approach for each tweet
 *
 * REPLY VALUE TYPES:
 * 1. Pure Curiosity - Ask genuinely interesting question (no personal story)
 * 2. Devil's Advocate - Challenge assumption intellectually
 * 3. Expand Idea - Build on their insight (add to THEIR narrative)
 * 4. Provide Evidence - Share relevant data/research
 * 5. Personal Crossover - Connect your experience (ONLY when natural)
 * 6. Synthesize - Connect to related concept/creator
 * 7. Practical Application - Ask about concrete scenario
 */

import type { TweetContent } from "./content-analyzer";
import type { CreatorIntelligence } from "./types";

export type ReplyValueType =
  | "pure_curiosity"
  | "devils_advocate"
  | "expand_idea"
  | "provide_evidence"
  | "personal_crossover"
  | "synthesize"
  | "practical_application";

export interface ReplyStrategy {
  primary: ReplyValueType;
  secondary: ReplyValueType;
  fallback: ReplyValueType;
  reasoning: string;
  scores: Record<ReplyValueType, number>;
}

export interface StrategyContext {
  tweetContent: TweetContent;
  creatorNiche: string;
  yourExperiences: string[];
  minutesSincePosted: number;
}

/**
 * Analyze tweet and select best reply strategies
 */
export function selectReplyStrategies(context: StrategyContext): ReplyStrategy {
  const scores: Record<ReplyValueType, number> = {
    pure_curiosity: 0,
    devils_advocate: 0,
    expand_idea: 0,
    provide_evidence: 0,
    personal_crossover: 0,
    synthesize: 0,
    practical_application: 0,
  };

  const tweet = context.tweetContent;
  const tweetText = tweet.mainClaim.toLowerCase();

  // ============================================
  // SCORE: PURE CURIOSITY
  // Best when: Tweet shares insight, you don't need personal story
  // ============================================
  scores.pure_curiosity = 40; // Base score (always viable)

  // Boost if tweet is explanatory/insightful
  if (tweetText.includes('because') || tweetText.includes('why') || tweetText.includes('how')) {
    scores.pure_curiosity += 15;
  }

  // Boost if tweet shares a principle/framework
  if (tweetText.includes('principle') || tweetText.includes('rule') || tweetText.includes('law')) {
    scores.pure_curiosity += 10;
  }

  // ============================================
  // SCORE: DEVIL'S ADVOCATE
  // Best when: Bold claim, absolute statement, controversial
  // ============================================
  scores.devils_advocate = 30; // Base score

  // Boost for absolute statements
  const absolutePatterns = [
    /\balways\b/, /\bnever\b/, /\beveryone\b/, /\bno one\b/,
    /\ball\b/, /\bnone\b/, /\bwill\b/, /\bmust\b/
  ];
  absolutePatterns.forEach(pattern => {
    if (pattern.test(tweetText)) scores.devils_advocate += 12;
  });

  // Boost for bold claims
  if (tweetText.includes('truth') || tweetText.includes('fact') || tweetText.includes('reality')) {
    scores.devils_advocate += 15;
  }

  // ============================================
  // SCORE: EXPAND IDEA
  // Best when: Tweet introduces concept that can be built upon
  // ============================================
  scores.expand_idea = 35; // Base score

  // Boost if tweet is short (leaves room to expand)
  if (tweet.mainClaim.length < 150) {
    scores.expand_idea += 15;
  }

  // Boost if tweet introduces a concept
  if (tweetText.includes('concept') || tweetText.includes('idea') || tweetText.includes('approach')) {
    scores.expand_idea += 12;
  }

  // ============================================
  // SCORE: PROVIDE EVIDENCE
  // Best when: Tweet makes claim that can be supported/challenged with data
  // ============================================
  scores.provide_evidence = 25; // Base score

  // Boost if tweet already has numbers (data discussion)
  if (tweet.numbers.length > 0) {
    scores.provide_evidence += 20;
  }

  // Boost if tweet makes measurable claim
  if (tweetText.includes('increase') || tweetText.includes('decrease') || tweetText.includes('growth')) {
    scores.provide_evidence += 15;
  }

  // ============================================
  // SCORE: PERSONAL CROSSOVER
  // Best when: Tweet topic DIRECTLY matches your authentic experience
  // ============================================
  scores.personal_crossover = 20; // Low base score (don't force it)

  // Check if tweet topic matches your experiences
  const personalRelevanceKeywords: Record<string, string[]> = {
    starting: ['start', 'begin', 'zero', 'first', 'launch', 'new'],
    building: ['build', 'develop', 'create', 'ship', 'mvp'],
    mma: ['discipline', 'training', 'fight', 'mental', 'physical'],
    saas: ['saas', 'software', 'subscription', 'product', 'startup'],
    algorithm: ['algorithm', 'system', 'data', 'optimize', 'metric'],
    indie: ['indie', 'solo', 'bootstrap', 'founder', 'maker'],
  };

  context.yourExperiences.forEach(exp => {
    const expLower = exp.toLowerCase();
    Object.entries(personalRelevanceKeywords).forEach(([category, keywords]) => {
      if (expLower.includes(category)) {
        keywords.forEach(keyword => {
          if (tweetText.includes(keyword)) {
            scores.personal_crossover += 15;
          }
        });
      }
    });
  });

  // PENALTY: If niche is very different from yours, reduce personal crossover score
  const yourNiches = ['saas', 'tech', 'mma', 'indie'];
  const creatorNicheLower = context.creatorNiche.toLowerCase();
  const nicheMatch = yourNiches.some(niche => creatorNicheLower.includes(niche));
  if (!nicheMatch) {
    scores.personal_crossover -= 15;
  }

  // ============================================
  // SCORE: SYNTHESIZE
  // Best when: Tweet relates to broader concept/movement
  // ============================================
  scores.synthesize = 30; // Base score

  // Boost if tweet is philosophical/abstract
  if (tweetText.includes('think') || tweetText.includes('believe') || tweetText.includes('philosophy')) {
    scores.synthesize += 15;
  }

  // Boost if tweet is about a movement/trend
  if (tweetText.includes('trend') || tweetText.includes('movement') || tweetText.includes('shift')) {
    scores.synthesize += 12;
  }

  // ============================================
  // SCORE: PRACTICAL APPLICATION
  // Best when: Tweet shares theory/principle that needs concrete example
  // ============================================
  scores.practical_application = 35; // Base score

  // Boost if tweet is theoretical
  if (tweetText.includes('theory') || tweetText.includes('concept') || tweetText.includes('principle')) {
    scores.practical_application += 15;
  }

  // Boost if tweet lacks specific examples
  if (tweet.numbers.length === 0 && !tweetText.match(/\bexample\b|\blike\b|\bsuch as\b/)) {
    scores.practical_application += 12;
  }

  // ============================================
  // RECENCY BOOST: Early replies favor curiosity/questions
  // ============================================
  if (context.minutesSincePosted <= 15) {
    scores.pure_curiosity += 10;
    scores.practical_application += 8;
  }

  // ============================================
  // SELECT TOP 3 STRATEGIES
  // ============================================
  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([type]) => type as ReplyValueType);

  const primary = sorted[0];
  const secondary = sorted[1];
  const fallback = sorted[2];

  const reasoning = buildReasoning(primary, scores[primary], context);

  return {
    primary,
    secondary,
    fallback,
    reasoning,
    scores,
  };
}

function buildReasoning(strategy: ReplyValueType, score: number, context: StrategyContext): string {
  const reasons: Record<ReplyValueType, string> = {
    pure_curiosity: `Ask genuine question about their insight (score: ${score}). Tweet shares knowledge worth exploring.`,
    devils_advocate: `Challenge assumption thoughtfully (score: ${score}). Tweet makes bold/absolute claim.`,
    expand_idea: `Build on their idea (score: ${score}). Tweet introduces concept with room to develop.`,
    provide_evidence: `Support/challenge with data (score: ${score}). Tweet discusses measurable concepts.`,
    personal_crossover: `Connect your authentic experience (score: ${score}). Tweet topic directly matches your journey.`,
    synthesize: `Connect to broader concept (score: ${score}). Tweet relates to larger framework/movement.`,
    practical_application: `Ask about concrete scenario (score: ${score}). Tweet shares theory needing real-world example.`,
  };

  return reasons[strategy];
}

/**
 * Get strategy instructions for Claude prompt
 */
export function getStrategyInstructions(strategy: ReplyStrategy): string {
  const instructions: Record<ReplyValueType, string> = {
    pure_curiosity: `
PURE CURIOSITY - Ask a genuinely interesting question about their insight
- Focus on understanding THEIR perspective deeper
- No personal story needed
- Can be a single question OR a brief observation + question
Example 1: "What made you realize [X] vs the conventional [Y]?"
Example 2: "The [specific part] hits different. How did you discover this?"`,

    devils_advocate: `
DEVIL'S ADVOCATE - Challenge their assumption with intellectual pushback
- Use "but", "actually", "though", "counterpoint" to signal disagreement
- NO QUESTION MARKS - make a statement that challenges them
- Stay respectful but probe edge cases
Example 1: "But this breaks down when [specific scenario]. The [their claim] doesn't account for [edge case]."
Example 2: "Actually disagree here - [specific part] ignores [counter-evidence]."`,

    expand_idea: `
EXPAND THEIR IDEA - Build on what they said with your own addition
- Add to THEIR narrative, not yours
- Can be pure expansion OR expansion + clarifying question
- Use "This also", "Building on this", "Plus" to signal you're adding
Example 1: "This also explains why [related pattern]. The [their concept] connects to [bigger framework]."
Example 2: "Plus the [related aspect] amplifies this. Have you seen it work with [adjacent case]?"`,

    provide_evidence: `
PROVIDE EVIDENCE - Share data, research, or specific pattern (NO question)
- Support OR challenge their claim with concrete evidence
- Use numbers, percentages, or specific observations
- No personal story unless it includes hard data
Example 1: "I've tracked this across 40+ accounts - replies with [feature] get 3.2x more author responses."
Example 2: "The data actually shows opposite: [stat] in [study]. Though your point about [X] still holds."`,

    personal_crossover: `
PERSONAL CROSSOVER - Connect your authentic experience with specificity
- Your experience: ${strategy.reasoning}
- Be CONCRETE: "0 users", "3 Twitter followers", "Day 4 of building"
- Can be statement OR statement + question
Example 1: "Going through this now building [specific project]. The [their insight] is exactly what I hit at [specific stage]."
Example 2: "Hit this 3 weeks in with 0 users. Shifted from [old approach] to [new approach] based on [their principle]."`,

    synthesize: `
SYNTHESIZE - Connect their idea to broader concept, framework, or thinker
- Can be pure connection OR connection + question
- Reference frameworks, mental models, or related creators (if authentic)
Example 1: "This mirrors Taleb's antifragility concept - systems that [their point] get stronger from [chaos]."
Example 2: "The [concept] vibes with Kahneman's work on [topic]. How intentional was that connection for you?"`,

    practical_application: `
PRACTICAL APPLICATION - Ask how their principle applies to specific scenario
- Focus on CONCRETE, realistic situations
- Ask about edge cases or implementation details
Example 1: "How would you apply this to [specific realistic situation with details]?"
Example 2: "At what point does [their principle] transition from [stage A] to [stage B]?"`,
  };

  return `
PRIMARY STRATEGY: ${strategy.primary.replace(/_/g, ' ').toUpperCase()}
${instructions[strategy.primary]}

SECONDARY STRATEGY: ${strategy.secondary.replace(/_/g, ' ').toUpperCase()}
${instructions[strategy.secondary]}

FALLBACK STRATEGY: ${strategy.fallback.replace(/_/g, ' ').toUpperCase()}
${instructions[strategy.fallback]}

REASONING: ${strategy.reasoning}

🚨 CRITICAL FOR VARIETY:
- Pure Curiosity = question
- Devil's Advocate = pushback statement (NO question mark)
- Expand Idea = additive statement (question optional)
- Provide Evidence = statement with data/pattern (NO question)
- Personal Crossover = personal statement (question optional)
- Synthesize = connection statement (question optional)
- Practical Application = question about scenario

Generate 3 DIFFERENT types of replies. Don't default to questions for everything.
`.trim();
}
