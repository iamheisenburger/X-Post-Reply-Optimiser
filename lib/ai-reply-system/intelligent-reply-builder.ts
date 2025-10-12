// intelligent-reply-builder.ts - Full intelligence integration for reply building

import type { CreatorIntelligence } from './types';
import type { TweetContent } from './content-analyzer';
import type { ExtractedTopic } from './topic-extractor';
import type { ReplyConstraints } from './quality-gate';

export interface IntelligentReply {
  text: string;
  strategy: 'pure_curiosity' | 'devils_advocate' | 'expand_idea' | 'provide_evidence' | 'personal_crossover' | 'synthesize' | 'practical_application';
  reasoning: string;
}

/**
 * Build intelligent question reply using FULL creator profile + tweet content
 */
export function buildIntelligentQuestion(
  tweet: TweetContent,
  topic: ExtractedTopic,
  creator: CreatorIntelligence,
  constraints?: ReplyConstraints
): IntelligentReply {
  const username = creator.username;
  let question: string;
  const reasoning: string[] = [];
  
  // ====================================================================
  // STEP 1: Identify what THEY care about from their profile
  // ====================================================================
  const emphasizedTopics = creator.optimalReplyStrategy.emphasizeTopics;
  const respondsTo = creator.audience.engagementPatterns.respondsTo;
  const sophistication = creator.audience.demographics.sophisticationLevel;
  
  // ====================================================================
  // STEP 2: Find overlap between tweet content and their interests
  // ====================================================================
  const tweetMentionsTheirTopics = emphasizedTopics.filter(topic =>
    tweet.mainClaim.toLowerCase().includes(topic.toLowerCase()) ||
    tweet.keyPhrases.some(phrase => phrase.toLowerCase().includes(topic.toLowerCase()))
  );
  
  // ====================================================================
  // STEP 3: Build question that connects tweet → their interests
  // ====================================================================
  if (constraints?.mustIncludeQuestion) {
    // Use constraint if provided by quality gate
    question = constraints.mustIncludeQuestion;
    reasoning.push('Using quality gate improvement constraint');
  } else if (tweetMentionsTheirTopics.length > 0 && tweet.keyPhrases.length > 0) {
    // BEST CASE: Tweet mentions their emphasized topic + we have key phrases
    const theirTopic = tweetMentionsTheirTopics[0];
    const keyPhrase = tweet.keyPhrases[0];
    
    if (sophistication === 'expert') {
      question = `@${username} Re: ${keyPhrase} - how do you approach ${theirTopic} at scale when ${getScaleChallenge(topic)}?`;
      reasoning.push('Expert-level question connecting tweet phrase to their emphasized topic');
    } else {
      question = `@${username} On ${keyPhrase} - what\'s your framework for ${theirTopic} here?`;
      reasoning.push('Intermediate question connecting tweet to their interests');
    }
  } else if (tweet.keyPhrases.length > 0 && emphasizedTopics.length > 0) {
    // GOOD: We have key phrases, bridge to their topics
    const keyPhrase = tweet.keyPhrases[0];
    const theirTopic = emphasizedTopics[0];
    question = `@${username} How does ${keyPhrase} connect to ${theirTopic} in your experience?`;
    reasoning.push('Bridging tweet content to creator emphasized topics');
  } else if (tweet.problemMentioned) {
    // OKAY: They mentioned a problem, ask about their solution process
    question = `@${username} When you face "${tweet.problemMentioned}", what\'s your go-to approach?`;
    reasoning.push('Asking about their problem-solving process');
  } else if (tweet.keyPhrases.length > 0) {
    // FALLBACK: Reference their key phrase
    const keyPhrase = tweet.keyPhrases[0];
    question = `@${username} How did you develop this approach to ${keyPhrase}?`;
    reasoning.push('Generic question referencing tweet content');
  } else {
    // LAST RESORT: Use their emphasized topic
    const theirTopic = emphasizedTopics[0] || 'this';
    question = `@${username} What\'s your process for ${theirTopic}?`;
    reasoning.push('Fallback question using creator topic');
  }
  
  // ====================================================================
  // STEP 4: Adjust tone based on creator preference
  // ====================================================================
  const preferredTone = creator.audience.engagementPatterns.preferredTone;
  if (preferredTone === 'casual' && !question.includes('your')) {
    // Make more conversational
    question = question.replace('What is', 'What\'s');
    question = question.replace('you are', 'you\'re');
  } else if (preferredTone === 'professional') {
    // Keep formal
    question = question.replace('What\'s', 'What is');
  }
  
  reasoning.push(`Tone: ${preferredTone || 'default'}`);
  reasoning.push(`Targets: ${respondsTo.join(', ')}`);
  
  return {
    text: question,
    strategy: 'pure_curiosity',
    reasoning: reasoning.join(' • '),
  };
}

/**
 * Build intelligent contrarian reply using FULL creator profile
 */
