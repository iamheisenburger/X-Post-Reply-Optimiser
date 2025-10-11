/**
 * X (Twitter) Algorithm Scoring System
 * Based on official open-source algorithm: https://github.com/twitter/the-algorithm
 * 
 * CRITICAL ENGAGEMENT WEIGHTS (from LinearScoringFunction.java):
 * - Author Reply: 75x  (Getting the OP to respond is GOLD)
 * - Reply from Others: 13.5x (Sparking conversation)  
 * - Likes: 1x (Baseline)
 * - Profile Click: High correlation with follows
 * - Retweet: ~2x
 * 
 * REPLY OPTIMIZATION STRATEGY:
 * 1. Post within 5 mins (recency boost - logarithmic decay)
 * 2. Trigger author response (ask question, challenge take, add unique insight)
 * 3. Drive conversation (make others want to reply)
 * 4. Make viewers click your profile (authority + intrigue)
 */

export interface XAlgorithmWeights {
  authorReply: number;      // 75x - Most valuable signal
  replies: number;           // 13.5x - Conversation starter
  retweets: number;          // ~2x
  likes: number;             // 1x baseline
  profileClicks: number;     // High follow correlation
  recencyBoost: number;      // Logarithmic decay
}

export const ALGORITHM_WEIGHTS: XAlgorithmWeights = {
  authorReply: 75,
  replies: 13.5,
  retweets: 2,
  likes: 1,
  profileClicks: 5, // Estimated based on follow correlation
  recencyBoost: 2.5, // Early replies get exponential boost
};

export interface ReplyFeatures {
  hasQuestion: boolean;           // Triggers author to respond
  hasPushback: boolean;           // Contrarian = memorable
  hasSpecificData: boolean;       // Numbers/examples = credible
  hasPersonalExperience: boolean; // Authenticity signal
  isShort: boolean;               // <280 chars = readable
  callsOutOP: boolean;            // @ mention increases notification priority
  linksToProfile: boolean;        // "More on my profile" drives clicks
}

export interface EngagementPrediction {
  authorReplyProb: number;    // 0-1 probability
  repliesExpected: number;     // Count
  likesExpected: number;       // Count
  profileClicksExpected: number; // Count
  totalScore: number;          // Weighted sum
  scoreBreakdown: {
    authorReply: number;
    replies: number;
    likes: number;
    profileClicks: number;
    recencyBonus: number;
  };
}

/**
 * Analyze reply features that drive X algorithm engagement
 */
export function analyzeReplyFeatures(replyText: string): ReplyFeatures {
  const hasQuestion = /\?/.test(replyText);
  const hasPushback = /\b(actually|but|disagree|however|counterpoint|flip side|though)\b/i.test(replyText);
  const hasSpecificData = /\d+[%x]|\$\d+|\d+\s*(users|people|times|days|years)/.test(replyText);
  const hasPersonalExperience = /\b(I|my|when I|in my experience)\b/i.test(replyText);
  const isShort = replyText.length <= 280;
  const callsOutOP = replyText.startsWith('@');
  const linksToProfile = /\b(check my|see my|more in my|on my profile)\b/i.test(replyText);

  return {
    hasQuestion,
    hasPushback,
    hasSpecificData,
    hasPersonalExperience,
    isShort,
    callsOutOP,
    linksToProfile,
  };
}

/**
 * Predict engagement based on reply features + X algorithm weights
 */
export function predictEngagement(
  features: ReplyFeatures,
  minutesSincePost: number
): EngagementPrediction {
  // Base probabilities
  let authorReplyProb = 0.05; // 5% baseline
  let repliesExpected = 2;
  let likesExpected = 5;
  let profileClicksExpected = 1;

  // AUTHOR REPLY TRIGGERS (Most important - 75x weight!)
  if (features.hasQuestion) authorReplyProb += 0.25; // Questions beg answers
  if (features.hasPushback) authorReplyProb += 0.15; // Authors defend their takes
  if (features.hasSpecificData) authorReplyProb += 0.10; // Credible = worthy of response
  if (features.callsOutOP) authorReplyProb += 0.10; // Notification priority

  // CONVERSATION TRIGGERS (13.5x weight)
  if (features.hasQuestion) repliesExpected += 5; // Others join debate
  if (features.hasPushback) repliesExpected += 3; // Controversy drives engagement
  if (features.hasSpecificData) repliesExpected += 2; // Facts invite discussion

  // LIKE TRIGGERS (1x baseline)
  if (features.hasPersonalExperience) likesExpected += 10; // Relatability
  if (features.isShort) likesExpected += 5; // Readability
  if (features.hasSpecificData) likesExpected += 8; // Credibility

  // PROFILE CLICK TRIGGERS (High follow correlation)
  if (features.linksToProfile) profileClicksExpected += 10;
  if (features.hasSpecificData) profileClicksExpected += 5; // Authority signal
  if (features.hasPushback) profileClicksExpected += 3; // "Who is this guy?"

  // RECENCY BOOST (logarithmic decay - early replies WIN)
  const recencyMultiplier = minutesSincePost <= 5 
    ? ALGORITHM_WEIGHTS.recencyBoost 
    : Math.max(1, 1 + Math.log(6 / (minutesSincePost + 1)));

  // Calculate weighted score
  const authorReplyScore = authorReplyProb * ALGORITHM_WEIGHTS.authorReply;
  const repliesScore = repliesExpected * ALGORITHM_WEIGHTS.replies;
  const likesScore = likesExpected * ALGORITHM_WEIGHTS.likes;
  const profileClicksScore = profileClicksExpected * ALGORITHM_WEIGHTS.profileClicks;
  const recencyBonus = (authorReplyScore + repliesScore) * (recencyMultiplier - 1);

  const totalScore = authorReplyScore + repliesScore + likesScore + profileClicksScore + recencyBonus;

  return {
    authorReplyProb: Math.min(0.95, authorReplyProb),
    repliesExpected: Math.round(repliesExpected),
    likesExpected: Math.round(likesExpected),
    profileClicksExpected: Math.round(profileClicksExpected),
    totalScore: Math.round(totalScore),
    scoreBreakdown: {
      authorReply: Math.round(authorReplyScore),
      replies: Math.round(repliesScore),
      likes: Math.round(likesScore),
      profileClicks: Math.round(profileClicksScore),
      recencyBonus: Math.round(recencyBonus),
    },
  };
}

/**
 * Generate optimization guidelines for reply generation
 */
export function getOptimizationGuidelines(creatorProfile: {
  primaryNiche: string;
  engagementStyle: string;
  avgRepliesPerPost: number;
}): string[] {
  return [
    "✅ Ask a specific question that requires the author's expertise",
    "✅ Include a contrarian take or counterpoint (authors defend positions)",
    "✅ Add specific data/numbers to establish credibility",
    "✅ Keep under 280 chars for readability",
    "✅ Mention @ the author for notification priority",
    `✅ Reference ${creatorProfile.primaryNiche} context (shows you're in-niche)`,
    "❌ Avoid generic agreement ('Great point!' = ignored)",
    "❌ Don't be purely negative (drives blocks, not engagement)",
    "❌ No humble brags or self-promotion in body (put in bio)",
  ];
}
