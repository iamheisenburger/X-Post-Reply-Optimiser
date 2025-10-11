// mindset-templates.ts - Mindset/philosophy/crossover templates

import type { CreatorIntelligence } from '../types';
import type { ExtractedTopic } from '../topic-extractor';

export interface ReplyTemplate {
  hook: string;
  body: string;
  closer: string;
}

/**
 * Build QUESTION reply for mindset topics
 * Works across SaaS, MMA, life philosophy
 */
export function buildMindsetQuestion(
  topic: ExtractedTopic,
  creator: CreatorIntelligence,
  tweetText: string
): ReplyTemplate {
  const username = creator.username;
  
  const questions: Record<string, string[]> = {
    'discipline': [
      'What\'s your framework for building habits that actually stick?',
      'How do you maintain discipline when external motivation disappears?',
      'What\'s the difference between discipline and just forcing yourself?',
    ],
    'general': [
      'How did you develop this perspective?',
      'What changed your thinking on this?',
      'Where did you learn this principle?',
    ],
  };
  
  const topicQuestions = questions[topic.mainTopic] || questions['general'];
  
  return {
    hook: `@${username}`,
    body: topicQuestions[0],
    closer: '',
  };
}

/**
 * Build CONTRARIAN reply for mindset topics
 */
export function buildMindsetContrarian(
  topic: ExtractedTopic,
  creator: CreatorIntelligence,
  tweetText: string
): ReplyTemplate {
  const username = creator.username;
  
  const contrarian = [
    'Most "discipline" advice is just toxic productivity disguised as virtue.',
    'The hustle mentality breaks more people than it builds.',
    'Consistency without strategy is just repeated failure.',
    'Motivation is overrated - I\'ve built more when I didn\'t feel like it.',
  ];
  
  return {
    hook: `@${username}`,
    body: contrarian[0],
    closer: 'Curious your take.',
  };
}

/**
 * Build ADD-VALUE reply for mindset topics
 * Connects concepts across domains (SaaS + MMA + philosophy)
 */
export function buildMindsetAddValue(
  topic: ExtractedTopic,
  creator: CreatorIntelligence,
  tweetText: string
): ReplyTemplate {
  const username = creator.username;
  
  // Crossover insights that work across niches
  const additions = [
    'This is the same principle Jocko teaches - discipline creates freedom. Remove decisions, execute.',
    'Amazon\'s "bias for action" is this - perfect is the enemy of shipped.',
    'GSP applied this to fighting - train so much it becomes automatic, fight becomes flow state.',
    'Naval\'s tweet about specific knowledge applies here - build what only you can build.',
    'Cus D\'Amato taught Tyson this - the training removes fear, the fight becomes performance.',
  ];
  
  // Pick addition that matches creator\'s crossover potential
  let addition = additions[0];
  if (creator.crossoverPotential.saasRelevance >= 4) {
    addition = 'Amazon\'s "bias for action" is this - perfect is the enemy of shipped.';
  } else if (creator.crossoverPotential.mmaRelevance >= 4) {
    addition = 'GSP applied this to fighting - train so much it becomes automatic, fight becomes flow state.';
  }
  
  return {
    hook: `@${username}`,
    body: `This. ${addition}`,
    closer: '',
  };
}

/**
 * Build CROSSOVER reply - connects their niche to another domain
 * Example: SaaS founder → MMA metaphor
 */
export function buildCrossoverReply(
  topic: ExtractedTopic,
  creator: CreatorIntelligence,
  tweetText: string,
  yourNiche: 'saas' | 'mma'
): ReplyTemplate {
  const username = creator.username;
  
  // If they're SaaS and you're MMA background
  if (creator.primaryNiche === 'saas' && yourNiche === 'mma') {
    return {
      hook: `@${username}`,
      body: 'This is like fight preparation - you drill fundamentals at 70% until they become automatic, then fight at 100% is pure flow.',
      closer: '',
    };
  }
  
  // If they're MMA and you're SaaS background
  if (creator.primaryNiche === 'mma' && yourNiche === 'saas') {
    return {
      hook: `@${username}`,
      body: 'Same as product development - ship small, iterate fast, compound improvements. Linear does this with weekly releases.',
      closer: '',
    };
  }
  
  // Default: philosophy bridge
  return {
    hook: `@${username}`,
    body: 'The principle here applies everywhere - systems beat motivation, consistency compounds.',
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

