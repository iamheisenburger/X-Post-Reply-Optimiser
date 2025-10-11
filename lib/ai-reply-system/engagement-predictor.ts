/**
 * Engagement Predictor - Based on X's Actual Algorithm
 * 
 * From X's algorithm (EngagementFeatures.scala):
 * - favoritedBy: users who liked
 * - retweetedBy: users who retweeted
 * - repliedBy: users who replied
 * 
 * Goal: Predict probability that YOUR REPLY gets engagement
 * → If it gets engagement → X shows it to more people → More impressions
 */

export interface EngagementSignals {
  // From reply content
  replyType: 'question' | 'story' | 'insight' | 'agreement';
  hasSpecificNumbers: boolean;
  mentionsCreator: boolean;
  length: number;
  
  // From creator's profile
  creatorFollowers: number;
  creatorEngagementRate: number;
  creatorRespondsToReplies: boolean; // CRITICAL: Does creator actually respond?
  
  // From original tweet
  tweetHasEngagement: boolean;
  tweetAge: number; // minutes since posted
}

export interface EngagementPrediction {
  probabilityAuthorResponds: number;  // 0-1 (MOST IMPORTANT - 75x boost)
  probabilityGetsLikes: number;       // 0-1
  probabilityGetsReplies: number;     // 0-1
  overallScore: number;               // Weighted score for ranking
  reasoning: string[];
}

/**
 * Predict engagement probability based on X's signals
 */
export function predictEngagement(
  reply: string,
  signals: EngagementSignals
): EngagementPrediction {
  const reasoning: string[] = [];
  let authorRespondProb = 0.05; // Base 5%
  let likesProb = 0.15; // Base 15%
  let repliesProb = 0.03; // Base 3%

  // CRITICAL FACTOR 0: Does creator even respond to replies?
  if (!signals.creatorRespondsToReplies) {
    authorRespondProb = 0.01; // Drop to 1% - they rarely respond
    reasoning.push("⚠️ Creator rarely responds to replies → 75x boost unlikely");
    reasoning.push("   → Focus on likes/replies from others instead");
  } else {
    reasoning.push("✅ Creator responds to replies → 75x boost possible");
  }

  // FACTOR 1: Reply type determines engagement pattern
  switch (signals.replyType) {
    case 'question':
      if (signals.creatorRespondsToReplies) {
        authorRespondProb += 0.25;
        reasoning.push("✅ Thoughtful question → +25% author response");
      }
      break;
    case 'insight':
      likesProb += 0.25;
      repliesProb += 0.15;
      reasoning.push("✅ Valuable insight → +25% likes, +15% replies");
      break;
    case 'story':
      likesProb += 0.20;
      authorRespondProb += 0.10;
      reasoning.push("✅ Personal story → +20% likes, +10% author response");
      break;
    case 'agreement':
      likesProb += 0.10;
      reasoning.push("⚠️ Simple agreement → +10% likes only");
      break;
  }

  // FACTOR 2: Early reply timing (within 5 min)
  if (signals.tweetAge < 5) {
    authorRespondProb += 0.15;
    likesProb += 0.10;
    reasoning.push("✅ Early reply (< 5min) → +15% author response, +10% likes");
  }

  // FACTOR 3: Specific numbers/data make it valuable
  if (signals.hasSpecificNumbers) {
    likesProb += 0.20;
    repliesProb += 0.10;
    reasoning.push("✅ Has specific numbers → +20% likes, +10% replies");
  }

  // FACTOR 4: Reply length (35-75 words is optimal)
  const words = reply.split(/\s+/).length;
  if (words >= 35 && words <= 75) {
    likesProb += 0.10;
    reasoning.push(`✅ Optimal length (${words} words) → +10% likes`);
  } else if (words < 20) {
    likesProb -= 0.10;
    reasoning.push(`⚠️ Too short (${words} words) → -10% likes`);
  } else if (words > 100) {
    likesProb -= 0.15;
    authorRespondProb -= 0.10;
    reasoning.push(`⚠️ Too long (${words} words) → -15% likes, -10% author response`);
  }

  // FACTOR 5: Creator engagement rate
  if (signals.creatorEngagementRate > 0.05) {
    authorRespondProb += 0.10;
    reasoning.push(`✅ Creator is engaged (${(signals.creatorEngagementRate * 100).toFixed(1)}% rate) → +10% author response`);
  }

  // Cap probabilities at 0-1
  authorRespondProb = Math.min(1, Math.max(0, authorRespondProb));
  likesProb = Math.min(1, Math.max(0, likesProb));
  repliesProb = Math.min(1, Math.max(0, repliesProb));

  // Overall score: weighted by X's algorithm importance
  // Author response = 75x boost (from X's code)
  // Likes = 1x boost
  // Replies = 13.5x boost (from X's code)
  const overallScore = (
    (authorRespondProb * 75) +
    (likesProb * 1) +
    (repliesProb * 13.5)
  ) / (75 + 1 + 13.5);

  return {
    probabilityAuthorResponds: authorRespondProb,
    probabilityGetsLikes: likesProb,
    probabilityGetsReplies: repliesProb,
    overallScore: overallScore * 100, // Convert to 0-100
    reasoning
  };
}

/**
 * Detect reply type from content
 */
function detectReplyType(reply: string): 'question' | 'story' | 'insight' | 'agreement' {
  const replyLower = reply.toLowerCase();
  
  // Question: ends with ? or has questioning words
  if (reply.includes('?') || /\b(how|what|why|when|which|where|does)\b/i.test(reply)) {
    return 'question';
  }
  
  // Story: has personal narrative markers
  if (/\b(i|my|me|when i|i've|i had|my experience)\b/i.test(replyLower) && 
      (replyLower.includes('last') || replyLower.includes('when') || replyLower.includes('during'))) {
    return 'story';
  }
  
  // Insight: has actionable/analytical content
  if (/\b(found that|discovered|realized|key is|important to|strategy|approach)\b/i.test(replyLower) ||
      /\b\d+%/.test(reply)) { // Has data/percentages
    return 'insight';
  }
  
  // Agreement: short affirmation
  if (replyLower.length < 100 && /\b(exactly|agreed|this|yes|true)\b/i.test(replyLower)) {
    return 'agreement';
  }
  
  // Default to insight if unclear
  return 'insight';
}

/**
 * Extract engagement signals from reply + context
 */
export function extractSignals(
  reply: string,
  creator: { 
    username: string; 
    followers: number; 
    engagement_rate?: number;
    respondsToReplies?: boolean; // NEW: Track if creator responds
  },
  tweet: { text: string; created_at: string; reply_count: number; like_count: number }
): EngagementSignals {
  const now = new Date();
  const tweetTime = new Date(tweet.created_at);
  const tweetAgeMinutes = (now.getTime() - tweetTime.getTime()) / (1000 * 60);

  return {
    replyType: detectReplyType(reply),
    hasSpecificNumbers: /\b\d+[KM%]?\b/.test(reply) || /\b\d+\s+(to|vs|versus)\s+\d+\b/i.test(reply),
    mentionsCreator: reply.toLowerCase().includes(creator.username.toLowerCase()),
    length: reply.split(/\s+/).length,
    creatorFollowers: creator.followers,
    creatorEngagementRate: creator.engagement_rate || (tweet.reply_count / Math.max(tweet.like_count, 1)),
    creatorRespondsToReplies: creator.respondsToReplies !== false, // Default to true if unknown
    tweetHasEngagement: tweet.like_count > 5 || tweet.reply_count > 2,
    tweetAge: tweetAgeMinutes
  };
}

