// COMPLETE REPLY GENERATION SYSTEM WITH OPENAI + FEEDBACK LOOP

import OpenAI from "openai";
import { analyzeReplyFeatures, predictEngagement } from "../x-algorithm";
import type { CreatorIntelligence } from "./types";
import { analyzeTweetContent } from "./content-analyzer";
import { assessQuality, shouldIterate, getImprovementSummary, type QualityReport } from "./quality-gate";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  strategy: 'question' | 'contrarian' | 'add_value' | 'crossover';
  features: {
    hasQuestion: boolean;
    hasPushback: boolean;
    hasSpecificData: boolean;
    referencesOriginalTweet: boolean;
    matchesCreatorNiche: boolean;
    matchesCreatorTone: boolean;
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

const SYSTEM_PROMPT = `You are an X (Twitter) reply expert who crafts high-engagement replies optimized for the platform's algorithm.

CORE RULES:
- ALWAYS reference the SPECIFIC tweet content provided - never generic responses
- Use the creator's preferred tone and sophistication level
- Target X algorithm: 75x author response (questions, pushback), 13.5x conversation (spark discussion)
- Keep under 280 characters
- Start with @username for notification
- Be authentic - no fake stories, no self-promotion
- Write complete, natural sentences - no fragments or awkward phrasing
- 3 DISTINCT strategies: Question (expertise), Contrarian (thoughtful challenge), Add-Value (build on their idea)

FORMAT (EXACT):
REPLY 1 (QUESTION):
[Your reply]

REPLY 2 (CONTRARIAN):
[Your reply]

REPLY 3 (ADD-VALUE):
[Your reply]`;

/**
 * Generate 3 high-quality replies with feedback loop
 */
export async function generateOptimizedReplies(context: ReplyGenerationContext): Promise<GenerationResult> {
  console.log("🚀 Starting hybrid generation with feedback loop...");
  console.log(`   Creator: @${context.creatorProfile.username}`);
  console.log(`   Niche: ${context.creatorProfile.primaryNiche}`);
  console.log(`   Tweet age: ${context.minutesSincePosted} minutes`);
  
  // Extract tweet content
  const tweetContent = analyzeTweetContent(context.tweetText);
  
  let attemptNumber = 0;
  let replies: GeneratedReply[] = [];
  let qualityReport: QualityReport | null = null;
  
  while (attemptNumber < MAX_ATTEMPTS) {
    attemptNumber++;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 ATTEMPT ${attemptNumber}/${MAX_ATTEMPTS}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      // Build supercharged prompt
      const prompt = buildIntelligentPrompt(
        tweetContent,
        context.creatorProfile,
        qualityReport?.improvements
      );
      
      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });
      
      const response = completion.choices[0]?.message?.content || '';
      console.log(`✅ OpenAI response received`);
      
      // Parse replies
      const rawReplies = parseReplies(response);
      
      // Score each reply
      replies = rawReplies.map((text, idx) => {
        const features = analyzeReplyFeatures(text);
        const prediction = predictEngagement(features, context.minutesSincePosted);
        const score = calculateCompositeScore(prediction);
        
        console.log(`   Reply ${idx + 1}: ${score}/100`);
        
        // Infer strategy based on reply features
        let strategy: 'question' | 'contrarian' | 'add_value' | 'crossover' = 'add_value';
        if (features.hasQuestion) {
          strategy = 'question';
        } else if (features.hasPushback) {
          strategy = 'contrarian';
        } else if (features.hasSpecificData) {
          strategy = 'add_value';
        }
        
        return {
          text,
          score,
          strategy,
          features: {
            hasQuestion: features.hasQuestion,
            hasPushback: features.hasPushback,
            hasSpecificData: features.hasSpecificData,
            referencesOriginalTweet: true,
            matchesCreatorNiche: true,
            matchesCreatorTone: true,
          },
          prediction: {
            authorReplyProb: prediction.authorReplyProb,
            repliesExpected: prediction.repliesExpected,
            likesExpected: prediction.likesExpected,
            profileClicksExpected: prediction.profileClicksExpected,
          },
          reasoning: `Attempt ${attemptNumber}. Score: ${score}/100`,
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
      grammarPassed: false,
      bestScore: 0,
      issues: ['Generation failed'],
      improvements: {},
      attemptNumber,
    },
    totalAttempts: attemptNumber,
  };
}

function buildIntelligentPrompt(
  tweetContent: TweetContent,
  creator: CreatorIntelligence,
  constraints?: ReplyConstraints
): string {
  const tweetSummary = buildTweetSummary(tweetContent);
  const creatorSummary = buildCreatorSummary(creator);
  const constraintInstructions = buildConstraintInstructions(constraints);
  
  return `Generate 3 X replies for this tweet:

TWEET ANALYSIS:
${tweetSummary}

CREATOR PROFILE (@${creator.username}):
${creatorSummary}

CONSTRAINTS:
${constraintInstructions}

REQUIREMENTS:
1. Reply 1 (QUESTION): Ask something requiring THEIR expertise. Reference tweet content + their emphasized topics.
2. Reply 2 (CONTRARIAN): Thoughtful challenge to specific point. Connect to what they care about.
3. Add-Value: Expand with insight/example from their niche. Build on tweet + their interests.
- Tone: ${creator.audience.engagementPatterns.preferredTone || 'conversational'}
- Sophistication: ${creator.audience.demographics.sophisticationLevel || 'intermediate'}
- Start each with @${creator.username}`;

  // Helper functions for buildTweetSummary, buildCreatorSummary, buildConstraintInstructions
  // (implement as in previous code)
}

function parseReplies(response: string): string[] {
  // Implementation as in previous code
  const patterns = [
    /REPLY \d+ \([A-Z\-]+\):\s*(.+?)(?=\n\nREPLY \d+|\n*$)/gs,
    /REPLY \d+:\s*(.+?)(?=\n\nREPLY \d+:|\n*$)/gs,
  ];
  
  for (const pattern of patterns) {
    const matches = [...response.matchAll(pattern)];
    if (matches.length >= 3) {
      return matches.slice(0, 3).map(match => match[1].trim()).filter(r => r.length > 20);
    }
  }
  
  return response.split(/\n\n+/).slice(0, 3).map(r => r.trim()).filter(r => r.length > 20);
}

function calculateCompositeScore(prediction: ReturnType<typeof predictEngagement>): number {
  // Implementation as in previous code
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

function buildTweetSummary(content: TweetContent): string {
  const parts: string[] = [];
  
  parts.push(`Main claim: "${content.mainClaim}"`);
  
  if (content.keyPhrases.length > 0) {
    parts.push(`Key phrases: ${content.keyPhrases.slice(0, 3).join(', ')}`);
  }
  
  if (content.entities.length > 0) {
    parts.push(`Mentions: ${content.entities.join(', ')}`);
  }
  
  if (content.numbers.length > 0) {
    parts.push(`Numbers: ${content.numbers.join(', ')}`);
  }
  
  if (content.problemMentioned) {
    parts.push(`Problem: "${content.problemMentioned}"`);
  }
  
  if (content.solutionMentioned) {
    parts.push(`Solution: "${content.solutionMentioned}"`);
  }
  
  return parts.join('\n');
}

function buildCreatorSummary(creator: CreatorIntelligence): string {
  const parts: string[] = [];
  
  parts.push(`Primary niche: ${creator.primaryNiche}`);
  parts.push(`Emphasized topics: ${creator.optimalReplyStrategy.emphasizeTopics.join(', ')}`);
  parts.push(`Avoid: ${creator.optimalReplyStrategy.avoidTopics.join(', ')}`);
  parts.push(`Reply mode: ${creator.optimalReplyStrategy.mode}`);
  parts.push(`Responds to: ${creator.audience.engagementPatterns.respondsTo.join(', ')}`);
  parts.push(`Preferred tone: ${creator.audience.engagementPatterns.preferredTone || 'conversational'}`);
  parts.push(`Audience level: ${creator.audience.demographics.sophisticationLevel || 'intermediate'}`);
  
  return parts.join('\n');
}

function buildConstraintInstructions(constraints?: ReplyConstraints): string {
  if (!constraints) return 'No specific constraints.';
  
  const instructions: string[] = [];
  
  if (constraints.mustIncludeQuestion) {
    instructions.push(`MUST ask question about: ${constraints.mustIncludeQuestion}`);
  }
  
  if (constraints.mustReferencePhrases && constraints.mustReferencePhrases.length > 0) {
    instructions.push(`MUST reference: ${constraints.mustReferencePhrases.join(', ')}`);
  }
  
  if (constraints.emphasizeCreatorTopics && constraints.emphasizeCreatorTopics.length > 0) {
    instructions.push(`Connect to creator topics: ${constraints.emphasizeCreatorTopics.join(', ')}`);
  }
  
  if (constraints.mustHaveFeature && constraints.mustHaveFeature.length > 0) {
    instructions.push(`Ensure features: ${constraints.mustHaveFeature.join(', ')}`);
  }
  
  if (constraints.mustUseTone) {
    instructions.push(`Use tone: ${constraints.mustUseTone}`);
  }
  
  if (constraints.avoidGenericPhrases) {
    instructions.push('Avoid generic phrases like "great point", "love this"');
  }
  
  if (constraints.ensureGrammar) {
    instructions.push('Ensure complete sentences and natural flow - no fragments or awkward phrasing');
  }
  
  return instructions.length > 0 ? instructions.join('\n') : 'No specific constraints.';
}
