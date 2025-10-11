/**
 * COMPLETE REPLY GENERATION SYSTEM WITH FEEDBACK LOOP
 * 
 * ARCHITECTURE:
 * 1. Build replies using full intelligence (creator profile + tweet content)
 * 2. Score with X algorithm
 * 3. Assess quality with quality gate
 * 4. If quality fails: iterate with improvements
 * 5. Return best replies (guaranteed quality)
 */

import { buildReplies, type ReplyBuilderContext, type BuiltReply } from "./reply-builder";
import { assessQuality, shouldIterate, getImprovementSummary, type QualityReport } from "./quality-gate";
import { analyzeTweetContent } from "./content-analyzer";
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

export interface GenerationResult {
  replies: GeneratedReply[];
  qualityReport: QualityReport;
  totalAttempts: number;
}

const MAX_ATTEMPTS = 3;

/**
 * Generate replies with quality feedback loop
 * Won't return garbage - iterates until quality threshold met or max attempts
 */
export async function generateOptimizedReplies(context: ReplyGenerationContext): Promise<GenerationResult> {
  console.log("🚀 Starting reply generation with feedback loop...");
  console.log(`   Creator: @${context.creatorProfile.username}`);
  console.log(`   Niche: ${context.creatorProfile.primaryNiche}`);
  console.log(`   Tweet age: ${context.minutesSincePosted} minutes`);
  
  // Extract tweet content for quality assessment
  const tweetContent = analyzeTweetContent(context.tweetText);
  
  let attemptNumber = 0;
  let replies: BuiltReply[] = [];
  let qualityReport: QualityReport | null = null;
  
  // ====================================================================
  // FEEDBACK LOOP
  // ====================================================================
  while (attemptNumber < MAX_ATTEMPTS) {
    attemptNumber++;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 ATTEMPT ${attemptNumber}/${MAX_ATTEMPTS}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      // Build context for reply builder
      const builderContext: ReplyBuilderContext = {
        tweetText: context.tweetText,
        tweetAuthor: context.tweetAuthor,
        creatorProfile: context.creatorProfile,
        minutesSincePosted: context.minutesSincePosted,
        yourHandle: context.yourHandle,
        yourNiche: 'saas', // TODO: Make configurable
        constraints: qualityReport?.improvements || undefined, // Pass improvements from previous attempt
      };
      
      // Generate replies
      replies = await buildReplies(builderContext);
      
      console.log(`\n📊 Generated ${replies.length} replies`);
      console.log(`   Scores: ${replies.map(r => r.score).join(', ')}`);
      
      // Assess quality
      qualityReport = assessQuality(
        replies,
        context.creatorProfile,
        tweetContent,
        attemptNumber
      );
      
      // Check if we should iterate
      if (qualityReport.passed) {
        console.log(`\n✅ Quality gate PASSED on attempt ${attemptNumber}!`);
        console.log(`   Best score: ${qualityReport.bestScore}/100`);
        break;
      }
      
      // Check if we should keep iterating
      if (!shouldIterate(qualityReport, MAX_ATTEMPTS)) {
        console.log(`\n⚠️  Stopping after ${attemptNumber} attempts`);
        console.log(`   Best score achieved: ${qualityReport.bestScore}/100`);
        break;
      }
      
      // Prepare for next iteration
      console.log(`\n🔧 Preparing iteration ${attemptNumber + 1} with improvements:`);
      console.log(`   ${getImprovementSummary(qualityReport.improvements)}`);
      
    } catch (error) {
      console.error(`\n❌ Error in attempt ${attemptNumber}:`, error);
      
      // If we have replies from previous attempt, use those
      if (replies.length > 0) {
        console.log(`   Using replies from previous attempt`);
        break;
      }
      
      throw error;
    }
  }
  
  // ====================================================================
  // FINAL REPORT
  // ====================================================================
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 FINAL REPORT`);
  console.log(`${'='.repeat(60)}`);
  console.log(`   Total attempts: ${attemptNumber}`);
  console.log(`   Quality passed: ${qualityReport?.passed ? 'YES' : 'NO'}`);
  console.log(`   Best score: ${qualityReport?.bestScore || 0}/100`);
  console.log(`   Issues remaining: ${qualityReport?.issues.length || 0}`);
  
  if (qualityReport && !qualityReport.passed) {
    console.log(`\n⚠️  Quality issues remaining:`);
    qualityReport.issues.forEach(issue => console.log(`     - ${issue}`));
  }
  
  // Transform for frontend
  const transformedReplies = replies.map((reply) => ({
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
  
  return {
    replies: transformedReplies,
    qualityReport: qualityReport || {
      passed: false,
      bestScore: 0,
      issues: ['No replies generated'],
      improvements: {},
      attemptNumber: 0,
    },
    totalAttempts: attemptNumber,
  };
}