export function buildIntelligentContrarian(
  tweet: TweetContent,
  topic: ExtractedTopic,
  creator: CreatorIntelligence,
  constraints?: ReplyConstraints
): IntelligentReply {
  const username = creator.username;
  let contrarian: string;
  const reasoning: string[] = [];
  
  // ====================================================================
  // STEP 1: Check what they emphasize and what they ignore
  // ====================================================================
  const emphasizeTopics = creator.optimalReplyStrategy.emphasizeTopics;
  const avoidTopics = creator.optimalReplyStrategy.avoidTopics;
  const sophistication = creator.audience.demographics.sophisticationLevel;
  
  // ====================================================================
  // STEP 2: Build pushback that references their interests
  // ====================================================================
  if (tweet.keyPhrases.length > 0 && emphasizeTopics.length > 0) {
    const keyPhrase = tweet.keyPhrases[0];
    const theirTopic = emphasizeTopics[0];
    
    if (sophistication === 'expert') {
      contrarian = `@${username} Re: ${keyPhrase} - I\'ve seen this break down when ${theirTopic} isn\'t prioritized. How do you handle that edge case?`;
      reasoning.push('Expert-level pushback connecting to their emphasis');
    } else {
      contrarian = `@${username} Counterpoint on ${keyPhrase}: what about when ${theirTopic} conflicts with this approach?`;
      reasoning.push('Thoughtful pushback bridging to their interests');
    }
  } else if (tweet.solutionMentioned && emphasizeTopics.length > 0) {
    const theirTopic = emphasizeTopics[0];
    contrarian = `@${username} "${tweet.solutionMentioned}" works until ${theirTopic} becomes the bottleneck. Thoughts?`;
    reasoning.push('Challenging their solution with their emphasized topic');
  } else if (tweet.keyPhrases.length > 0) {
    const keyPhrase = tweet.keyPhrases[0];
    contrarian = `@${username} On ${keyPhrase} - I\'ve watched this fail when execution > theory. What am I missing?`;
    reasoning.push('Generic pushback on tweet content');
  } else {
    // Fallback
    contrarian = `@${username} I\'ve seen the opposite work better in practice. What\'s your take on the edge cases?`;
    reasoning.push('Fallback contrarian');
  }
  
  // ====================================================================
  // STEP 3: Tone adjustment
  // ====================================================================
  const preferredTone = creator.audience.engagementPatterns.preferredTone;
  if (preferredTone === 'casual') {
    // Make more conversational for pushback
    if (!contrarian.includes('?')) {
      contrarian += ' Curious your take.';
    }
  }
  
  reasoning.push(`Tone: ${preferredTone || 'balanced'}`);
  reasoning.push('Targets 75x + 13.5x (author + conversation)');
  
  return {
    text: contrarian,
    strategy: 'devils_advocate',
    reasoning: reasoning.join(' • '),
  };
}

/**
 * Build intelligent add-value reply using FULL creator profile
 */
export function buildIntelligentAddValue(
  tweet: TweetContent,
  topic: ExtractedTopic,
  creator: CreatorIntelligence,
  constraints?: ReplyConstraints
): IntelligentReply {
  const username = creator.username;
  let addition: string;
  const reasoning: string[] = [];
  
  // ====================================================================
  // STEP 1: Identify crossover opportunities
  // ====================================================================
  const emphasizeTopics = creator.optimalReplyStrategy.emphasizeTopics;
  const replyMode = creator.optimalReplyStrategy.mode;
  const sophistication = creator.audience.demographics.sophisticationLevel;
  
  // ====================================================================
  // STEP 2: Build value-add that connects to THEIR expertise
  // ====================================================================
  if (tweet.keyPhrases.length > 0 && emphasizeTopics.length > 0) {
    const keyPhrase = tweet.keyPhrases[0];
    const theirTopic = emphasizeTopics[0];
    
    // Use their reply mode to select appropriate addition
    if (replyMode === 'mindset_crossover') {
      addition = `@${username} ${keyPhrase} + ${theirTopic} = this is the compound effect Jocko teaches. Systems > motivation.`;
      reasoning.push('Mindset crossover connecting tweet to their emphasis');
    } else if (replyMode === 'pure_saas') {
      addition = `@${username} ${keyPhrase} is why ${theirTopic} matters - Linear does this: ship weekly, iterate fast, compound improvements.`;
      reasoning.push('SaaS example connecting to their emphasis');
    } else if (replyMode === 'technical') {
      addition = `@${username} On ${keyPhrase}: the ${theirTopic} architecture solves this. Scale pattern: async processing → queue → batch.`;
      reasoning.push('Technical deep-dive matching their mode');
    } else {
      addition = `@${username} ${keyPhrase} connects to ${theirTopic} - this is the foundation most people miss.`;
      reasoning.push('General value-add connecting concepts');
    }
  } else if (tweet.hasExample && tweet.exampleContent && emphasizeTopics.length > 0) {
    const theirTopic = emphasizeTopics[0];
    addition = `@${username} Your example (${tweet.exampleContent.substring(0, 30)}...) illustrates ${theirTopic} perfectly. The key is consistency > intensity.`;
    reasoning.push('Building on their example with their topic');
  } else if (tweet.keyPhrases.length > 0) {
    const keyPhrase = tweet.keyPhrases[0];
    addition = `@${username} ${keyPhrase} - GSP applied this principle: train at 70% until automatic, perform at 100%.`;
    reasoning.push('Generic value-add with proven principle');
  } else {
    addition = `@${username} This principle compounds everywhere - systems beat motivation, consistency beats intensity.`;
    reasoning.push('Fallback philosophical connection');
  }
  
  // ====================================================================
  // STEP 3: Sophistication adjustment
  // ====================================================================
  if (sophistication === 'beginner') {
    // Simplify
    addition = addition.replace(/architecture|compound effect|async processing/, 'approach');
  }
  
  reasoning.push(`Sophistication: ${sophistication}`);
  reasoning.push(`Mode: ${replyMode}`);
  
  return {
    text: addition,
    strategy: 'expand_idea',
    reasoning: reasoning.join(' • '),
  };
}

// Helper functions

function getScaleChallenge(topic: ExtractedTopic): string {
  const challenges: Record<string, string> = {
    'product development': 'maintaining velocity without tech debt',
    'scaling': 'cost constraints hit',
    'team management': 'culture dilutes',
    'metrics': 'vanity metrics diverge from revenue',
    'training': 'volume conflicts with recovery',
    'fighting': 'opponent adapts mid-fight',
    'discipline': 'external motivation disappears',
  };
  
  return challenges[topic.mainTopic] || 'constraints increase';
}

