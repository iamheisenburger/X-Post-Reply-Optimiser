// X Algorithm V2 - Quality-Based Scoring
// Measures ACTUAL reply quality, not just features

export interface QualityScoreResult {
  score: number;
  breakdown: {
    contentRelevance: number; // How relevant to the original tweet
    engagementPotential: number; // How likely to get author response
    valueAdd: number; // Does it add insight/value?
    conversationDepth: number; // Invites discussion?
    nicheAlignment: number; // Matches creator's niche?
  };
  feedback: string[];
}

export interface ScoringContext {
  originalTweet: string;
  replyText: string;
  creatorNiche: string;
  creatorAudienceInterests: string[];
  mode: string;
}

export function calculateQualityScore(context: ScoringContext): QualityScoreResult {
  const feedback: string[] = [];
  
  // === 1. CONTENT RELEVANCE (0-100) ===
  const contentRelevance = scoreContentRelevance(
    context.originalTweet,
    context.replyText,
    feedback
  );
  
  // === 2. ENGAGEMENT POTENTIAL (0-100) ===
  const engagementPotential = scoreEngagementPotential(
    context.replyText,
    context.creatorNiche,
    feedback
  );
  
  // === 3. VALUE ADD (0-100) ===
  const valueAdd = scoreValueAdd(
    context.originalTweet,
    context.replyText,
    feedback
  );
  
  // === 4. CONVERSATION DEPTH (0-100) ===
  const conversationDepth = scoreConversationDepth(
    context.replyText,
    feedback
  );
  
  // === 5. NICHE ALIGNMENT (0-100) ===
  const nicheAlignment = scoreNicheAlignment(
    context.replyText,
    context.creatorNiche,
    context.creatorAudienceInterests,
    context.mode,
    feedback
  );
  
  // === WEIGHTED FINAL SCORE ===
  // These weights reflect X algorithm priorities
  const weights = {
    contentRelevance: 0.20,    // Must be on-topic
    engagementPotential: 0.35, // Author engagement is 75x in X algo
    valueAdd: 0.25,            // Quality matters
    conversationDepth: 0.10,   // Replies are 13.5x in X algo
    nicheAlignment: 0.10       // Stay relevant
  };
  
  const finalScore = 
    contentRelevance * weights.contentRelevance +
    engagementPotential * weights.engagementPotential +
    valueAdd * weights.valueAdd +
    conversationDepth * weights.conversationDepth +
    nicheAlignment * weights.nicheAlignment;
  
  return {
    score: Math.round(finalScore * 10) / 10, // 1 decimal
    breakdown: {
      contentRelevance,
      engagementPotential,
      valueAdd,
      conversationDepth,
      nicheAlignment
    },
    feedback
  };
}

// === SCORING FUNCTIONS ===

