// Quality Checkpoint System - Structured evaluation before scoring

import type { CreatorIntelligence, ReplyMode } from "./types";

export interface QualityCheckpoint {
  id: string;
  name: string;
  weight: number;
  passed: boolean;
  score: number; // 0-100 for this checkpoint
  feedback: string[];
  critical: boolean; // Must pass for reply to be acceptable
}

export interface CheckpointEvaluation {
  checkpoints: QualityCheckpoint[];
  totalScore: number;
  allCriticalPassed: boolean;
  failedCheckpoints: QualityCheckpoint[];
  detailedFeedback: string;
}

/**
 * Evaluate reply against quality checkpoints
 */
export function evaluateCheckpoints(
  originalTweet: string,
  reply: string,
  creator: CreatorIntelligence,
  mode: ReplyMode
): CheckpointEvaluation {
  
  const checkpoints: QualityCheckpoint[] = [
    evaluateContentRelevance(originalTweet, reply),
    evaluateEngagementHooks(reply, creator),
    evaluateValueAdd(originalTweet, reply),
    evaluateConversationDepth(reply, creator),
    evaluateAudienceAlignment(reply, creator, mode),
  ];

  // Calculate total score
  const totalScore = checkpoints.reduce((sum, cp) => sum + (cp.score * cp.weight / 100), 0);
  
  // Check if all critical checkpoints passed
  const allCriticalPassed = checkpoints
    .filter(cp => cp.critical)
    .every(cp => cp.passed);
  
  // Get failed checkpoints
  const failedCheckpoints = checkpoints.filter(cp => !cp.passed);
  
  // Build detailed feedback
  const detailedFeedback = buildDetailedFeedback(checkpoints, creator);

  return {
    checkpoints,
    totalScore: Math.round(totalScore),
    allCriticalPassed,
    failedCheckpoints,
    detailedFeedback
  };
}

/**
 * CHECKPOINT 1: Content Relevance (25% weight)
 * Does the reply actually address the original tweet?
 */
function evaluateContentRelevance(
  originalTweet: string,
  reply: string
): QualityCheckpoint {
  
  let score = 0;
  const feedback: string[] = [];
  
  // Extract meaningful words (4+ chars)
  const tweetWords = new Set(
    originalTweet.toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 3)
  );
  
  const replyWords = reply.toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 3);
  
  // Calculate keyword overlap
  const overlapWords = replyWords.filter(w => tweetWords.has(w));
  const overlapRatio = overlapWords.length / Math.max(tweetWords.size, 1);
  
  // Scoring
  if (overlapRatio >= 0.15) {
    score += 70;
    feedback.push(`✅ Good keyword overlap (${Math.round(overlapRatio * 100)}%)`);
  } else if (overlapRatio >= 0.10) {
    score += 50;
    feedback.push(`⚠️ Moderate keyword overlap (${Math.round(overlapRatio * 100)}%) - reference more specific themes`);
  } else {
    score += 20;
    feedback.push(`❌ Low keyword overlap (${Math.round(overlapRatio * 100)}%) - reply should directly address the tweet's main points`);
  }
  
  // Check for direct reference
  const replyLower = reply.toLowerCase();
  const directReferences = [
    "your point about",
    "you mentioned",
    "when you said",
    "this reminds me of your",
    "building on your"
  ];
  
  if (directReferences.some(ref => replyLower.includes(ref))) {
    score += 30;
    feedback.push(`✅ Directly references the original tweet`);
  } else {
    feedback.push(`💡 TIP: Explicitly reference their tweet ("your point about..." or "when you mentioned...")`);
  }
  
  return {
    id: "content_relevance",
    name: "Content Relevance",
    weight: 25,
    passed: score >= 75, // Raised from 60 - must reference tweet strongly
    score: Math.min(100, score),
    feedback,
    critical: true
  };
}

/**
 * CHECKPOINT 2: Engagement Hooks (30% weight)
 * Will this reply spark engagement from the author/audience?
 */
