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
import { evaluateCheckpoints } from "./quality-checkpoints";

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
  
  const MAX_ITERATIONS = 6; // Reduced from 10 - checkpoints make iterations more efficient
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
    console.log(`\n   📍 Iteration ${iteration}/${MAX_ITERATIONS}...`);

    try {
      // Generate candidate
      const candidate = await generateReply(
        systemPrompt,
        buildContextString(context),
        previousAttempt,
        feedback
      );

      console.log(`   Generated: "${candidate.substring(0, 80)}${candidate.length > 80 ? "..." : ""}"`);

      // STEP 1: Validate mode compliance
      const modeValidation = validateModeCompliance(candidate, context.mode, context.creator);
      
      if (!modeValidation.passed) {
        console.log(`   ❌ Mode violation: ${modeValidation.reason}`);
        previousAttempt = candidate;
        feedback = `MODE VIOLATION: ${modeValidation.reason}\n\nRegenerate following the mode rules strictly.`;
        continue;
      }

      // STEP 2: Run checkpoint evaluation FIRST
      const checkpointEval = evaluateCheckpoints(
        context.post.text,
        candidate,
        context.creator,
        context.mode
      );

      console.log(`   📋 Checkpoints: ${checkpointEval.checkpoints.filter(cp => cp.passed).length}/${checkpointEval.checkpoints.length} passed`);
      
      // Show checkpoint summary
      for (const cp of checkpointEval.checkpoints) {
        const icon = cp.passed ? "✅" : "❌";
        const critical = cp.critical ? " [CRITICAL]" : "";
        console.log(`      ${icon} ${cp.name}${critical}: ${cp.score}/100`);
      }

      // If critical checkpoints failed, use checkpoint feedback (skip full scoring for efficiency)
      if (!checkpointEval.allCriticalPassed) {
        console.log(`   ⚠️  Critical checkpoints failed - using structured feedback`);
        previousAttempt = candidate;
        feedback = checkpointEval.detailedFeedback;
        continue;
      }

      // STEP 3: All checkpoints passed - run full quality scoring
      const scoringContext: ScoringContext = {
        originalTweet: context.post.text,
        replyText: candidate,
        creatorNiche: context.creator.primaryNiche,
        creatorAudienceInterests: context.creator.audience.demographics.primaryInterests,
        mode: context.mode
      };
      
      const qualityScore = calculateQualityScore(scoringContext);

      console.log(`   🎯 Final Score: ${qualityScore.score}/100`);

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
        // Use checkpoint evaluation for structured, actionable feedback
        const failedCheckpoints = checkpointEval.checkpoints.filter(cp => !cp.passed);
        
        if (failedCheckpoints.length > 0) {
          // Still have checkpoint failures - use checkpoint feedback
          feedback = checkpointEval.detailedFeedback;
        } else {
          // All checkpoints passed but score < 90 - use algorithm feedback + hints
          const enhancedFeedback = [
            "CLOSE! All checkpoints passed but need higher quality:",
            "",
            ...qualityScore.feedback,
            "",
            "🎯 OPTIMIZATION HINTS:",
            `• This audience (${context.creator.primaryNiche}) responds best to: ${context.creator.audience.engagementPatterns.respondsTo[0]}`,
            `• Make it even more specific to: ${context.creator.audience.demographics.primaryInterests.slice(0, 2).join(", ")}`,
            qualityScore.breakdown.contentRelevance < 75 ? 
              `• Reference more specific themes from the original tweet` : 
              null
          ].filter(Boolean);
          
          feedback = enhancedFeedback.join("\n");
        }
        
        previousAttempt = candidate;
        console.log(`   📋 Feedback preview: ${feedback.substring(0, 200).replace(/\n/g, " | ")}...`);
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
  const { creator, post, mode } = context;
  
  return `
CREATOR INTELLIGENCE FOR @${creator.username}:

Profile: ${creator.displayName} (${creator.followerCount.toLocaleString()} followers)
Primary Niche: ${creator.primaryNiche}
${creator.secondaryNiches.length > 0 ? `Secondary Niches: ${creator.secondaryNiches.join(", ")}` : ""}

AUDIENCE ANALYSIS:
• Primary Interests: ${creator.audience.demographics.primaryInterests.join(", ")}
• Irrelevant Topics: ${creator.audience.demographics.irrelevantTopics.join(", ")}
• Language Style: ${creator.audience.demographics.languageStyle}
• Sophistication: ${creator.audience.demographics.sophisticationLevel}

ENGAGEMENT PATTERNS:
• Responds Well To: ${creator.audience.engagementPatterns.respondsTo.join(", ")}
• Typically Ignores: ${creator.audience.engagementPatterns.ignores.join(", ")}
• Preferred Tone: ${creator.audience.engagementPatterns.preferredTone}

OPTIMAL STRATEGY FOR THIS CREATOR:
• Selected Mode: ${mode}
• Topics to EMPHASIZE: ${creator.optimalReplyStrategy.emphasizeTopics.length > 0 ? creator.optimalReplyStrategy.emphasizeTopics.join(", ") : "Universal themes"}
• Topics to AVOID: ${creator.optimalReplyStrategy.avoidTopics.length > 0 ? creator.optimalReplyStrategy.avoidTopics.join(", ") : "None specific"}
• Tone Match: ${creator.optimalReplyStrategy.toneMatch}

ORIGINAL POST:
"${post.text}"

YOUR GOAL:
Generate ONE high-quality reply that:
1. Aligns with this creator's audience interests and engagement patterns
2. Matches their preferred tone and sophistication level
3. Adds genuine value (new insight, perspective, or actionable advice)
4. Maximizes X algorithm score (90%+ target)

CRITICAL: Stay UNBIASED. Don't pander or flatter. Provide authentic, valuable contribution that happens to match what this specific audience finds engaging. Quality and X algorithm compliance are the priority.
  `.trim();
}

function validateModeCompliance(
  reply: string,
  mode: ReplyMode,
  creator: CreatorIntelligence
): ModeValidation {
  
  const lowerReply = reply.toLowerCase();

  // Helper to check for whole word matches (not substrings)
  const containsWholeWord = (text: string, word: string): boolean => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(text);
  };

  // Check for mode-specific violations
  if (mode === "pure_saas") {
    const mmaKeywords = ["fighter", "fight", "mma", "ufc", "combat", "training camp", "cage", "octagon"];
    for (const keyword of mmaKeywords) {
      if (containsWholeWord(reply, keyword)) {
        return {
          passed: false,
          reason: `Pure SaaS mode but mentioned "${keyword}". Creator's audience (${creator.primaryNiche}) doesn't care about MMA.`
        };
      }
    }
  }

  if (mode === "pure_mma") {
    const saasKeywords = ["startup", "saas", "revenue", "indie hacker"];
    let saasCount = 0;
    for (const keyword of saasKeywords) {
      if (containsWholeWord(reply, keyword)) saasCount++;
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
      if (containsWholeWord(reply, keyword)) {
        return {
          passed: false,
          reason: `Crossover mode should frame concepts universally, not MMA-specific. Avoid explicit mentions of "${keyword}".`
        };
      }
    }
  }

  // Check for irrelevant topics to this specific audience (use whole word matching)
  for (const irrelevant of creator.audience.demographics.irrelevantTopics) {
    if (containsWholeWord(reply, irrelevant)) {
      return {
        passed: false,
        reason: `Mentioned "${irrelevant}" which is irrelevant to @${creator.username}'s audience.`
      };
    }
  }

  return { passed: true };
}


