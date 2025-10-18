/**
 * COMMUNITY VOICE ANALYZER
 *
 * Analyzes top tweets from a community to understand:
 * - Common phrases and opening patterns
 * - Tone characteristics (casual, technical, supportive)
 * - Topic patterns
 * - Engagement triggers
 * - Length preferences
 * - Emoji usage
 * - Technical depth
 */

import { generateWithClaude } from "./anthropic-client";

export interface CommunityTweet {
  text: string;
  likes: number;
  replies: number;
  date: string;
  authorUsername?: string;
}

export interface CommunityVoiceProfile {
  communityName: string;
  description: string;
  voiceProfile: {
    commonPhrases: string[];
    toneCharacteristics: string[];
    topicPatterns: string[];
    engagementTriggers: string[];
    lengthPreference: "short" | "medium" | "long";
    emojiUsage: "frequent" | "moderate" | "rare";
    technicalDepth: "beginner" | "intermediate" | "expert";
  };
  topPosts: CommunityTweet[];
}

const ANALYSIS_SYSTEM_PROMPT = `You are a community voice analysis expert. Your job is to analyze a collection of high-engagement tweets from a specific online community and extract their unique voice characteristics.

Analyze the tweets to identify:
1. **Common Phrases**: Opening patterns, catchphrases, recurring language
2. **Tone Characteristics**: casual/formal, supportive/competitive, humble/confident
3. **Topic Patterns**: What themes consistently get engagement
4. **Engagement Triggers**: What makes people reply, like, share
5. **Length Preference**: Do posts tend to be short (1-2 sentences), medium (3-5 sentences), or long (6+ sentences)?
6. **Emoji Usage**: frequent (multiple per post), moderate (1-2 per post), rare (occasionally)
7. **Technical Depth**: beginner-friendly, intermediate (some jargon), expert (heavy technical language)

Be SPECIFIC. Extract actual phrases used (e.g., "Just shipped", "Day 47:", "Hot take:"), not generic descriptions.`;

/**
 * Analyze a collection of tweets to extract community voice profile
 */
export async function analyzeCommunityVoice(
  communityName: string,
  communityDescription: string,
  tweets: CommunityTweet[]
): Promise<CommunityVoiceProfile> {
  console.log(`🔍 Analyzing voice for community: ${communityName}`);
  console.log(`   Analyzing ${tweets.length} tweets`);

  // Sort tweets by engagement (likes + replies)
  const sortedTweets = tweets.sort(
    (a, b) => b.likes + b.replies - (a.likes + a.replies)
  );

  // Take top 30 for analysis
  const topTweets = sortedTweets.slice(0, 30);

  // Build analysis prompt
  const tweetList = topTweets
    .map(
      (t, idx) =>
        `${idx + 1}. [${t.likes} likes, ${t.replies} replies] "${t.text}"`
    )
    .join("\n");

  const prompt = `Analyze the voice of the "${communityName}" community based on these ${topTweets.length} high-engagement tweets:

${tweetList}

Community description: ${communityDescription}

Provide analysis in this EXACT JSON format:
{
  "commonPhrases": ["phrase 1", "phrase 2", "phrase 3", ...],
  "toneCharacteristics": ["characteristic 1", "characteristic 2", ...],
  "topicPatterns": ["topic 1", "topic 2", "topic 3", ...],
  "engagementTriggers": ["trigger 1", "trigger 2", ...],
  "lengthPreference": "short" | "medium" | "long",
  "emojiUsage": "frequent" | "moderate" | "rare",
  "technicalDepth": "beginner" | "intermediate" | "expert"
}

IMPORTANT:
- commonPhrases should be ACTUAL phrases used in tweets ("Just shipped", "Day 15:", "Hot take:")
- toneCharacteristics should describe the emotional/social tone
- topicPatterns should be specific themes, not just "coding" but "code quality", "shipping fast", "debugging"
- engagementTriggers should be tactical patterns (asking questions, sharing metrics, being vulnerable)
- Be SPECIFIC and ACTIONABLE

Respond ONLY with the JSON object, no additional text.`;

  const response = await generateWithClaude(
    ANALYSIS_SYSTEM_PROMPT,
    [{ role: "user", content: prompt }],
    {
      temperature: 0.3, // Lower temperature for more consistent analysis
      maxTokens: 1500,
    }
  );

  console.log(`✅ Claude analyzed community voice`);

  // Parse JSON response
  let voiceProfile;
  try {
    // Claude might wrap JSON in markdown code blocks
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    voiceProfile = JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("❌ Failed to parse voice profile JSON:", error);
    console.error("Response:", response);
    throw new Error("Failed to parse community voice analysis");
  }

  // Validate required fields
  const requiredFields = [
    "commonPhrases",
    "toneCharacteristics",
    "topicPatterns",
    "engagementTriggers",
    "lengthPreference",
    "emojiUsage",
    "technicalDepth",
  ];

  for (const field of requiredFields) {
    if (!voiceProfile[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  console.log(`📊 Voice Profile Analysis:`);
  console.log(`   Common phrases: ${voiceProfile.commonPhrases.length}`);
  console.log(`   Tone: ${voiceProfile.toneCharacteristics.join(", ")}`);
  console.log(`   Length: ${voiceProfile.lengthPreference}`);
  console.log(`   Technical depth: ${voiceProfile.technicalDepth}`);

  return {
    communityName,
    description: communityDescription,
    voiceProfile,
    topPosts: topTweets,
  };
}

/**
 * Get posting guidelines for a community based on voice profile
 */
export function getPostingGuidelines(
  voiceProfile: CommunityVoiceProfile["voiceProfile"]
): string {
  const guidelines: string[] = [];

  // Length guidance
  if (voiceProfile.lengthPreference === "short") {
    guidelines.push("Keep posts SHORT (1-2 sentences, under 100 chars)");
  } else if (voiceProfile.lengthPreference === "medium") {
    guidelines.push("Use MEDIUM length (3-5 sentences, 100-200 chars)");
  } else {
    guidelines.push("Write LONGER posts (6+ sentences, 200+ chars)");
  }

  // Opening patterns
  if (voiceProfile.commonPhrases.length > 0) {
    const examples = voiceProfile.commonPhrases.slice(0, 3).join('", "');
    guidelines.push(
      `Use community-native openings like: "${examples}"`
    );
  }

  // Emoji usage
  if (voiceProfile.emojiUsage === "frequent") {
    guidelines.push("Use emojis liberally (2-3 per post)");
  } else if (voiceProfile.emojiUsage === "moderate") {
    guidelines.push("Use emojis sparingly (1-2 per post)");
  } else {
    guidelines.push("Avoid emojis or use very rarely");
  }

  // Technical depth
  if (voiceProfile.technicalDepth === "expert") {
    guidelines.push(
      "Use technical jargon freely, assume expert-level knowledge"
    );
  } else if (voiceProfile.technicalDepth === "intermediate") {
    guidelines.push(
      "Balance technical terms with explanations, mid-level depth"
    );
  } else {
    guidelines.push("Keep language beginner-friendly, explain technical terms");
  }

  // Engagement triggers
  if (voiceProfile.engagementTriggers.length > 0) {
    const triggers = voiceProfile.engagementTriggers.slice(0, 3).join(", ");
    guidelines.push(`Engagement tactics: ${triggers}`);
  }

  return guidelines.join("\n- ");
}
