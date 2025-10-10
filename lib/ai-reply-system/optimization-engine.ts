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
import { calculateAlgorithmScore, type ContentAnalysisResult } from "../x-algorithm";
import { generateReply } from "../openai-client";
import { selectOptimalMode, getModePrompt } from "./mode-selector";
import { X_ALGORITHM_WEIGHTS } from "../x-algorithm";

export async function generateOptimizedReplies(
  tweet: TweetData,
  creator: CreatorIntelligence,
  userProfile: UserProfile
): Promise<OptimizationResult> {
  console.log(`\n🚀 Starting optimization engine for @${creator.username}'s post`);
  console.log(`📝 Post: "${tweet.text.substring(0, 100)}${tweet.text.length > 100 ? "..." : ""}"`);

  // 1. Select optimal mode
  const mode = selectOptimalMode(creator, tweet, userProfile);
  
  // 2. Build full context
  const context: FullContext = {
    userProfile,
    creator,
    post: tweet,
    mode,
    algorithmWeights: X_ALGORITHM_WEIGHTS
  };

  // 3. Generate 3 optimized replies
  const replies: ScoredReply[] = [];
  let totalIterations = 0;

  for (let i = 0; i < 3; i++) {
    console.log(`\n💫 Generating reply option #${i + 1}...`);
    
    const result = await optimizeSingleReply(context, i);
    
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
  context: FullContext,
  replyIndex: number
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

      // Score with algorithm
      const analysis = calculateAlgorithmScore(
        candidate,
        "author_engagement", // Always optimize for author engagement (75x weight)
        context.post.hasMedia,
        true, // isReply
        false // isThread
      );

      console.log(`   Score: ${analysis.score}/100`);

      // Check if this is better
      if (analysis.score > bestScore) {
        bestScore = analysis.score;
        bestReply = {
          text: candidate,
          score: analysis.score,
          breakdown: analysis.breakdown,
          mode: context.mode,
          iteration,
          reasoning: analysis.suggestions
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
        feedback = generateAlgorithmFeedback(analysis, context);
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

function generateAlgorithmFeedback(
  analysis: ContentAnalysisResult,
  context: FullContext
): string {
  const feedback: string[] = [];

  feedback.push(`Current score: ${analysis.score}/100 - NEEDS IMPROVEMENT TO REACH 90%+`);
  feedback.push("");
  feedback.push("ALGORITHM ANALYSIS:");

  // Conversation depth (critical for replies)
  if (analysis.breakdown.conversationDepth < 70) {
    feedback.push(`❌ Conversation Depth: ${analysis.breakdown.conversationDepth.toFixed(0)}/100`);
    feedback.push(`   → X Algorithm: Replies have 13.5x weight`);
    feedback.push(`   → FIX: Add a specific, thoughtful question that invites discussion`);
    feedback.push(`   → Avoid yes/no questions - ask about process, reasoning, or specifics`);
  }

  // Engagement signals
  if (analysis.breakdown.engagement < 70) {
    feedback.push(`❌ Engagement Signals: ${analysis.breakdown.engagement.toFixed(0)}/100`);
    feedback.push(`   → X Algorithm: Author engagement is 75x weight (HIGHEST)`);
    feedback.push(`   → FIX: Make the reply more thought-provoking or add unique insight`);
    feedback.push(`   → Show expertise that makes @${context.creator.username} want to respond`);
  }

  // Author reputation building
  if (analysis.breakdown.authorReputation < 70) {
    feedback.push(`❌ Profile Click Potential: ${analysis.breakdown.authorReputation.toFixed(0)}/100`);
    feedback.push(`   → X Algorithm: Profile clicks have 12x weight`);
    feedback.push(`   → FIX: Show YOUR unique expertise (${context.userProfile.niche})`);
    feedback.push(`   → Make people curious about who YOU are`);
  }

  feedback.push("");
  feedback.push("MODE-SPECIFIC GUIDANCE:");
  
  if (context.mode === "pure_saas") {
    feedback.push(`→ Remember: This is pure SaaS mode - NO MMA references`);
    feedback.push(`→ Audience cares about: ${context.creator.audience.demographics.primaryInterests.slice(0, 3).join(", ")}`);
    feedback.push(`→ Avoid: ${context.creator.audience.demographics.irrelevantTopics.slice(0, 3).join(", ")}`);
  } else if (context.mode === "pure_mma") {
    feedback.push(`→ Remember: This is pure MMA mode - focus on fight analysis`);
    feedback.push(`→ Minimal SaaS talk unless directly relevant`);
  } else if (context.mode === "mindset_crossover") {
    feedback.push(`→ Remember: Bridge concepts WITHOUT explicit "fighter" or "MMA" references`);
    feedback.push(`→ Frame universally: "High performers...", "Elite execution..."`);
  }

  // Add AI suggestions
  if (analysis.suggestions.length > 0) {
    feedback.push("");
    feedback.push("SUGGESTIONS:");
    analysis.suggestions.forEach(s => feedback.push(`→ ${s}`));
  }

  return feedback.join("\n");
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