function evaluateEngagementHooks(
  reply: string,
  creator: CreatorIntelligence
): QualityCheckpoint {
  
  let score = 50; // Start neutral
  const feedback: string[] = [];
  const replyLower = reply.toLowerCase();
  
  // CHECK 1: Has a question?
  const hasQuestion = reply.includes("?");
  if (hasQuestion) {
    // Count questions
    const questionCount = (reply.match(/\?/g) || []).length;
    
    if (questionCount === 1) {
      score += 30;
      feedback.push(`✅ Has one focused question (optimal for engagement)`);
    } else if (questionCount === 2) {
      score -= 20;
      feedback.push(`❌ Has ${questionCount} questions - MUST have exactly ONE question`);
    } else {
      score -= 30;
      feedback.push(`❌ Too many questions (${questionCount}) - STRICTLY ONE question only`);
    }
  } else {
    score -= 25;
    feedback.push(`❌ No question - add an open-ended question to drive engagement`);
  }
  
  // CHECK 2: Personal insight/expertise?
  const expertiseSignals = [
    "in my experience",
    "i've found",
    "what worked for me",
    "i've seen",
    "from my perspective",
    "i discovered",
    "when i built",
    "in building",
    "i noticed"
  ];
  
  if (expertiseSignals.some(signal => replyLower.includes(signal))) {
    score += 20;
    feedback.push(`✅ Shares personal insight/experience`);
  } else {
    feedback.push(`💡 TIP: Add personal experience or observation ("I've found..." or "In building X, I noticed...")`);
  }
  
  // CHECK 3: Generic praise (NEGATIVE) - STRICT ENFORCEMENT
  const genericPhrases = [
    "great point",
    "love this",
    "so true",
    "absolutely",
    "totally agree",
    "this is awesome",
    "well said",
    "amazing",
    "perfectly said",
    "you're spot on",
    "you're right",
    "i agree",
    "this resonates",
    "100%"
  ];
  
  const genericCount = genericPhrases.filter(phrase => replyLower.includes(phrase)).length;
  
  if (genericCount === 0) {
    score += 20;
    feedback.push(`✅ No generic filler praise`);
  } else {
    score -= genericCount * 25; // Increased penalty
    feedback.push(`❌ Contains generic praise ("${genericPhrases.find(p => replyLower.includes(p))}") - FORBIDDEN`);
  }
  
  // CHECK 4: Specific to creator's niche?
  const nicheWords = creator.audience.demographics.primaryInterests
    .flatMap(interest => interest.toLowerCase().split(/\s+/))
    .filter(w => w.length > 4);
  
  const nicheMatchCount = nicheWords.filter(word => replyLower.includes(word)).length;
  
  if (nicheMatchCount >= 2) {
    score += 15;
    feedback.push(`✅ References niche-specific concepts (${creator.primaryNiche})`);
  } else {
    feedback.push(`💡 TIP: Connect to their niche interests: ${creator.audience.demographics.primaryInterests.slice(0, 2).join(", ")}`);
  }
  
  return {
    id: "engagement_hooks",
    name: "Engagement Hooks",
    weight: 30,
    passed: score >= 75, // Raised from 65 - must be stricter
    score: Math.min(100, Math.max(0, score)),
    feedback,
    critical: true
  };
}

/**
 * CHECKPOINT 3: Value Add (25% weight)
 * Does this reply add something new and valuable?
 */
