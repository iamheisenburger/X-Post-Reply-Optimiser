// mindset-templates.ts - Content-aware mindset/philosophy templates

import type { CreatorIntelligence } from '../types';
import type { ExtractedTopic } from '../topic-extractor';
import type { TweetContent } from '../content-analyzer';

export interface ReplyTemplate {
  hook: string;
  body: string;
  closer: string;
}

/**
 * Build QUESTION reply for mindset topics
 * References SPECIFIC content from the tweet
 */
export function buildMindsetQuestion(
  topic: ExtractedTopic,
  tweetContent: TweetContent,
  creator: CreatorIntelligence,
  tweetText: string
): ReplyTemplate {
  const username = creator.username;
  
  // Build question that references specific content
  let question: string;
  
  if (tweetContent.keyPhrases.length > 0) {
    // Reference their specific phrase
    const keyPhrase = tweetContent.keyPhrases[0];
    question = `How did you develop this approach to ${keyPhrase}?`;
  } else if (tweetContent.problemMentioned) {
    // Ask about the problem they mentioned
    question = `What\'s your process for working through "${tweetContent.problemMentioned}"?`;
  } else if (tweetContent.solutionMentioned) {
    // Ask about their solution
    question = `How long did it take to figure out that "${tweetContent.solutionMentioned}"?`;
  } else if (tweetContent.mainClaim.length > 20) {
    // Reference their main claim
    const shortened = tweetContent.mainClaim.substring(0, 60);
    question = `What led you to "${shortened}..."?`;
  } else {
    // Fallback - still reference their perspective
    question = 'What changed your perspective on this?';
  }
  
  return {
    hook: `@${username}`,
    body: question,
    closer: '',
  };
}

/**
 * Build CONTRARIAN reply for mindset topics
 * Challenges their SPECIFIC point, not generic pushback
 */
export function buildMindsetContrarian(
  topic: ExtractedTopic,
  tweetContent: TweetContent,
  creator: CreatorIntelligence,
  tweetText: string
): ReplyTemplate {
  const username = creator.username;
  
  // Build contrarian take that references their specific content
  let contrarian: string;
  
  if (tweetContent.keyPhrases.length > 0) {
    // Challenge their specific phrase
    const keyPhrase = tweetContent.keyPhrases[0];
    contrarian = `Counterpoint on ${keyPhrase}: I\'ve seen this backfire when people miss the underlying why.`;
  } else if (tweetContent.solutionMentioned) {
    // Challenge their solution
    contrarian = `"${tweetContent.solutionMentioned}" works until it doesn\'t - what\'s the failure mode here?`;
  } else if (tweetContent.mainClaim.length > 20) {
    // Challenge their main point
    const shortened = tweetContent.mainClaim.substring(0, 50);
    contrarian = `Re: "${shortened}..." - I\'ve watched this approach fail when ${getFailureScenario(topic)}`;
  } else {
    // Generic contrarian (last resort)
    contrarian = 'I\'ve seen the opposite work better in practice. What am I missing?';
  }
  
  return {
    hook: `@${username}`,
    body: contrarian,
    closer: '',
  };
}

function getFailureScenario(topic: ExtractedTopic): string {
  if (topic.mainTopic.includes('discipline')) return 'people confuse discipline with overwork';
  if (topic.mainTopic.includes('scale')) return 'execution beats theory';
  return 'context changes';
}

/**
 * Build ADD-VALUE reply for mindset topics
 * Builds on their SPECIFIC point with related insight
 */
export function buildMindsetAddValue(
  topic: ExtractedTopic,
  tweetContent: TweetContent,
  creator: CreatorIntelligence,
  tweetText: string
): ReplyTemplate {
  const username = creator.username;
  
  // Build value-add that references their content
  let addition: string;
  
  if (tweetContent.keyPhrases.length > 0) {
    const keyPhrase = tweetContent.keyPhrases[0];
    // Connect their phrase to a principle
    addition = `Re: ${keyPhrase} - this is why systems beat motivation. Jocko teaches this: discipline = freedom.`;
  } else if (tweetContent.hasExample && tweetContent.exampleContent) {
    // Build on their example
    addition = `Your example (${tweetContent.exampleContent}) connects to what Naval says about specific knowledge - compound the unique.`;
  } else if (tweetContent.mainClaim.length > 20) {
    const shortened = tweetContent.mainClaim.substring(0, 50);
    addition = `On "${shortened}..." - GSP applied this in fighting: train fundamentals until automatic, then perform at 100%.`;
  } else {
    // Generic add-value
    addition = 'This is the foundational principle - systems remove decisions, consistency compounds.';
  }
  
  return {
    hook: `@${username}`,
    body: addition,
    closer: '',
  };
}

/**
 * Build CROSSOVER reply - connects their SPECIFIC point to another domain
 */
export function buildCrossoverReply(
  topic: ExtractedTopic,
  tweetContent: TweetContent,
  creator: CreatorIntelligence,
  tweetText: string,
  yourNiche: 'saas' | 'mma'
): ReplyTemplate {
  const username = creator.username;
  
  // Get their key phrase or main claim
  const reference = tweetContent.keyPhrases[0] || tweetContent.mainClaim.substring(0, 40);
  
  // If they're SaaS and you're MMA background
  if (creator.primaryNiche === 'saas' && yourNiche === 'mma') {
    return {
      hook: `@${username}`,
      body: `Re: ${reference} - this is like fight prep: drill fundamentals at 70% until automatic, then fight at 100% is pure flow.`,
      closer: '',
    };
  }
  
  // If they're MMA and you're SaaS background
  if (creator.primaryNiche === 'mma' && yourNiche === 'saas') {
    return {
      hook: `@${username}`,
      body: `On ${reference} - same as product dev: ship small, iterate fast, compound improvements. Linear does weekly releases.`,
      closer: '',
    };
  }
  
  // Default: philosophy bridge with their content
  return {
    hook: `@${username}`,
    body: `Your point on ${reference} - this principle applies everywhere: systems beat motivation, consistency compounds.`,
    closer: '',
  };
}

/**
 * Select best template type for mindset topics
 */
export function selectMindsetTemplate(
  creator: CreatorIntelligence,
  topic: ExtractedTopic
): 'question' | 'contrarian' | 'add_value' | 'crossover' {
  const respondsTo = creator.audience.engagementPatterns.respondsTo;
  
  // Check if crossover makes sense (creator is open to other domains)
  if (creator.crossoverPotential.disciplineTopics >= 4 || creator.crossoverPotential.philosophyTopics >= 4) {
    return 'crossover';
  }
  
  if (respondsTo.includes('deep questions')) return 'question';
  if (respondsTo.includes('contrarian views')) return 'contrarian';
  
  return 'add_value';
}

