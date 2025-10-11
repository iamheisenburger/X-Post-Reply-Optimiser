// saas-templates.ts - Content-aware SaaS reply templates

import type { CreatorIntelligence } from '../types';
import type { ExtractedTopic } from '../topic-extractor';
import type { TweetContent } from '../content-analyzer';

export interface ReplyTemplate {
  hook: string;
  body: string;
  closer: string;
}

/**
 * Build a QUESTION reply for SaaS topics
 * Uses X algorithm: questions = 75x author response weight
 */
export function buildSaaSQuestion(
  topic: ExtractedTopic,
  tweetContent: TweetContent,
  creator: CreatorIntelligence,
  tweetText: string
): ReplyTemplate {
  const username = creator.username;
  
  // SaaS-specific question types based on topic
  const questions: Record<string, string[]> = {
    'product development': [
      'How did you prioritize which features to build first?',
      'What was your validation process before building this?',
      'How long did it take to ship the MVP?',
    ],
    'scaling': [
      'At what point did you need to rearchitect for scale?',
      'How did you handle the infrastructure costs during growth?',
      'What broke first when you scaled?',
    ],
    'team management': [
      'How did you structure the team as you scaled?',
      'What was your hiring process for early team members?',
      'How do you maintain culture during rapid growth?',
    ],
    'metrics': [
      'What metrics did you track in the early days vs now?',
      'How did you improve that conversion rate?',
      'What was the turning point in your growth metrics?',
    ],
    'marketing': [
      'What channel gave you the best ROI?',
      'How did you find your ICP?',
      'What was your CAC in the early days?',
    ],
  };
  
  const topicQuestions = questions[topic.mainTopic] || [
    'How did you figure this out?',
    'What was the biggest challenge here?',
    'What would you do differently?',
  ];
  
  // Pick question that matches creator's sophistication level
  const questionText = creator.audience.demographics.sophisticationLevel === 'expert'
    ? topicQuestions[0]  // Technical question
    : topicQuestions[topicQuestions.length - 1];  // Simpler question
  
  return {
    hook: `@${username}`,
    body: questionText,
    closer: '',
  };
}

/**
 * Build CONTRARIAN reply for SaaS topics
 * Uses X algorithm: pushback = memorable = author defends = engagement
 */
export function buildSaaSContrarian(
  topic: ExtractedTopic,
  tweetContent: TweetContent,
  creator: CreatorIntelligence,
  tweetText: string
): ReplyTemplate {
  const username = creator.username;
  
  // Contrarian angles per topic
  const contrarian: Record<string, string[]> = {
    'product development': [
      'Counterpoint: building too fast leads to tech debt that kills momentum later.',
      "I've seen teams ship fast but lose customers because quality suffered.",
      'The "move fast" advice works until your infrastructure can\'t handle scale.',
    ],
    'scaling': [
      'Premature scaling killed more startups than slow growth ever did.',
      'Scaling before product-market fit just amplifies your problems.',
      "I've watched companies scale infrastructure before they had users to serve.",
    ],
    'metrics': [
      "Vanity metrics look great but don't pay the bills.",
      'Tracking too many metrics early on is analysis paralysis.',
      "Every failed startup I studied had amazing metrics... until they didn't.",
    ],
    'team management': [
      'Hiring too fast dilutes culture faster than you can build it.',
      'Remote-first sounds great until you need to ship something hard.',
      "Culture decks don't build culture - hard decisions do.",
    ],
  };
  
  const angles = contrarian[topic.mainTopic] || [
    "I've seen the opposite work better in practice.",
    'This approach has hidden costs most people miss.',
    'The conventional wisdom here breaks down at scale.',
  ];
  
  return {
    hook: `@${username}`,
    body: angles[0],
    closer: 'What am I missing?',
  };
}

/**
 * Build ADD-VALUE reply for SaaS topics
 * Expands on their point with data/experience
 */
export function buildSaaSAddValue(
  topic: ExtractedTopic,
  tweetContent: TweetContent,
  creator: CreatorIntelligence,
  tweetText: string
): ReplyTemplate {
  const username = creator.username;
  
  // Add-value patterns per topic
  const additions: Record<string, string[]> = {
    'product development': [
      'This is why Stripe\'s "API first" approach worked - they validated with developers before building UI.',
      'Linear does this well - they ship weekly but maintain quality through strict QA gates.',
      'The best product teams I\'ve seen use a "one pager + prototype" validation flow before committing eng resources.',
    ],
    'scaling': [
      'Shopify\'s approach was interesting - they built for 10x scale from day 1, which seemed wasteful until Black Friday hit.',
      'The hardest part isn\'t technical scaling - it\'s keeping deploy times under 10 minutes as your codebase grows.',
      'Most scaling issues come from N+1 queries that were fine at 100 users but killed at 10k.',
    ],
    'metrics': [
      'The best SaaS companies track 1 north star metric in early days - everything else is noise.',
      'Revenue retention > customer retention for SaaS. You can lose 50% of customers but grow revenue if the right ones stay.',
      'Time to value is the metric most founders ignore but it predicts churn better than anything.',
    ],
  };
  
  const addition = additions[topic.mainTopic] || [
    'This connects to why successful founders focus on one thing at a time.',
  ];
  
  return {
    hook: `@${username}`,
    body: `Exactly. ${addition[0]}`,
    closer: '',
  };
}

/**
 * Select best template type based on creator profile
 */
export function selectSaaSTemplate(
  creator: CreatorIntelligence,
  topic: ExtractedTopic
): 'question' | 'contrarian' | 'add_value' {
  // Check what creator responds to
  const respondsTo = creator.audience.engagementPatterns.respondsTo;
  
  if (respondsTo.includes('thoughtful questions')) return 'question';
  if (respondsTo.includes('contrarian views') || respondsTo.includes('pushback')) return 'contrarian';
  if (respondsTo.includes('data-driven insights') || respondsTo.includes('specific examples')) return 'add_value';
  
  // Default: questions work best for engagement (75x weight)
  return 'question';
}

