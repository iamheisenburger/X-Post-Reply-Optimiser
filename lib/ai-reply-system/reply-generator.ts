/**
 * NEW DETERMINISTIC REPLY SYSTEM
 * 
 * ARCHITECTURE:
 * 1. Extract topics from tweet (NLP, no AI)
 * 2. Select template system based on creator niche
 * 3. Build 3 replies using templates + intelligence
 * 4. Score deterministically using X algorithm
 * 5. (Optional) Polish with OpenAI if needed
 * 
 * NO MORE "FAKE" GENERATION. REAL TEMPLATES. REAL SCORING.
 */

import { buildReplies, type ReplyBuilderContext, type BuiltReply } from "./reply-builder";
import type { CreatorIntelligence } from "./types";

export interface ReplyGenerationContext {
  tweetText: string;
  tweetAuthor: string;
  creatorProfile: CreatorIntelligence;
  minutesSincePosted: number;
  yourHandle: string;
}

export interface GeneratedReply {
  text: string;
  score: number;
  features: {
    hasQuestion: boolean;
    hasPushback: boolean;
    hasSpecificData: boolean;
  };
  prediction: {
    authorReplyProb: number;
    repliesExpected: number;
    likesExpected: number;
    profileClicksExpected: number;
  };
  reasoning: string;
}

/**
 * Generate 3 algorithm-optimized replies using TEMPLATE SYSTEM
 * NO AI GENERATION - pure rules + intelligence
 */
export async function generateOptimizedReplies(context: ReplyGenerationContext): Promise<GeneratedReply[]> {
  console.log("🛠️  Building replies using template system...");
  
  try {
    // Build context for reply builder
    const builderContext: ReplyBuilderContext = {
      tweetText: context.tweetText,
      tweetAuthor: context.tweetAuthor,
      creatorProfile: context.creatorProfile,
      minutesSincePosted: context.minutesSincePosted,
      yourHandle: context.yourHandle,
      yourNiche: 'saas', // TODO: Make this configurable
    };
    
    // Build replies using deterministic template system
    const replies = await buildReplies(builderContext);
    
    console.log(`✅ Built ${replies.length} replies`);
    console.log(`📊 Scores: ${replies.map(r => r.score).join(', ')}`);
    
    // Transform to GeneratedReply format
    return replies.map(reply => ({
      text: reply.text,
      score: reply.score,
      features: {
        hasQuestion: reply.features.hasQuestion,
        hasPushback: reply.features.hasPushback,
        hasSpecificData: reply.features.hasSpecificData,
      },
      prediction: {
        authorReplyProb: reply.prediction.authorReplyProb,
        repliesExpected: reply.prediction.repliesExpected,
        likesExpected: reply.prediction.likesExpected,
        profileClicksExpected: reply.prediction.profileClicksExpected,
      },
      reasoning: reply.reasoning,
    }));
    
  } catch (error) {
    console.error("Error building replies:", error);
    throw error;
  }
}