function evaluateValueAdd(
  originalTweet: string,
  reply: string
): QualityCheckpoint {
  
  let score = 40; // Start slightly below neutral
  const feedback: string[] = [];
  
  // Extract words (5+ chars for better signal)
  const tweetWords = new Set(
    originalTweet.toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 4)
  );
  
  const replyWords = reply.toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 4);
  
  // Calculate novelty ratio
  const newWords = replyWords.filter(w => !tweetWords.has(w));
  const noveltyRatio = newWords.length / Math.max(replyWords.length, 1);
  
  if (noveltyRatio >= 0.70) {
    score += 35;
    feedback.push(`✅ High novelty (${Math.round(noveltyRatio * 100)}% new concepts)`);
  } else if (noveltyRatio >= 0.50) {
    score += 20;
    feedback.push(`⚠️ Moderate novelty (${Math.round(noveltyRatio * 100)}%) - add more unique perspective`);
  } else {
    score -= 10;
    feedback.push(`❌ Low novelty (${Math.round(noveltyRatio * 100)}%) - too much rephrasing, add NEW insight`);
  }
  
  // Actionable advice?
  const actionableSignals = [
    "try",
    "consider",
    "start by",
    "focus on",
    "framework",
    "approach",
    "strategy",
    "method",
    "technique",
    "process"
  ];
  
  if (actionableSignals.some(signal => reply.toLowerCase().includes(signal))) {
    score += 25;
    feedback.push(`✅ Offers actionable advice/framework`);
  }
  
  // Specific data/metrics?
  if (/\d{1,3}[%x]|\$\d+/.test(reply)) {
    score += 15;
    feedback.push(`✅ Includes specific metrics/data`);
  }
  
  // Adds nuance?
  const nuanceSignals = [
    "however",
    "but also",
    "on the other hand",
    "worth noting",
    "interesting tension",
    "flip side",
    "caveat"
  ];
  
  if (nuanceSignals.some(signal => reply.toLowerCase().includes(signal))) {
    score += 20;
    feedback.push(`✅ Adds nuance or alternative perspective`);
  }
  
  return {
    id: "value_add",
    name: "Value Add",
    weight: 25,
    passed: score >= 60,
    score: Math.min(100, Math.max(0, score)),
    feedback,
    critical: false
  };
}

/**
 * CHECKPOINT 4: Conversation Depth (20% weight)
 * Does this drive meaningful discussion?
 */
function evaluateConversationDepth(
  reply: string,
  creator: CreatorIntelligence
): QualityCheckpoint {
  
  let score = 50;
  const feedback: string[] = [];
  const replyLower = reply.toLowerCase();
  
  // Open-ended question?
  const openEndedStarters = [
    "how do you",
    "what's your",
    "how have you",
    "what approach",
    "how did you",
    "what made you",
    "how would you",
    "what drives"
  ];
  
  if (openEndedStarters.some(starter => replyLower.includes(starter))) {
    score += 30;
    feedback.push(`✅ Has open-ended question (drives discussion)`);
  } else if (reply.includes("?")) {
    feedback.push(`⚠️ Has question but make it more open-ended (how/what instead of yes/no)`);
  }
  
  // Specific to their expertise?
  const expertiseTerms = creator.audience.demographics.primaryInterests
    .slice(0, 3)
    .join(", ");
  
  if (creator.audience.demographics.primaryInterests.some(interest => 
    replyLower.includes(interest.toLowerCase())
  )) {
    score += 30;
    feedback.push(`✅ Question is specific to their expertise (${creator.primaryNiche})`);
  } else {
    feedback.push(`💡 TIP: Make question specific to their niche: ${expertiseTerms}`);
  }
  
  // STRICT LENGTH CHECK: 35-55 words
  const wordCount = reply.split(/\s+/).length;
  if (wordCount >= 35 && wordCount <= 55) {
    score += 30;
    feedback.push(`✅ Perfect length (${wordCount} words) - optimal for engagement`);
  } else if (wordCount >= 25 && wordCount < 35) {
    score += 10;
    feedback.push(`⚠️ Slightly short (${wordCount} words) - aim for 35-55 words`);
  } else if (wordCount > 55 && wordCount <= 70) {
    score -= 20;
    feedback.push(`❌ Too long (${wordCount} words) - MUST be 35-55 words`);
  } else if (wordCount < 25) {
    score -= 25;
    feedback.push(`❌ Too brief (${wordCount} words) - MUST be at least 35 words`);
  } else {
    score -= 30;
    feedback.push(`❌ Way too long (${wordCount} words) - STRICTLY 35-55 words only`);
  }
  
  return {
    id: "conversation_depth",
    name: "Conversation Depth",
    weight: 20,
    passed: score >= 70, // Raised from 60 - must be stricter
    score: Math.min(100, Math.max(0, score)),
    feedback,
    critical: false
  };
}

