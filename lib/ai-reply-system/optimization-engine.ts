/**
 * Simple Reply Generator
 * Based on X Algorithm: Author response (75x), Replies (13.5x), Likes (1x)
 */

import type { 
  TweetData, 
  UserProfile, 
  CreatorIntelligence, 
  GeneratedReply,
  OptimizationResult
} from "./types";
import { generateReply } from "../openai-client";

export async function generateOptimizedReplies(
  tweet: TweetData,
  creator: CreatorIntelligence,
  userProfile: UserProfile
): Promise<OptimizationResult> {
  console.log(`\n🚀 Generating 3 replies for @${creator.username}'s tweet`);

  const systemPrompt = buildPrompt(creator, tweet, userProfile);
  const replies: GeneratedReply[] = [];

  // Generate 3 replies
  for (let i = 0; i < 3; i++) {
    console.log(`\n💫 Generating reply #${i + 1}...`);
    
    const replyText = await generateReply(
      systemPrompt,
      `Tweet: "${tweet.text}"`,
      undefined,
      undefined,
      1 // Always use gpt-4o-mini (iteration 1)
    );

    console.log(`   📄 Generated: "${replyText.substring(0, 80)}..."`);

    // Simple engagement prediction
    const engagement = predictEngagement(replyText, creator);
    
    // Calculate overall score (weighted by X's algorithm)
    const score = Math.round(
      (engagement.authorRespondProb * 75) + // 75x weight
      (engagement.repliesProb * 13.5) +     // 13.5x weight
      (engagement.likesProb * 1)            // 1x weight
    );
    
    console.log(`   📊 Score: ${score}/100`);
    console.log(`      - Author respond: ${(engagement.authorRespondProb * 100).toFixed(1)}%`);
    console.log(`      - Gets likes: ${(engagement.likesProb * 100).toFixed(1)}%`);
    console.log(`      - Gets replies: ${(engagement.repliesProb * 100).toFixed(1)}%`);

    replies.push({
      text: replyText,
      score,
      mode: "engagement_optimized",
      iteration: 1,
      engagement
    });
  }

  console.log(`\n✨ Done! Generated 3 replies`);

  return {
    replies,
    averageIterations: 1,
    totalIterations: 3 // 3 replies × 1 iteration each
  };
}

function buildPrompt(
  creator: CreatorIntelligence,
  tweet: TweetData,
  userProfile: UserProfile
): string {
  // Heuristic: High engagement rate = likely responds to replies
  const creatorResponds = creator.metrics.engagementRate > 0.03;

  return `
You are @${userProfile.handle}, replying to @${creator.username}'s tweet.

🎯 GOAL: Maximize engagement (based on X's algorithm)
- Author response: 75x boost
- Replies from others: 13.5x boost
- Likes: 1x boost

=== TWEET ===
"${tweet.text}"

=== CREATOR ===
- Niche: ${creator.primaryNiche}
- Followers: ${creator.metrics.followers.toLocaleString()}
- ${creatorResponds ? "✅ Responds to replies" : "⚠️ Rarely responds"}
- Interests: ${creator.audience.demographics.primaryInterests.slice(0, 3).join(", ")}

=== YOUR STRATEGY ===

${creatorResponds 
  ? `🎯 ASK A THOUGHTFUL QUESTION (35-75 words):
- Ask about implementation, edge cases, or tradeoffs
- Make it specific to their tweet
- Easy for them to answer
- Shows you understand their point`
  : `💡 SHARE A VALUABLE INSIGHT (35-75 words):
- Add a new perspective or analytical angle
- Include specific examples or data
- Spark discussion with others
- Don't need creator to respond`
}

🚫 RULES:
- NO fake stories or scenarios
- NO generic praise ("Great point!")
- NO multiple questions
- Be honest and specific

Write your reply now (35-75 words):
  `.trim();
}

function predictEngagement(
  reply: string,
  creator: CreatorIntelligence
): {
  authorRespondProb: number;
  likesProb: number;
  repliesProb: number;
} {
  const hasQuestion = reply.includes('?');
  const wordCount = reply.split(/\s+/).length;
  const hasNumbers = /\b\d+[KM%]?\b/.test(reply);
  const creatorResponds = creator.metrics.engagementRate > 0.03;

  // Simple probability calculations
  let authorRespondProb = 0.05; // Base 5%
  let likesProb = 0.15; // Base 15%
  let repliesProb = 0.05; // Base 5%

  // If creator doesn't respond, drop author probability
  if (!creatorResponds) {
    authorRespondProb = 0.02;
  } else {
    // Question boosts author response
    if (hasQuestion) authorRespondProb += 0.25;
    
    // Good length
    if (wordCount >= 35 && wordCount <= 75) {
      authorRespondProb += 0.15;
      likesProb += 0.20;
    }
  }

  // Numbers/data boost likes
  if (hasNumbers) likesProb += 0.15;

  // Thought-provoking boosts replies
  if (hasQuestion || wordCount > 50) repliesProb += 0.10;

  return {
    authorRespondProb: Math.min(authorRespondProb, 1),
    likesProb: Math.min(likesProb, 1),
    repliesProb: Math.min(repliesProb, 1)
  };
}

