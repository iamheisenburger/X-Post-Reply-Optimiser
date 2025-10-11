/**
 * Algorithm-Optimized Reply Generator
 * Generates replies that maximize X algorithm engagement
 */

import OpenAI from "openai";
import { analyzeReplyFeatures, predictEngagement, type EngagementPrediction, type ReplyFeatures } from "../x-algorithm";
import type { CreatorIntelligence } from "./creator-intelligence";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedReply {
  text: string;
  features: ReplyFeatures;
  prediction: EngagementPrediction;
  score: number;
  reasoning: string;
}

export interface ReplyGenerationContext {
  tweetText: string;
  tweetAuthor: string;
  creatorProfile: CreatorIntelligence;
  minutesSincePosted: number;
  yourHandle: string;
}

/**
 * Generate 3 high-quality, algorithm-optimized replies using ONE OpenAI call
 */
export async function generateOptimizedReplies(
  context: ReplyGenerationContext
): Promise<GeneratedReply[]> {
  const { tweetText, tweetAuthor, creatorProfile, minutesSincePosted, yourHandle } = context;
  
  // Cache context for fallback reply generation
  cachedContext = context;

  // Build optimization prompt based on creator intel
  const prompt = buildOptimizationPrompt(context);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.9, // Higher creativity for diverse replies
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    // Parse the 3 replies from response
    const replies = parseRepliesFromResponse(response);

    // Analyze and score each reply
    const scoredReplies = replies.map((replyText) => {
      const features = analyzeReplyFeatures(replyText);
      const prediction = predictEngagement(features, minutesSincePosted);
      
      return {
        text: replyText,
        features,
        prediction,
        score: prediction.totalScore,
        reasoning: generateReasoningExplanation(features, prediction),
      };
    });

    // Sort by score and return top 3
    return scoredReplies.sort((a, b) => b.score - a.score).slice(0, 3);

  } catch (error) {
    console.error("Reply generation error:", error);
    throw error;
  }
}

const SYSTEM_PROMPT = `You are an X (Twitter) reply expert who understands the platform's algorithm deeply.

Your goal: Generate replies that maximize AUTHOR RESPONSE (75x weight) and CONVERSATION (13.5x weight).

CRITICAL RULES:
1. **USE ALL PROVIDED CONTEXT**: Reference the creator's profile analysis, their niche, their engagement style
2. **REFERENCE THE ACTUAL TWEET**: React to what they ACTUALLY said, not generic topics
3. **NO FABRICATION**: Never make up stats, stories, or experiences that aren't real
4. **NO GENERIC RESPONSES**: "Great point!" and "Love this!" are WORTHLESS

X ALGORITHM OPTIMIZATION:
1. **Author Engagement is King (75x weight)**: Ask questions, challenge takes, add unique insights that BEG a response
2. **Spark Conversation (13.5x weight)**: Make others want to reply to YOUR reply (questions, hot takes, specific data)
3. **Be Authentic**: Real insights only - no fake stories, no humble brags
4. **Be Specific**: When you add data/examples, they must be REAL and RELEVANT to the tweet
5. **Be Concise**: Under 280 chars = readable = more engagement
6. **Be Strategic**: Contrarian takes > agreement (memorable + defensible by author)

AVOID:
- Generic praise = IGNORED by algorithm
- Purely negative/trolling = BLOCKED
- Self-promotion in reply body (put in bio)
- Made-up stats or fake stories = DESTROYS credibility
- Essay-length replies nobody reads
- Replies that could work on ANY tweet = WORTHLESS`;