/**
 * CHECKPOINT 5: Audience Alignment (Bonus)
 * Does this match the creator's audience preferences?
 */
function evaluateAudienceAlignment(
  reply: string,
  creator: CreatorIntelligence,
  mode: ReplyMode
): QualityCheckpoint {
  
  let score = 70; // Start high, deduct for violations
  const feedback: string[] = [];
  const replyLower = reply.toLowerCase();
  
  // Check tone alignment
  const preferredTone = creator.audience.engagementPatterns.preferredTone;
  feedback.push(`📋 Target tone: ${preferredTone}`);
  
  // Check for irrelevant topics
  for (const irrelevant of creator.audience.demographics.irrelevantTopics) {
    const regex = new RegExp(`\\b${irrelevant.toLowerCase()}\\b`);
    if (regex.test(replyLower)) {
      score -= 30;
      feedback.push(`❌ Mentions "${irrelevant}" (irrelevant to this audience)`);
    }
  }
  
  // Check what they typically ignore
  const ignorePatterns = creator.audience.engagementPatterns.ignores;
  for (const pattern of ignorePatterns) {
    if (replyLower.includes(pattern.toLowerCase())) {
      score -= 20;
      feedback.push(`⚠️ Uses pattern they typically ignore: "${pattern}"`);
    }
  }
  
  // Check mode compliance
  if (mode === "mindset_crossover") {
    const explicitMMA = ["fighter", "mma", "ufc", "cage"];
    for (const term of explicitMMA) {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      if (regex.test(reply)) {
        score -= 25;
        feedback.push(`❌ Too MMA-specific for crossover mode - frame universally`);
        break;
      }
    }
  }
  
  if (score >= 70) {
    feedback.push(`✅ Well-aligned with audience preferences`);
  }
  
  return {
    id: "audience_alignment",
    name: "Audience Alignment",
    weight: 15,
    passed: score >= 60,
    score: Math.min(100, Math.max(0, score)),
    feedback,
    critical: false
  };
}

/**
 * Build detailed feedback for OpenAI
 */
function buildDetailedFeedback(
  checkpoints: QualityCheckpoint[],
  creator: CreatorIntelligence
): string {
  
  const lines: string[] = [];
  
  lines.push("=== QUALITY CHECKPOINT EVALUATION ===\n");
  
  // Show each checkpoint
  for (const cp of checkpoints) {
    const status = cp.passed ? "✅ PASS" : "❌ FAIL";
    const critical = cp.critical ? " [CRITICAL]" : "";
    lines.push(`${status} ${cp.name}${critical}: ${cp.score}/100 (${cp.weight}% weight)`);
    
    for (const fb of cp.feedback) {
      lines.push(`  ${fb}`);
    }
    lines.push("");
  }
  
  // Failed checkpoints summary
  const failed = checkpoints.filter(cp => !cp.passed);
  if (failed.length > 0) {
    lines.push("🎯 PRIORITY FIXES:");
    
    for (const cp of failed) {
      lines.push(`\n${cp.name.toUpperCase()}:`);
      const actionableFeedback = cp.feedback.filter(f => 
        f.includes("💡 TIP") || f.includes("❌") || f.includes("⚠️")
      );
      for (const fb of actionableFeedback) {
        lines.push(`  ${fb}`);
      }
    }
    
    lines.push("\n📌 CREATOR CONTEXT:");
    lines.push(`• Niche: ${creator.primaryNiche}`);
    lines.push(`• Audience interests: ${creator.audience.demographics.primaryInterests.slice(0, 2).join(", ")}`);
    lines.push(`• Responds to: ${creator.audience.engagementPatterns.respondsTo[0]}`);
  } else {
    lines.push("🎉 ALL CHECKPOINTS PASSED!");
  }
  
  return lines.join("\n");
}

