// lib/x-algorithm.ts
// Exact weights from X's Heavy Ranker ML model

export const X_ALGORITHM_WEIGHTS = {
  scored_tweets_model_weight_fav: 0.5,
  scored_tweets_model_weight_retweet: 1.0,
  scored_tweets_model_weight_reply: 13.5,
  scored_tweets_model_weight_good_profile_click: 12.0,
  scored_tweets_model_weight_video_playback50: 0.005,
  scored_tweets_model_weight_reply_engaged_by_author: 75.0,
  scored_tweets_model_weight_good_click: 11.0,
  scored_tweets_model_weight_good_click_v2: 10.0,
  scored_tweets_model_weight_negative_feedback_v2: -74.0,
  scored_tweets_model_weight_report: -369.0,
};

export type EngagementGoal =
  | "reply"
  | "retweet"
  | "like"
  | "profile_click"
  | "video_playback"
  | "author_engagement"
  | "conversation_click"
  | "long_conversation_click"
  | "viral_reach"; // Custom goal for overall visibility

export interface ContentAnalysisResult {
  score: number;
  breakdown: {
    engagement: number;
    recency: number;
    mediaPresence: number;
    conversationDepth: number;
    authorReputation: number;
  };
  suggestions: string[];
}

export function calculateAlgorithmScore(
  content: string,
  targetGoal: EngagementGoal = "viral_reach",
  hasMedia: boolean = false,
  isReply: boolean = false,
  isThread: boolean = false,
  authorReputationScore: number = 1.0 // Placeholder, 0.5-1.5 based on TweepCred
): ContentAnalysisResult {
  let score = 0;
  const breakdown = {
    engagement: 0,
    recency: 10, // Assume recent for new content
    mediaPresence: hasMedia ? 10 : 0,
    conversationDepth: isReply || isThread ? 10 : 0,
    authorReputation: authorReputationScore * 10,
  };
  const suggestions: string[] = [];

  // Base content length and keyword analysis (simplified)
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const hasQuestion = content.includes("?") || content.includes("🤔");
  const hasCallToAction = content.includes("retweet") || content.includes("like") || content.includes("follow");
  const hasLink = content.includes("http://") || content.includes("https://");

  // Apply weights based on content characteristics and target goal
  // This is a simplified mapping to the Heavy Ranker's predicted probabilities
  // In a real scenario, we'd need a model to predict these probabilities.
  // For now, we'll simulate based on content features.

  let predictedReplyProb = 0.1;
  let predictedRetweetProb = 0.05;
  let predictedFavProb = 0.15;
  let predictedProfileClickProb = 0.02;
  let predictedVideoPlaybackProb = 0;
  let predictedReplyEngagedByAuthorProb = 0.01;
  let predictedGoodClickProb = 0.03;
  let predictedGoodClickV2Prob = 0.02;

  // Adjust probabilities based on content features
  if (isReply) {
    predictedReplyProb += 0.2;
    predictedReplyEngagedByAuthorProb += 0.05;
    breakdown.conversationDepth += 10;
    suggestions.push("Great start! Replies inherently boost conversation depth.");
  }
  if (isThread) {
    predictedReplyProb += 0.1;
    predictedGoodClickProb += 0.05;
    predictedGoodClickV2Prob += 0.03;
    breakdown.conversationDepth += 5;
    suggestions.push("Threads encourage deeper engagement and longer read times.");
  }
  if (hasQuestion) {
    predictedReplyProb += 0.15;
    suggestions.push("Asking questions is excellent for driving replies!");
  }
  if (hasCallToAction) {
    predictedRetweetProb += 0.05;
    predictedFavProb += 0.05;
    suggestions.push("Clear calls to action can boost specific engagement types.");
  }
  if (hasMedia) {
    predictedFavProb += 0.1;
    predictedRetweetProb += 0.05;
    predictedProfileClickProb += 0.03;
    predictedVideoPlaybackProb += 0.1; // If it's a video
    suggestions.push("Including media significantly increases visibility and engagement.");
  }
  if (wordCount > 50) {
    predictedGoodClickV2Prob += 0.01; // Longer content might imply more time spent
  }
  if (hasLink && !isReply) { // Penalize links in main post, but not in replies (e.g., "link in bio")
    suggestions.push("Consider moving external links to a reply to avoid downranking the main post.");
  }

  // Cap probabilities at a reasonable max
  predictedReplyProb = Math.min(predictedReplyProb, 0.8);
  predictedRetweetProb = Math.min(predictedRetweetProb, 0.5);
  predictedFavProb = Math.min(predictedFavProb, 0.7);
  predictedProfileClickProb = Math.min(predictedProfileClickProb, 0.3);
  predictedVideoPlaybackProb = Math.min(predictedVideoPlaybackProb, 0.9);
  predictedReplyEngagedByAuthorProb = Math.min(predictedReplyEngagedByAuthorProb, 0.5);
  predictedGoodClickProb = Math.min(predictedGoodClickProb, 0.4);
  predictedGoodClickV2Prob = Math.min(predictedGoodClickV2Prob, 0.3);

  // Calculate weighted sum
  score += X_ALGORITHM_WEIGHTS.scored_tweets_model_weight_fav * predictedFavProb;
  score += X_ALGORITHM_WEIGHTS.scored_tweets_model_weight_retweet * predictedRetweetProb;
  score += X_ALGORITHM_WEIGHTS.scored_tweets_model_weight_reply * predictedReplyProb;
  score += X_ALGORITHM_WEIGHTS.scored_tweets_model_weight_good_profile_click * predictedProfileClickProb;
  score += X_ALGORITHM_WEIGHTS.scored_tweets_model_weight_video_playback50 * predictedVideoPlaybackProb;
  score += X_ALGORITHM_WEIGHTS.scored_tweets_model_weight_reply_engaged_by_author * predictedReplyEngagedByAuthorProb;
  score += X_ALGORITHM_WEIGHTS.scored_tweets_model_weight_good_click * predictedGoodClickProb;
  score += X_ALGORITHM_WEIGHTS.scored_tweets_model_weight_good_click_v2 * predictedGoodClickV2Prob;

  // Normalize score to 0-100 range (rough estimation)
  // Max possible score with current weights and max probs:
  // 0.5*0.7 + 1.0*0.5 + 13.5*0.8 + 12.0*0.3 + 0.005*0.9 + 75.0*0.5 + 11.0*0.4 + 10.0*0.3
  // = 0.35 + 0.5 + 10.8 + 3.6 + 0.0045 + 37.5 + 4.4 + 3.0 = ~60.15
  const MAX_POSSIBLE_SCORE = 65; // Adjusted for a more realistic max
  score = (score / MAX_POSSIBLE_SCORE) * 100;
  score = Math.max(0, Math.min(100, score)); // Clamp between 0 and 100

  // Adjust breakdown based on score contribution (simplified)
  breakdown.engagement = Math.min(100, (predictedReplyProb * X_ALGORITHM_WEIGHTS.scored_tweets_model_weight_reply + predictedRetweetProb * X_ALGORITHM_WEIGHTS.scored_tweets_model_weight_retweet + predictedFavProb * X_ALGORITHM_WEIGHTS.scored_tweets_model_weight_fav) / (MAX_POSSIBLE_SCORE / 3) * 100);
  breakdown.conversationDepth = Math.min(100, (predictedReplyEngagedByAuthorProb * X_ALGORITHM_WEIGHTS.scored_tweets_model_weight_reply_engaged_by_author + predictedGoodClickProb * X_ALGORITHM_WEIGHTS.scored_tweets_model_weight_good_click) / (MAX_POSSIBLE_SCORE / 3) * 100);
  breakdown.authorReputation = Math.min(100, authorReputationScore * 100); // Directly use reputation score for now

  // Add goal-specific suggestions
  if (targetGoal === "reply" && !hasQuestion) {
    suggestions.push("To maximize replies, try asking a direct question or inviting discussion.");
  }
  if (targetGoal === "author_engagement" && !isReply) {
    suggestions.push("To get the author to engage, ensure your reply is thoughtful and adds value to their original post.");
  }
  if (targetGoal === "viral_reach" && !hasMedia) {
    suggestions.push("For broader reach, consider adding an image or video to your post.");
  }

  return {
    score: parseFloat(score.toFixed(1)),
    breakdown,
    suggestions: Array.from(new Set(suggestions)), // Remove duplicates
  };
}