function buildOptimizationPrompt(context: ReplyGenerationContext): string {
  const { tweetText, tweetAuthor, creatorProfile, minutesSincePosted, yourHandle } = context;

  // Extract key profile insights
  const profileContext = creatorProfile.audience?.engagementPatterns 
    ? `Responds to: ${creatorProfile.audience.engagementPatterns.respondsTo.join(', ')}. Ignores: ${creatorProfile.audience.engagementPatterns.ignores.join(', ')}`
    : "No specific engagement patterns available";

  const audienceLevel = creatorProfile.audience?.demographics?.sophisticationLevel || "mixed";
  
  return `Generate 3 DIFFERENT high-engagement replies to this tweet:

**TWEET CONTENT**: "${tweetText}"
**AUTHOR**: @${tweetAuthor}

**CREATOR PROFILE ANALYSIS** (USE THIS CONTEXT):
- Primary Niche: ${creatorProfile.primaryNiche}
- Engagement Style: ${creatorProfile.engagementStyle}
- Avg Engagement: ${creatorProfile.averageEngagement.replies} replies, ${creatorProfile.averageEngagement.likes} likes
- Responds to Replies: ${creatorProfile.responsiveness.respondsToReplies ? 'YES (High value!)' : 'Rarely'}
- Audience Level: ${audienceLevel}
- ${profileContext}

**YOUR HANDLE**: @${yourHandle}
**TIME SINCE POST**: ${minutesSincePosted} minutes ${minutesSincePosted <= 5 ? '(RECENCY BOOST ACTIVE!)' : '(recency decaying)'}

**REQUIREMENTS**:
1. Each reply must DIRECTLY reference the tweet content (not generic)
2. Match the creator's ${creatorProfile.engagementStyle} style
3. Target their ${creatorProfile.primaryNiche} niche with relevant context
4. Use ONLY real insights - NO made-up stats or fake stories
5. Each reply < 280 characters
6. @ mention @${tweetAuthor} at start for notification priority

**REPLY STRATEGIES** (use different approach for each):
1. **Question Reply**: Ask a specific question about WHAT THEY SAID that requires their expertise
2. **Contrarian Reply**: Polite pushback or alternative perspective on THEIR SPECIFIC POINT
3. **Add-Value Reply**: Expand on THEIR IDEA with a real relevant insight or connection

**FORMAT** (return EXACTLY this):
REPLY 1:
[Your reply that references the actual tweet content]

REPLY 2:
[Your reply that references the actual tweet content]

REPLY 3:
[Your reply that references the actual tweet content]

**CRITICAL**: Your replies should be SO specific to this tweet that they wouldn't make sense on a different tweet. Generic = FAIL.`;
}

function parseRepliesFromResponse(response: string): string[] {
  const replies: string[] = [];
  
  // Try to extract replies using various patterns
  const patterns = [
    /REPLY \d+:\s*\n(.+?)(?=\n\nREPLY \d+:|\n*$)/gs,
    /\d+\.\s*"(.+?)"/gs,
    /\d+\)\s*(.+?)(?=\n\d+\)|$)/gs,
  ];

  for (const pattern of patterns) {
    const matches = [...response.matchAll(pattern)];
    if (matches.length >= 3) {
      matches.forEach(match => {
        const reply = match[1].trim();
        if (reply.length > 20 && reply.length <= 500) { // Sanity check
          replies.push(reply);
        }
      });
      break;
    }
  }

  // Fallback: split by double newlines
  if (replies.length < 3) {
    const segments = response.split(/\n\n+/).filter(s => s.trim().length > 20);
    replies.push(...segments.slice(0, 3));
  }

  // Final fallback: generate simple replies
  while (replies.length < 3 && cachedContext) {
    const fallbackReplies = [
      `@${cachedContext.tweetAuthor} Interesting take! What made you think of this approach?`,
      `@${cachedContext.tweetAuthor} I've seen similar in ${cachedContext.creatorProfile.primaryNiche}. How does this compare?`,
      `@${cachedContext.tweetAuthor} Great insight! What would you say to critics who argue the opposite?`,
    ];
    replies.push(fallbackReplies[replies.length]);
  }

  return replies.slice(0, 3);
}

// Helper to cache context for fallback
let cachedContext: ReplyGenerationContext | null = null;

function generateReasoningExplanation(features: ReplyFeatures, prediction: EngagementPrediction): string {
  const reasons: string[] = [];

  if (prediction.authorReplyProb > 0.3) {
    reasons.push(`High author response chance (${(prediction.authorReplyProb * 100).toFixed(0)}%)`);
  }
  if (features.hasQuestion) {
    reasons.push("Includes question (drives author response)");
  }
  if (features.hasPushback) {
    reasons.push("Contrarian angle (memorable + defensible)");
  }
  if (features.hasSpecificData) {
    reasons.push("Uses specific data (credibility signal)");
  }
  if (prediction.repliesExpected > 5) {
    reasons.push(`Likely to spark ${prediction.repliesExpected}+ replies`);
  }
  if (prediction.profileClicksExpected > 5) {
    reasons.push("Strong profile click potential");
  }

  return reasons.join(" • ");
}

