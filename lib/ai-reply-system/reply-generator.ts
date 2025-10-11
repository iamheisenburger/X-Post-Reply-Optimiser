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

KEY PRINCIPLES:
1. **Author Engagement is King**: Ask questions, challenge takes, add unique insights that BEG a response
2. **Spark Conversation**: Make others want to reply to YOUR reply (questions, hot takes, specific data)
3. **Be Authentic**: No fake stories, no humble brags, no generic praise
4. **Be Specific**: Use numbers, examples, personal experience (builds credibility)
5. **Be Concise**: Under 280 chars = readable = more engagement
6. **Be Strategic**: Contrarian takes > agreement (memorable + defensible by author)

AVOID:
- Generic praise ("Great point!", "Love this!") = IGNORED
- Purely negative/trolling = BLOCKED
- Self-promotion in reply body (put in bio/profile)
- Fake stats or made-up stories
- Essay-length replies nobody reads`;

function buildOptimizationPrompt(context: ReplyGenerationContext): string {
  const { tweetText, tweetAuthor, creatorProfile, minutesSincePosted, yourHandle } = context;

  return `Generate 3 DIFFERENT high-engagement replies to this tweet:

**TWEET**: ${tweetText}
**AUTHOR**: @${tweetAuthor}

**CREATOR INTEL**:
- Niche: ${creatorProfile.primaryNiche}
- Style: ${creatorProfile.engagementStyle}
- Avg Engagement: ${creatorProfile.averageEngagement.replies} replies, ${creatorProfile.averageEngagement.likes} likes
- Response Rate: ${((creatorProfile.responsiveness.respondsToReplies ? 1 : 0) * 100).toFixed(0)}%

**YOUR HANDLE**: @${yourHandle}
**TIME SINCE POST**: ${minutesSincePosted} minutes (early = recency boost!)

**REPLY STRATEGIES** (use different approach for each):
1. **Question Reply**: Ask a specific question that requires author's expertise
2. **Contrarian Reply**: Polite pushback or alternative perspective with data
3. **Add-Value Reply**: Expand with personal experience or specific example

**FORMAT** (return EXACTLY this):
REPLY 1:
[Your reply text here]

REPLY 2:
[Your reply text here]

REPLY 3:
[Your reply text here]

**CONSTRAINTS**:
- Each reply < 280 characters
- @ mention the author at start
- NO generic praise
- NO fake stories or made-up stats
- Each reply uses different tactic`;
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

