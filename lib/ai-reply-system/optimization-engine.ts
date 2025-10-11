// Optimization Engine - Iterative refinement with algorithm feedback

import type { 
  TweetData, 
  UserProfile, 
  CreatorIntelligence, 
  ReplyMode, 
  ScoredReply, 
  ModeValidation,
  OptimizationResult,
  FullContext
} from "./types";
import { calculateQualityScore, type ScoringContext } from "../x-algorithm-v2";
import { generateReply } from "../openai-client";
import { selectOptimalMode, getModePrompt } from "./mode-selector";

export async function generateOptimizedReplies(
  tweet: TweetData,
  creator: CreatorIntelligence,
  userProfile: UserProfile
): Promise<OptimizationResult> {
  console.log(`\n🚀 Starting optimization engine for @${creator.username}'s post`);
  console.log(`📝 Post: "${tweet.text.substring(0, 100)}${tweet.text.length > 100 ? "..." : ""}"`);

  // 1. Select optimal mode
  const mode = selectOptimalMode(creator, tweet);
  
  // 2. Build full context
  const context: FullContext = {
    userProfile,
    creator,
    post: tweet,
    mode
  };

  // 3. Generate 3 optimized replies
  const replies: ScoredReply[] = [];
  let totalIterations = 0;

  for (let i = 0; i < 3; i++) {
    console.log(`\n💫 Generating reply option #${i + 1}...`);
    
    const result = await optimizeSingleReply(context);
    
    if (result) {
      replies.push(result.reply);
      totalIterations += result.iterations;
      console.log(`✅ Reply #${i + 1} achieved ${result.reply.score}/100 in ${result.iterations} iterations`);
    } else {
      console.log(`⚠️  Could not achieve 90%+ score for reply #${i + 1} after max iterations`);
    }
  }

  // 4. Sort by score
  replies.sort((a, b) => b.score - a.score);

  const averageScore = replies.length > 0 
    ? replies.reduce((sum, r) => sum + r.score, 0) / replies.length 
    : 0;

  console.log(`\n✨ Optimization complete!`);
  console.log(`   Generated: ${replies.length}/3 replies`);
  console.log(`   Average score: ${averageScore.toFixed(1)}/100`);
  console.log(`   Total iterations: ${totalIterations}`);

  return {
    replies,
    selectedMode: mode,
    creatorProfile: creator,
    totalIterations,
    averageScore
  };
}

