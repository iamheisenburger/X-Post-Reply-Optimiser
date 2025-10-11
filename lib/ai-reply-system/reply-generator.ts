// COMPLETE REPLY GENERATION SYSTEM WITH OPENAI + FEEDBACK LOOP

import { buildIntelligentPrompt, generateWithPrompt } from "./prompt-builder";
import { assessQuality, shouldIterate, getImprovementSummary, type QualityReport } from "./quality-gate";
import { analyzeTweetContent } from "./content-analyzer";
import { analyzeReplyFeatures, predictEngagement } from "../x-algorithm";
import type { CreatorIntelligence } from "./types";

export interface ReplyGenerationContext {
  tweetText: string;
  tweetAuthor: string;
  creatorProfile: CreatorIntelligence;
  minutesSincePosted: number;
  yourHandle: string;
}

export interface BuiltReply {
  text: string;
  strategy: 'question' | 'contrarian' | 'add_value';
  score: number;
  features: {
    hasQuestion: boolean;
    hasPushback: boolean;
    hasSpecificData: boolean;
  };
  reasoning: string;
  prediction: {
    authorReplyProb: number;
    repliesExpected: number;
    likesExpected: number;
    profileClicksExpected: number;
  };
}

export interface GenerationResult {
  replies: BuiltReply[];
  qualityReport: QualityReport;
  totalAttempts: number;
}

const MAX_ATTEMPTS = 3;

/**
 * Generate replies with OpenAI + intelligence + feedback loop
 */
export async function generateOptimizedReplies(context: ReplyGenerationContext): Promise<GenerationResult> {
  console.log("🚀 Starting OpenAI generation with feedback loop...");
  
  // Extract tweet content
  const tweetContent = analyzeTweetContent(context.tweetText);
  
  let attemptNumber = 0;
  let replies: BuiltReply[] = [];
  let qualityReport: QualityReport | null = null;
  
  while (attemptNumber < MAX_ATTEMPTS) {
    attemptNumber++;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 ATTEMPT ${attemptNumber}/${MAX_ATTEMPTS}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      // Build intelligent prompt with full context + constraints
      const prompt = buildIntelligentPrompt(
        tweetContent,
        context.creatorProfile,
        qualityReport?.improvements
      );
      
      console.log(`📝 Using OpenAI model: ${prompt.model}`);
      
      // Generate replies with OpenAI
      const rawReplies = await generateWithPrompt(prompt);
      
      console.log(`✅ OpenAI generated ${rawReplies.length} replies`);
      
      // Analyze and score each reply
      replies = rawReplies.map((text, idx) => {
        const features = analyzeReplyFeatures(text);
        const prediction = predictEngagement(features, context.minutesSincePosted);
        const strategy = classifyStrategy(text, features);
        const score = calculateCompositeScore(prediction);
        
        console.log(`   Reply ${idx + 1} (${strategy}): ${score}/100`);
        
        return {
          text,
          strategy,
          score,
          features: {
            hasQuestion: features.hasQuestion,
            hasPushback: features.hasPushback,
            hasSpecificData: features.hasSpecificData,
          },
          reasoning: `OpenAI generation (attempt ${attemptNumber}). Score: ${score}/100. Features: Q${features.hasQuestion ? '+' : '-'} P${features.hasPushback ? '+' : '-'} D${features.hasSpecificData ? '+' : '-'}`,
          prediction: {
            authorReplyProb: prediction.authorReplyProb,
            repliesExpected: prediction.repliesExpected,
            likesExpected: prediction.likesExpected,
            profileClicksExpected: prediction.profileClicksExpected,
          },
        };
      });
      
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
        break;
      }
      
      if (!shouldIterate(qualityReport, MAX_ATTEMPTS)) {
        console.log(`\n⚠️  Stopping after ${attemptNumber} attempts`);
        break;
      }
      
      console.log(`\n🔧 Preparing iteration ${attemptNumber + 1}:`);
      console.log(`   ${getImprovementSummary(qualityReport.improvements)}`);
      
    } catch (error) {
      console.error(`❌ Error in attempt ${attemptNumber}:`, error);
      if (replies.length > 0) break;
      throw error;
    }
  }
  
  // Final report
  console.log(`\n📋 FINAL RESULTS`);
  console.log(`   Attempts: ${attemptNumber}`);
  console.log(`   Passed: ${qualityReport?.passed ? 'YES' : 'NO'}`);
  console.log(`   Best: ${qualityReport?.bestScore || 0}/100`);
  
  return {
    replies,
    qualityReport: qualityReport || {
      passed: false,
      bestScore: 0,
      issues: ['Generation failed'],
      improvements: {},
      attemptNumber,
    },
    totalAttempts: attemptNumber,
  };
}

function classifyStrategy(text: string, features: ReturnType<typeof analyzeReplyFeatures>): BuiltReply['strategy'] {
  if (features.hasQuestion) return 'question';
  if (features.hasPushback) return 'contrarian';
  return 'add_value';
}

function calculateCompositeScore(prediction: ReturnType<typeof predictEngagement>): number {
  const authorWeight = 0.50;
  const conversationWeight = 0.30;
  const profileClickWeight = 0.15;
  const likeWeight = 0.05;
  
  const authorScore = prediction.authorReplyProb * 100;
  const conversationScore = Math.min(100, (prediction.repliesExpected / 10) * 100);
  const profileClickScore = Math.min(100, (prediction.profileClicksExpected / 10) * 100);
  const likeScore = Math.min(100, (prediction.likesExpected / 20) * 100);
  
  const composite = authorScore * authorWeight + conversationScore * conversationWeight + 
    profileClickScore * profileClickWeight + likeScore * likeWeight;
  
  return Math.round(Math.max(1, Math.min(100, composite)));
}
