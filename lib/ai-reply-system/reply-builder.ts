// reply-builder.ts - Core reply building system with content-aware templates

import type { CreatorIntelligence } from './types';
import { extractTopic, identifyNicheElements, type ExtractedTopic } from './topic-extractor';
import { analyzeTweetContent, type TweetContent } from './content-analyzer';
import { 
  buildSaaSQuestion, buildSaaSContrarian, buildSaaSAddValue, selectSaaSTemplate 
} from './templates/saas-templates';
import { 
  buildMMAQuestion, buildMMAContrarian, buildMMAAddValue, selectMMATemplate 
} from './templates/mma-templates';
import { 
  buildMindsetQuestion, buildMindsetContrarian, buildMindsetAddValue, 
  buildCrossoverReply, selectMindsetTemplate 
} from './templates/mindset-templates';
import { analyzeReplyFeatures, predictEngagement } from '../x-algorithm';

export interface ReplyTemplate {
  hook: string;
  body: string;
  closer: string;
}

export interface BuiltReply {
  text: string;
  strategy: 'question' | 'contrarian' | 'add_value' | 'crossover';
  score: number;
  features: {
    hasQuestion: boolean;
    hasPushback: boolean;
    hasSpecificData: boolean;
    referencesOriginalTweet: boolean;
    matchesCreatorNiche: boolean;
    matchesCreatorTone: boolean;
  };
  reasoning: string;
  prediction: {
    authorReplyProb: number;
    repliesExpected: number;
    likesExpected: number;
    profileClicksExpected: number;
  };
}

export interface ReplyBuilderContext {
  tweetText: string;
  tweetAuthor: string;
  creatorProfile: CreatorIntelligence;
  minutesSincePosted: number;
  yourHandle: string;
  yourNiche?: 'saas' | 'mma';
}

/**
 * Main reply builder - builds 3 replies using content-aware templates
 * References ACTUAL tweet content, not generic patterns
 */
export async function buildReplies(context: ReplyBuilderContext): Promise<BuiltReply[]> {
  const { tweetText, creatorProfile, minutesSincePosted } = context;
  
  // 1. Extract topic from tweet (NLP, no AI)
  const topic = extractTopic(tweetText);
  const nicheElements = identifyNicheElements(tweetText);
  
  // 2. EXTRACT ACTUAL TWEET CONTENT (this is the key!)
  const tweetContent = analyzeTweetContent(tweetText);
  
  console.log(`📊 Topic: ${topic.mainTopic} (${topic.tweetType})`);
  console.log(`📝 Main claim: ${tweetContent.mainClaim}`);
  console.log(`🔑 Key phrases: ${tweetContent.keyPhrases.slice(0, 3).join(', ')}`);
  console.log(`🎯 Niche: SaaS=${nicheElements.isSaaS}, MMA=${nicheElements.isMMA}, Mindset=${nicheElements.isMindset}`);
  
  // 3. Select template system based on creator niche + tweet content
  const templateSystem = selectTemplateSystem(creatorProfile, nicheElements);
  console.log(`🛠️  Using template system: ${templateSystem}`);
  
  // 4. Build 3 different replies using content-aware templates
  const replies = await buildDiverseReplies(templateSystem, topic, tweetContent, creatorProfile, context);
  
  // 5. Score each reply deterministically
  const scoredReplies = replies.map(reply => scoreReply(reply, minutesSincePosted));
  
  // 6. Sort by score (descending)
  return scoredReplies.sort((a, b) => b.score - a.score);
}

/**
 * Select which template system to use based on creator + tweet
 */
function selectTemplateSystem(
  creator: CreatorIntelligence,
  nicheElements: ReturnType<typeof identifyNicheElements>
): 'saas' | 'mma' | 'mindset' {
  // If creator is primarily one niche, use that system
  if (creator.primaryNiche === 'saas' || creator.primaryNiche === 'tech') {
    return 'saas';
  }
  
  if (creator.primaryNiche === 'mma') {
    return 'mma';
  }
  
  // If tweet has strong niche signals, match them
  if (nicheElements.isSaaS || nicheElements.isTech) {
    return 'saas';
  }
  
  if (nicheElements.isMMA) {
    return 'mma';
  }
  
  // Default: mindset/crossover system
  return 'mindset';
}

/**
 * Build 3 diverse replies using the selected template system
 * Now passes tweetContent so templates can reference specific content
 */
