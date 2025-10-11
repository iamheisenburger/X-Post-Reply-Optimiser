// reply-builder.ts - Reply building with feedback loop integration

import type { CreatorIntelligence } from './types';
import { extractTopic, identifyNicheElements, type ExtractedTopic } from './topic-extractor';
import { analyzeTweetContent, type TweetContent } from './content-analyzer';
import { analyzeReplyFeatures, predictEngagement } from '../x-algorithm';
import { 
  buildIntelligentQuestion, 
  buildIntelligentContrarian, 
  buildIntelligentAddValue,
  type IntelligentReply
} from './intelligent-reply-builder';
import type { ReplyConstraints } from './quality-gate';

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
  constraints?: ReplyConstraints; // Added for feedback loop
}

/**
 * Main reply builder with FULL intelligence integration
 * Uses creator profile + tweet content + constraints from quality gate
 */
export async function buildReplies(context: ReplyBuilderContext): Promise<BuiltReply[]> {
  const { tweetText, creatorProfile, minutesSincePosted, constraints } = context;
  
  // 1. Extract topic from tweet
  const topic = extractTopic(tweetText);
  const nicheElements = identifyNicheElements(tweetText);
  
  // 2. Extract actual tweet content
  const tweetContent = analyzeTweetContent(tweetText);
  
  console.log(`\n📊 Analysis:`);
  console.log(`   Topic: ${topic.mainTopic} (${topic.tweetType})`);
  console.log(`   Main: "${tweetContent.mainClaim.substring(0, 60)}..."`);
  console.log(`   Key phrases: ${tweetContent.keyPhrases.slice(0, 2).join(', ')}`);
  console.log(`   Creator emphasized: ${creatorProfile.optimalReplyStrategy.emphasizeTopics.join(', ')}`);
  console.log(`   Creator responds to: ${creatorProfile.audience.engagementPatterns.respondsTo.join(', ')}`);
  
  if (constraints) {
    console.log(`\n🔧 Applying constraints from quality gate:`);
    if (constraints.mustIncludeQuestion) {
      console.log(`   - Must include: ${constraints.mustIncludeQuestion}`);
    }
    if (constraints.mustReferencePhrases) {
      console.log(`   - Must reference: ${constraints.mustReferencePhrases.join(', ')}`);
    }
    if (constraints.emphasizeCreatorTopics) {
      console.log(`   - Emphasize: ${constraints.emphasizeCreatorTopics.join(', ')}`);
    }
  }
  
  // 3. Build 3 intelligent replies using FULL profile data
  const intelligentReplies: IntelligentReply[] = [
    buildIntelligentQuestion(tweetContent, topic, creatorProfile, constraints),
    buildIntelligentContrarian(tweetContent, topic, creatorProfile, constraints),
    buildIntelligentAddValue(tweetContent, topic, creatorProfile, constraints),
  ];
  
  console.log(`\n✨ Generated 3 intelligent replies`);
  
  // 4. Score each reply with X algorithm
  const scoredReplies = intelligentReplies.map((reply, idx) => {
    const features = analyzeReplyFeatures(reply.text);
    const prediction = predictEngagement(features, minutesSincePosted);
    const score = calculateCompositeScore(prediction);
    
    console.log(`   Reply ${idx + 1} (${reply.strategy}): ${score}/100`);
    
    return {
      text: reply.text,
      strategy: reply.strategy,
      score,
      features: {
        hasQuestion: features.hasQuestion,
        hasPushback: features.hasPushback,
        hasSpecificData: features.hasSpecificData,
        referencesOriginalTweet: features.callsOutOP,
        matchesCreatorNiche: true, // Intelligent builder guarantees this
        matchesCreatorTone: true, // Intelligent builder guarantees this
      },
      reasoning: reply.reasoning,
      prediction: {
        authorReplyProb: prediction.authorReplyProb,
        repliesExpected: prediction.repliesExpected,
        likesExpected: prediction.likesExpected,
        profileClicksExpected: prediction.profileClicksExpected,
      },
    };
  });
  
  // 5. Sort by score (descending)
  return scoredReplies.sort((a, b) => b.score - a.score);
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
