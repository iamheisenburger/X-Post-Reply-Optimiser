/**
 * Optimization Engine - Maximize Engagement Probability
 * 
 * Based on X's actual algorithm, not made-up quality scores.
 * Goal: Generate replies that get engagement (likes, replies, author response)
 */

import type { 
  TweetData, 
  UserProfile, 
  CreatorIntelligence, 
  ScoredReply, 
  OptimizationResult
} from "./types";
import { generateReply } from "../openai-client";
import { predictEngagement, extractSignals, type EngagementPrediction } from "./engagement-predictor";

const MAX_ITERATIONS = 6;
const TARGET_ENGAGEMENT_SCORE = 85; // 85%+ engagement probability

export async function generateOptimizedReplies(
  tweet: TweetData,
  creator: CreatorIntelligence,
  userProfile: UserProfile
): Promise<OptimizationResult> {
  console.log(`\n🚀 Starting optimization for @${creator.username}'s tweet`);
  console.log(`📝 Tweet: "${tweet.text.substring(0, 100)}..."`);

  // Generate 3 reply options
  const replies: ScoredReply[] = [];
  let totalIterations = 0;

  for (let i = 0; i < 3; i++) {
    console.log(`\n💫 Generating reply option #${i + 1}...`);
    
    const result = await optimizeSingleReply(tweet, creator, userProfile);
    
    if (result) {
      replies.push(result.reply);
      totalIterations += result.iterations;
      console.log(`✅ Reply #${i + 1}: ${result.reply.score}/100 engagement score in ${result.iterations} iterations`);
    } else {
      console.log(`⚠️  Could not achieve ${TARGET_ENGAGEMENT_SCORE}+ score for reply #${i + 1}`);
    }
  }

  // Sort by engagement score
  replies.sort((a, b) => b.score - a.score);

  const avgScore = replies.length > 0 
    ? replies.reduce((sum, r) => sum + r.score, 0) / replies.length 
    : 0;

  console.log(`\n✨ Optimization complete!`);
  console.log(`   Generated: ${replies.length}/3 replies`);
  console.log(`   Average engagement score: ${avgScore.toFixed(1)}/100`);
  console.log(`   Total iterations: ${totalIterations}`);

  return {
    replies,
    selectedMode: "engagement_optimized", // No more fake modes
    averageIterations: replies.length > 0 ? totalIterations / replies.length : 0
  };
}

async function optimizeSingleReply(
  tweet: TweetData,
  creator: CreatorIntelligence,
  userProfile: UserProfile
): Promise<{ reply: ScoredReply; iterations: number } | null> {
  
  let bestReply: string | null = null;
  let bestScore = 0;
  let iteration = 0;
  let previousAttempt: string | undefined;
  let feedback: string | undefined;

  while (iteration < MAX_ITERATIONS && bestScore < TARGET_ENGAGEMENT_SCORE) {
    iteration++;
    console.log(`\n🔄 Iteration ${iteration}/${MAX_ITERATIONS}`);

    // Generate prompt focusing on engagement
    // Use engagement rate > 3% as heuristic for "responds to replies"
    // TODO: Make this a manual input from user's curated list
    const creatorResponds = creator.metrics.engagementRate > 0.03;
    const systemPrompt = buildEngagementPrompt(creator, tweet, userProfile, creatorResponds);

    // Generate reply
      const candidate = await generateReply(
        systemPrompt,
      buildContext(creator, tweet),
        previousAttempt,
      feedback,
      iteration
    );

    console.log(`   📄 Generated: "${candidate.substring(0, 80)}..."`);

    // Predict engagement probability
    const signals = extractSignals(
      candidate,
      {
        username: creator.username,
        followers: creator.metrics.followers,
        engagement_rate: creator.metrics.engagementRate,
        respondsToReplies: creatorResponds // Use same value from prompt
      },
      {
        text: tweet.text,
        created_at: tweet.createdAt,
        reply_count: tweet.replyCount || 0,
        like_count: tweet.likeCount || 0
      }
    );

    const prediction = predictEngagement(candidate, signals);
    const score = prediction.overallScore;

    console.log(`   📊 Engagement Score: ${score.toFixed(1)}/100`);
    console.log(`      - Author respond: ${(prediction.probabilityAuthorResponds * 100).toFixed(1)}%`);
    console.log(`      - Gets likes: ${(prediction.probabilityGetsLikes * 100).toFixed(1)}%`);
    console.log(`      - Gets replies: ${(prediction.probabilityGetsReplies * 100).toFixed(1)}%`);

    if (score > bestScore) {
      bestScore = score;
      bestReply = candidate;
      console.log(`   ✅ New best score: ${bestScore.toFixed(1)}/100`);
    }

    if (score >= TARGET_ENGAGEMENT_SCORE) {
      console.log(`   🎯 Target achieved!`);
        break;
      }

    // Generate feedback for next iteration
    feedback = generateFeedback(prediction, candidate, tweet);
        previousAttempt = candidate;
  }

  if (bestReply) {
    return {
      reply: {
        text: bestReply,
        score: bestScore,
        mode: "engagement_optimized",
        engagement: {
          authorRespondProb: 0, // Will fill in final prediction
          likesProb: 0,
          repliesProb: 0
        }
      },
      iterations: iteration
    };
  }

  return null;
}