async function buildDiverseReplies(
  system: 'saas' | 'mma' | 'mindset',
  topic: ExtractedTopic,
  tweetContent: TweetContent,
  creator: CreatorIntelligence,
  context: ReplyBuilderContext
): Promise<ReplyTemplate[]> {
  
  const replies: ReplyTemplate[] = [];
  
  if (system === 'saas') {
    replies.push(buildSaaSQuestion(topic, tweetContent, creator, context.tweetText));
    replies.push(buildSaaSContrarian(topic, tweetContent, creator, context.tweetText));
    replies.push(buildSaaSAddValue(topic, tweetContent, creator, context.tweetText));
  } else if (system === 'mma') {
    replies.push(buildMMAQuestion(topic, tweetContent, creator, context.tweetText));
    replies.push(buildMMAContrarian(topic, tweetContent, creator, context.tweetText));
    replies.push(buildMMAAddValue(topic, tweetContent, creator, context.tweetText));
  } else {
    // Mindset/crossover system
    replies.push(buildMindsetQuestion(topic, tweetContent, creator, context.tweetText));
    replies.push(buildMindsetContrarian(topic, tweetContent, creator, context.tweetText));
    
    // Use crossover if applicable, otherwise add-value
    if (creator.crossoverPotential.disciplineTopics >= 4) {
      replies.push(buildCrossoverReply(topic, tweetContent, creator, context.tweetText, context.yourNiche || 'saas'));
    } else {
      replies.push(buildMindsetAddValue(topic, tweetContent, creator, context.tweetText));
    }
  }
  
  return replies;
}

/**
 * Score a reply deterministically using X algorithm
 */
function scoreReply(reply: ReplyTemplate, minutesSincePosted: number): BuiltReply {
  // Assemble full reply text
  const text = [reply.hook, reply.body, reply.closer].filter(Boolean).join(' ');
  
  // Analyze features
  const features = analyzeReplyFeatures(text);
  
  // Predict engagement using X algorithm weights
  const prediction = predictEngagement(features, minutesSincePosted);
  
  // Determine strategy
  let strategy: BuiltReply['strategy'] = 'add_value';
  if (features.hasQuestion) strategy = 'question';
  else if (features.hasPushback) strategy = 'contrarian';
  
  // Build feature breakdown
  const featureBreakdown = {
    hasQuestion: features.hasQuestion,
    hasPushback: features.hasPushback,
    hasSpecificData: features.hasSpecificData,
    referencesOriginalTweet: features.callsOutOP,
    matchesCreatorNiche: true,  // Templates are niche-matched
    matchesCreatorTone: true,   // Templates are tone-matched
  };
  
  // Generate reasoning
  const reasoning = generateReasoning(strategy, featureBreakdown, prediction);
  
  // Calculate composite score (0-100)
  const score = calculateCompositeScore(prediction);
  
  return {
    text,
    strategy,
    score,
    features: featureBreakdown,
    reasoning,
    prediction: {
      authorReplyProb: prediction.authorReplyProb,
      repliesExpected: prediction.repliesExpected,
      likesExpected: prediction.likesExpected,
      profileClicksExpected: prediction.profileClicksExpected,
    },
  };
}

/**
 * Calculate composite score (0-100) based on X algorithm predictions
 */
function calculateCompositeScore(prediction: ReturnType<typeof predictEngagement>): number {
  // Weights match X algorithm priorities
  const authorWeight = 0.50;  // 75x in X algo
  const conversationWeight = 0.30;  // 13.5x in X algo
  const profileClickWeight = 0.15;  // 5x in X algo
  const likeWeight = 0.05;  // 1x in X algo
  
  // Normalize to 0-100 scale
  const authorScore = prediction.authorReplyProb * 100;
  const conversationScore = Math.min(100, (prediction.repliesExpected / 10) * 100);
  const profileClickScore = Math.min(100, (prediction.profileClicksExpected / 10) * 100);
  const likeScore = Math.min(100, (prediction.likesExpected / 20) * 100);
  
  const composite = 
    authorScore * authorWeight +
    conversationScore * conversationWeight +
    profileClickScore * profileClickWeight +
    likeScore * likeWeight;
  
  return Math.round(Math.max(1, Math.min(100, composite)));
}

/**
 * Generate human-readable reasoning for why this reply is good
 */
function generateReasoning(
  strategy: BuiltReply['strategy'],
  features: BuiltReply['features'],
  prediction: ReturnType<typeof predictEngagement>
): string {
  const reasons: string[] = [];
  
  // Strategy-specific reasoning
  if (strategy === 'question') {
    reasons.push(`Asks a specific question targeting ${Math.round(prediction.authorReplyProb * 100)}% author response probability (75x X algorithm weight)`);
  } else if (strategy === 'contrarian') {
    reasons.push(`Polite pushback creates memorable engagement (increases author response + conversation)`);
  } else if (strategy === 'add_value') {
    reasons.push(`Adds specific insight that expands the conversation`);
  } else if (strategy === 'crossover') {
    reasons.push(`Connects concepts across domains to stand out`);
  }
  
  // Feature-based reasoning
  if (features.hasSpecificData) {
    reasons.push(`References specific examples/data to build credibility`);
  }
  
  if (features.referencesOriginalTweet) {
    reasons.push(`Directly engages with tweet author for notification priority`);
  }
  
  if (features.matchesCreatorNiche) {
    reasons.push(`Matches creator's ${features.matchesCreatorNiche} niche for relevance`);
  }
  
  // Engagement prediction
  reasons.push(`Expects ${prediction.repliesExpected} replies (13.5x weight), ${prediction.likesExpected} likes`);
  
  return reasons.join('. ');
}