async function optimizeSingleReply(
  context: FullContext
): Promise<{ reply: ScoredReply; iterations: number } | null> {
  
  const MAX_ITERATIONS = 10;
  const TARGET_SCORE = 90;

  let iteration = 0;
  let bestReply: ScoredReply | null = null;
  let bestScore = 0;
  let previousAttempt: string | undefined;
  let feedback: string | undefined;

  const systemPrompt = getModePrompt(
    context.mode,
    context.creator,
    context.post,
    context.userProfile
  );

  while (iteration < MAX_ITERATIONS && bestScore < TARGET_SCORE) {
    iteration++;
    console.log(`   Iteration ${iteration}/${MAX_ITERATIONS}...`);

    try {
      // Generate candidate
      const candidate = await generateReply(
        systemPrompt,
        buildContextString(context),
        previousAttempt,
        feedback
      );

      console.log(`   Generated: "${candidate.substring(0, 80)}${candidate.length > 80 ? "..." : ""}"`);

      // Validate mode compliance FIRST
      const modeValidation = validateModeCompliance(candidate, context.mode, context.creator);
      
      if (!modeValidation.passed) {
        console.log(`   ❌ Mode violation: ${modeValidation.reason}`);
        previousAttempt = candidate;
        feedback = `MODE VIOLATION: ${modeValidation.reason}\n\nRegenerate following the mode rules strictly.`;
        continue;
      }

      // Score with NEW quality-based algorithm
      const scoringContext: ScoringContext = {
        originalTweet: context.post.text,
        replyText: candidate,
        creatorNiche: context.creator.primaryNiche,
        creatorAudienceInterests: context.creator.audience.demographics.primaryInterests,
        mode: context.mode
      };
      
      const qualityScore = calculateQualityScore(scoringContext);

      console.log(`   Score: ${qualityScore.score}/100`);

      // Check if this is better
      if (qualityScore.score > bestScore) {
        bestScore = qualityScore.score;
        bestReply = {
          text: candidate,
          score: qualityScore.score,
          breakdown: {
            engagement: qualityScore.breakdown.engagementPotential,
            recency: 10,
            mediaPresence: context.post.hasMedia ? 10 : 0,
            conversationDepth: qualityScore.breakdown.conversationDepth,
            authorReputation: qualityScore.breakdown.valueAdd
          },
          mode: context.mode,
          iteration,
          reasoning: qualityScore.feedback
        };

        console.log(`   ⬆️  New best score: ${bestScore}/100`);
      }

      // Early exit if excellent
      if (bestScore >= 92) {
        console.log(`   🎯 Excellent score achieved (${bestScore}/100)!`);
        break;
      }

      // Generate detailed feedback for next iteration
      if (bestScore < TARGET_SCORE) {
        feedback = qualityScore.feedback.join("\n");
        previousAttempt = candidate;
        console.log(`   📋 Feedback: ${feedback.substring(0, 100)}...`);
      }

    } catch (error) {
      console.error(`   ⚠️  Error in iteration ${iteration}:`, error);
      continue;
    }
  }

  if (bestReply && bestReply.score >= TARGET_SCORE) {
    return { reply: bestReply, iterations: iteration };
  }

  return null;
}

function buildContextString(context: FullContext): string {
  return `
Replying to @${context.creator.username}'s post:
"${context.post.text}"

Your goal: Generate ONE high-quality reply that maximizes engagement.
Target: 90%+ algorithm score, with focus on author engagement (75x weight in X algorithm).
  `.trim();
}

function validateModeCompliance(
  reply: string,
  mode: ReplyMode,
  creator: CreatorIntelligence
): ModeValidation {
  
  const lowerReply = reply.toLowerCase();

  // Check for mode-specific violations
  if (mode === "pure_saas") {
    const mmaKeywords = ["fighter", "fight", "mma", "ufc", "combat", "training camp", "cage", "octagon", "bout"];
    for (const keyword of mmaKeywords) {
      if (lowerReply.includes(keyword)) {
        return {
          passed: false,
          reason: `Pure SaaS mode but mentioned "${keyword}". Creator's audience (${creator.primaryNiche}) doesn't care about MMA.`
        };
      }
    }
  }

  if (mode === "pure_mma") {
    const saasKeywords = ["startup", "saas", "product-market fit", "revenue", "indie hacker"];
    let saasCount = 0;
    for (const keyword of saasKeywords) {
      if (lowerReply.includes(keyword)) saasCount++;
    }
    if (saasCount > 1) {
      return {
        passed: false,
        reason: `Pure MMA mode but too much SaaS terminology. Keep focus on fight analysis.`
      };
    }
  }

  if (mode === "mindset_crossover") {
    // Should NOT explicitly mention "fighter", "MMA", or "UFC"
    const explicitMMA = ["fighter", "mma", "ufc", "cage", "octagon"];
    for (const keyword of explicitMMA) {
      if (lowerReply.includes(keyword)) {
        return {
          passed: false,
          reason: `Crossover mode should frame concepts universally, not MMA-specific. Avoid explicit mentions of "${keyword}".`
        };
      }
    }
  }

  // Check for irrelevant topics to this specific audience
  for (const irrelevant of creator.audience.demographics.irrelevantTopics) {
    if (lowerReply.includes(irrelevant.toLowerCase())) {
      return {
        passed: false,
        reason: `Mentioned "${irrelevant}" which is irrelevant to @${creator.username}'s audience.`
      };
    }
  }

  return { passed: true };
}