function buildEngagementPrompt(
  creator: CreatorIntelligence,
  tweet: TweetData,
  userProfile: UserProfile,
  creatorResponds: boolean // Manual input from curated list
): string {
  return `
You are @${userProfile.handle}, replying to @${creator.username}'s tweet within 5 minutes.

🎯 YOUR GOAL: Maximize engagement probability

=== ORIGINAL TWEET ===
"${tweet.text}"

=== CREATOR BEHAVIOR ===
${creatorResponds 
  ? "✅ This creator RESPONDS to replies (you curated them for this) → Author response (75x boost) is possible"
  : "⚠️ This creator RARELY responds → Focus on likes (1x) and replies from others (13.5x)"
}

=== REPLY STRATEGY ===

${creatorResponds 
  ? `Use THOUGHTFUL QUESTION approach (35-75 words):
- Ask about implementation, edge cases, or tradeoffs
- Make it specific to their tweet content
- Easy to answer but thought-provoking
- Shows you understand their point`
  : `Use VALUABLE INSIGHT approach (35-75 words):
- Share specific observation or analytical angle
- Add new perspective to their point  
- Include data/numbers if relevant
- Spark discussion with others`
}

🚫 CRITICAL RULES:
- NO fake scenarios or made-up stories
- NO generic praise ("Great point!", "Love this!")
- NO multiple questions
- ONLY share genuine experiences if relevant

Remember: Be early (< 5 min), be honest, be valuable.
  `.trim();
}

function buildContext(creator: CreatorIntelligence, tweet: TweetData): string {
  return `
Creator: @${creator.username}
Their niche: ${creator.primaryNiche}
Their audience cares about: ${creator.audience.demographics.primaryInterests.join(", ")}
Tweet engagement: ${tweet.likeCount || 0} likes, ${tweet.replyCount || 0} replies
  `.trim();
}

function generateFeedback(
  prediction: EngagementPrediction,
  candidate: string,
  tweet: TweetData
): string {
  const issues: string[] = [];

  // Check author response probability
  if (prediction.probabilityAuthorResponds < 0.25) {
    if (!candidate.includes('?')) {
      issues.push("❌ No question asked - author unlikely to respond");
      issues.push("   → Add ONE specific question at the end");
    } else {
      issues.push("❌ Question is too generic or vague");
      issues.push("   → Make it specific to their tweet's topic");
    }
  }

  // Check likes probability
  if (prediction.probabilityGetsLikes < 0.25) {
    const words = candidate.split(/\s+/).length;
    if (words < 35) {
      issues.push(`❌ Too short (${words} words) - needs more substance`);
      issues.push("   → Expand to 35-75 words with a specific insight");
    } else if (words > 100) {
      issues.push(`❌ Too long (${words} words) - people won't read it all`);
      issues.push("   → Cut to 35-75 words, one focused point");
    }

    if (!/\b\d+[KM%]?\b/.test(candidate)) {
      issues.push("❌ No specific numbers or data");
      issues.push("   → If relevant, add concrete data points");
    }
  }

  // Check replies probability
  if (prediction.probabilityGetsReplies < 0.05) {
    issues.push("❌ Not thought-provoking enough to spark discussion");
    issues.push("   → Ask about edge cases, tradeoffs, or implementation");
  }

  if (issues.length === 0) {
    return "Good reply! Try to push engagement score even higher.";
  }

  return `
🔧 **ISSUES TO FIX:**

${issues.join("\n")}

**CRITICAL:** Reference the original tweet directly. Use their words.
Tweet said: "${tweet.text.substring(0, 100)}..."
  `.trim();
}