export function generateOptimizationSuggestions(content: string, targetGoal: EngagementGoal): string[] {
  const suggestions: string[] = [];
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const hasQuestion = content.includes("?") || content.includes("🤔");
  const hasCallToAction = content.includes("retweet") || content.includes("like") || content.includes("follow");
  const hasLink = content.includes("http://") || content.includes("https://");
  const hasHashtag = content.includes("#");

  if (wordCount < 10) {
    suggestions.push("Consider adding more detail to increase perceived value and engagement time.");
  } else if (wordCount > 200) {
    suggestions.push("Longer posts can be effective, but ensure it's concise. Consider breaking into a thread.");
  }

  if (!hasQuestion && (targetGoal === "reply" || targetGoal === "author_engagement")) {
    suggestions.push("Asking a direct question is highly effective for driving replies and conversations.");
  }

  if (!hasCallToAction && (targetGoal === "retweet" || targetGoal === "like")) {
    suggestions.push("Include a clear call to action (e.g., 'Retweet if you agree!') to boost specific engagement.");
  }

  if (hasLink && !content.startsWith("RT @") && !content.includes("link in bio")) { // Heuristic for main post links
    suggestions.push("External links in the main post can sometimes reduce reach. Consider putting links in a follow-up reply.");
  }

  if (!hasHashtag) {
    suggestions.push("Adding relevant hashtags can increase discoverability for your niche.");
  }

  // General tips
  suggestions.push("Aim for content that sparks genuine conversation, not just passive consumption.");
  suggestions.push("Engage with replies to your posts to signal high conversation depth to the algorithm.");
  suggestions.push("Post consistently and at optimal times for your audience.");

  return suggestions;
}