function scoreContentRelevance(
  originalTweet: string,
  reply: string,
  feedback: string[]
): number {
  let score = 60; // Start higher - replies don't need exact word matches
  
  const tweetLower = originalTweet.toLowerCase();
  const replyLower = reply.toLowerCase();
  
  // Remove common stop words for better concept matching
  const stopWords = new Set(['the', 'and', 'but', 'for', 'are', 'this', 'that', 'with', 'from', 'have', 'been', 'will', 'would', 'could', 'should', 'what', 'when', 'where', 'who', 'why', 'how', 'can', 'its', 'not', 'you', 'your', 'they', 'their', 'there', 'were', 'was', 'been']);
  
  // Extract key concepts from original tweet (meaningful words only)
  const tweetWords = tweetLower
    .split(/\W+/)
    .filter(w => w.length > 3 && !stopWords.has(w))
    .slice(0, 20); // Analyze top 20 words
  
  // Check for concept matches (exact or partial)
  let conceptsAddressed = 0;
  let partialMatches = 0;
  const matchedWords: string[] = [];
  const missingWords: string[] = [];
  
  for (const word of tweetWords) {
    if (replyLower.includes(word)) {
      conceptsAddressed++;
      matchedWords.push(word);
    } else {
      // Check for partial/related matches (e.g., "approval" matches "approve")
      if (word.length > 5) {
        const stem = word.substring(0, Math.floor(word.length * 0.7));
        if (replyLower.includes(stem)) {
          partialMatches++;
          matchedWords.push(word);
        } else {
          missingWords.push(word);
        }
      } else {
        missingWords.push(word);
      }
    }
  }
  
  const totalMatches = conceptsAddressed + (partialMatches * 0.5);
  const relevanceRatio = totalMatches / Math.max(tweetWords.length, 1);
  
  // IMPROVED THRESHOLDS (less harsh)
  if (relevanceRatio > 0.3) {
    score = 85 + (relevanceRatio - 0.3) * 21; // 85-100
    feedback.push(`✅ Content Relevance: Strong (addresses key themes)`);
  } else if (relevanceRatio > 0.15) {
    score = 70 + (relevanceRatio - 0.15) * 100; // 70-85
    feedback.push(`✅ Content Relevance: Good (${Math.round(relevanceRatio * 100)}% concept overlap)`);
    // ADD SPECIFIC IMPROVEMENT GUIDANCE
    if (missingWords.length > 0) {
      feedback.push(`   💡 TO REACH 90+: Try incorporating these key concepts: "${missingWords.slice(0, 3).join('", "')}"`);
    }
  } else if (relevanceRatio > 0.05) {
    score = 55 + (relevanceRatio - 0.05) * 150; // 55-70
    feedback.push(`⚠️  Content Relevance: Moderate - need more specific theme references`);
    feedback.push(`   ❌ MISSING KEY CONCEPTS: "${missingWords.slice(0, 4).join('", "')}"`);
    feedback.push(`   ✅ You addressed: "${matchedWords.slice(0, 3).join('", "')}"`);
  } else {
    score = 40; // Base score for any reply that attempts to engage
    feedback.push(`❌ Content Relevance: Low - reply doesn't address the tweet's core message`);
    feedback.push(`   🎯 TWEET'S CORE CONCEPTS: "${tweetWords.slice(0, 5).join('", "')}"`);
    feedback.push(`   ❌ YOUR REPLY MUST REFERENCE AT LEAST 2-3 OF THESE CONCEPTS`);
  }
  
  // BONUS: Check if reply directly quotes or references the tweet
  if (replyLower.includes('you mentioned') || replyLower.includes('your point') || replyLower.includes('you said') || replyLower.includes('when you')) {
    score += 5;
    feedback.push(`✅ Bonus: Directly references the original tweet`);
  } else {
    feedback.push(`   💡 TIP: Start with "Your point about..." or "When you mentioned..." for higher relevance`);
  }
  
  return Math.min(100, Math.max(0, score));
}

function scoreEngagementPotential(
  reply: string,
  creatorNiche: string,
  feedback: string[]
): number {
  let score = 40; // Start lower - hard to get author engagement
  
  const lowerReply = reply.toLowerCase();
  
  // === GOOD SIGNALS ===
  
  // Specific, thoughtful question
  if (reply.includes("?")) {
    const questions = (reply.match(/\?/g) || []).length;
    if (questions === 1) {
      // Check if it's a good question (not yes/no)
      const isDeepQuestion = 
        lowerReply.includes("how") ||
        lowerReply.includes("what") ||
        lowerReply.includes("why") ||
        lowerReply.includes("which");
      
      if (isDeepQuestion) {
        score += 25;
        feedback.push(`✅ Engagement: Asks thoughtful open-ended question`);
      } else {
        score += 10;
        feedback.push(`⚠️  Engagement: Has question but could be more open-ended`);
      }
    } else if (questions > 1) {
      score += 5;
      feedback.push(`⚠️  Engagement: Multiple questions - pick ONE best question`);
    }
  } else {
    feedback.push(`❌ Engagement: No question - hard to get author response`);
    feedback.push(`   → Add ONE specific question that invites discussion`);
  }
  
  // Shows expertise/insight
  const expertiseSignals = [
    "in my experience",
    "i've found",
    "what worked for me",
    "i've seen",
    "from my perspective",
    "i discovered"
  ];
  
  if (expertiseSignals.some(signal => lowerReply.includes(signal))) {
    score += 15;
    feedback.push(`✅ Engagement: Shares personal expertise/experience`);
  }
  
  // Adds specific data/numbers
  if (/\d{1,3}[%x]|\$\d+/.test(reply)) {
    score += 10;
    feedback.push(`✅ Engagement: Includes specific metrics/data`);
  }
  
  // === BAD SIGNALS ===
  
  // Generic praise (low engagement)
  const genericPhrases = [
    "great point",
    "love this",
    "so true",
    "absolutely agree",
    "totally agree",
    "this is awesome",
    "well said"
  ];
  
  let genericCount = 0;
  for (const phrase of genericPhrases) {
    if (lowerReply.includes(phrase)) genericCount++;
  }
  
  if (genericCount > 0) {
    score -= genericCount * 10;
    feedback.push(`❌ Engagement: Too generic ("${genericPhrases.find(p => lowerReply.includes(p))}")`);
    feedback.push(`   → Remove filler praise, add unique insight instead`);
  }
  
  // Too long (hard to read)
  const wordCount = reply.split(/\s+/).length;
  if (wordCount > 80) {
    score -= 10;
    feedback.push(`⚠️  Engagement: Reply is long (${wordCount} words) - keep it concise`);
  } else if (wordCount < 15) {
    score -= 10;
    feedback.push(`⚠️  Engagement: Reply is too short (${wordCount} words) - add more value`);
  }
  
  return Math.min(100, Math.max(0, score));
}

function scoreValueAdd(
  originalTweet: string,
  reply: string,
  feedback: string[]
): number {
  let score = 50;
  
  const lowerReply = reply.toLowerCase();
  
  // Does it offer NEW information?
  const tweetWords = new Set(originalTweet.toLowerCase().split(/\W+/));
  const replyWords = reply.toLowerCase().split(/\W+/).filter(w => w.length > 4);
  const newWords = replyWords.filter(w => !tweetWords.has(w));
  
  const noveltyRatio = newWords.length / Math.max(replyWords.length, 1);
  
  if (noveltyRatio > 0.6) {
    score += 25;
    feedback.push(`✅ Value Add: High novelty (${Math.round(noveltyRatio * 100)}% new concepts)`);
  } else if (noveltyRatio < 0.3) {
    score -= 15;
    feedback.push(`❌ Value Add: Just rephrasing the original tweet`);
    feedback.push(`   → Add NEW perspective, data, or insight`);
  }
  
  // Does it offer actionable advice?
  const actionableSignals = [
    "try",
    "consider",
    "start",
    "focus on",
    "framework",
    "approach",
    "strategy",
    "method"
  ];
  
  if (actionableSignals.some(signal => lowerReply.includes(signal))) {
    score += 15;
    feedback.push(`✅ Value Add: Offers actionable advice/framework`);
  }
  
  // Does it challenge/add nuance?
  const nuanceSignals = [
    "however",
    "but",
    "also consider",
    "another angle",
    "depends on",
    "varies by"
  ];
  
  if (nuanceSignals.some(signal => lowerReply.includes(signal))) {
    score += 10;
    feedback.push(`✅ Value Add: Adds nuance/alternative perspective`);
  }
  
  return Math.min(100, Math.max(0, score));
}

function scoreConversationDepth(
  reply: string,
  feedback: string[]
): number {
  let score = 60; // Base score for being a reply (13.5x in X algo)
  
  const lowerReply = reply.toLowerCase();
  
  // Has a question (invites response)
  if (reply.includes("?")) {
    score += 20;
  }
  
  // References specific parts of original
  if (lowerReply.includes("you mentioned") || lowerReply.includes("your point about")) {
    score += 10;
    feedback.push(`✅ Conversation: References specific parts of original tweet`);
  }
  
  // Invites follow-up
  const followUpSignals = [
    "would love to hear",
    "curious about",
    "thoughts on",
    "what do you think"
  ];
  
  if (followUpSignals.some(signal => lowerReply.includes(signal))) {
    score += 10;
  }
  
  return Math.min(100, Math.max(0, score));
}

function scoreNicheAlignment(
  reply: string,
  creatorNiche: string,
  audienceInterests: string[],
  mode: string,
  feedback: string[]
): number {
  let score = 70; // Start high, deduct for violations
  
  const lowerReply = reply.toLowerCase();
  
  // Check if reply matches creator's niche
  if (creatorNiche === "mindset" || creatorNiche === "other") {
    // For mindset/other, check if we're forcing irrelevant angles
    const saasKeywords = ["saas", "startup", "revenue", "mrr", "product-market fit"];
    const mmaKeywords = ["fighter", "mma", "ufc", "combat", "octagon"];
    
    let forcedCount = 0;
    for (const keyword of [...saasKeywords, ...mmaKeywords]) {
      if (lowerReply.includes(keyword)) forcedCount++;
    }
    
    if (forcedCount > 1) {
      score -= 30;
      feedback.push(`❌ Niche Alignment: Forcing irrelevant ${mode} terminology`);
      feedback.push(`   → Creator talks about ${creatorNiche}, not ${mode}`);
      feedback.push(`   → Focus on universal themes (growth, discipline, success)`);
    }
  }
  
  // Check audience interests
  let interestMatch = 0;
  for (const interest of audienceInterests) {
    if (lowerReply.includes(interest.toLowerCase())) {
      interestMatch++;
    }
  }
  
  if (interestMatch > 0) {
    score += Math.min(20, interestMatch * 10);
    feedback.push(`✅ Niche: Matches audience interests (${interestMatch} themes)`);
  }
  
  return Math.min(100, Math.max(0, score));
}

