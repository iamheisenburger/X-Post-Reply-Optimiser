// Creator Intelligence Builder - Deep profile analysis

import type { CreatorIntelligence } from "./types";
import { twitterApi } from "../twitter-api";
import { analyzeCreatorProfile } from "../openai-client";

export async function buildCreatorIntelligence(
  username: string
): Promise<CreatorIntelligence> {
  console.log(`🔍 Building intelligence profile for @${username}...`);

  // 1. Fetch basic profile
  const profile = await twitterApi.getUser(username);
  
  if (!profile) {
    throw new Error(`Could not fetch profile for @${username}`);
  }

  // 2. Fetch recent tweets for analysis
  const recentTweets = await twitterApi.getUserTweets(profile.id, 20);
  const tweetTexts = recentTweets.map(t => t.text);

  // 3. AI analyzes the creator
  console.log(`🤖 Analyzing content patterns...`);
  const analysis = await analyzeCreatorProfile(profile.description, tweetTexts);

  // 4. Build comprehensive profile
  const intelligence: CreatorIntelligence = {
    username: profile.username,
    displayName: profile.name,
    followerCount: profile.followers_count,
    verified: profile.verified || false,
    
    primaryNiche: analysis.primaryNiche,
    secondaryNiches: analysis.secondaryNiches || [],
    
    audience: {
      demographics: {
        primaryInterests: analysis.audienceInterests || [],
        irrelevantTopics: analysis.audienceIrrelevantTopics || [],
        languageStyle: analysis.preferredTone || "casual",
        sophisticationLevel: inferSophisticationLevel(profile.followers_count),
      },
      
      engagementPatterns: {
        respondsTo: analysis.respondsTo || ["thoughtful questions"],
        ignores: ["generic praise", "self-promotion"],
        preferredTone: analysis.preferredTone || "direct",
      },
    },
    
    contentPatterns: {
      topics: analyzeTopicFrequency(tweetTexts),
      postTypes: analyzePostTypes(tweetTexts),
      toneProfile: analyzeToneProfile(tweetTexts),
    },
    
    crossoverPotential: {
      mmaRelevance: analysis.crossoverPotential.mmaRelevance,
      saasRelevance: analysis.crossoverPotential.saasRelevance,
      disciplineTopics: analysis.crossoverPotential.disciplineTopics,
      philosophyTopics: analysis.crossoverPotential.philosophyTopics,
    },
    
    optimalReplyStrategy: {
      mode: analysis.optimalReplyMode,
      avoidTopics: analysis.avoidTopics || [],
      emphasizeTopics: analysis.emphasizeTopics || [],
      toneMatch: analysis.preferredTone || "direct",
      questionStyle: inferQuestionStyle(analysis.respondsTo),
    },
    
    lastUpdated: Date.now(),
    tweetAnalysisCount: recentTweets.length,
  };

  console.log(`✅ Intelligence profile built for @${username}`);
  console.log(`   Primary niche: ${intelligence.primaryNiche}`);
  console.log(`   Optimal mode: ${intelligence.optimalReplyStrategy.mode}`);
  console.log(`   MMA relevance: ${intelligence.crossoverPotential.mmaRelevance}/5`);
  console.log(`   SaaS relevance: ${intelligence.crossoverPotential.saasRelevance}/5`);

  return intelligence;
}

function inferSophisticationLevel(followers: number): string {
  if (followers > 100000) return "expert";
  if (followers > 10000) return "intermediate";
  return "beginner";
}

function analyzeTopicFrequency(tweets: string[]): Array<{ topic: string; frequency: number; engagement: number }> {
  // Simple topic extraction based on keywords
  const topics = new Map<string, number>();
  
  const topicKeywords = {
    "building": ["build", "ship", "launch", "create"],
    "metrics": ["revenue", "users", "growth", "mrr", "arr"],
    "indie_hacking": ["indie", "solo", "founder", "bootstrapped"],
    "technical": ["code", "api", "system", "architecture"],
    "mindset": ["discipline", "focus", "mindset", "mental"],
  };

  for (const tweet of tweets) {
    const lowerTweet = tweet.toLowerCase();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(kw => lowerTweet.includes(kw))) {
        topics.set(topic, (topics.get(topic) || 0) + 1);
      }
    }
  }

  const total = tweets.length;
  return Array.from(topics.entries()).map(([topic, count]) => ({
    topic,
    frequency: (count / total) * 100,
    engagement: 0, // Would need engagement data from API
  }));
}

function analyzePostTypes(tweets: string[]): {
  insights: number;
  questions: number;
  announcements: number;
  personal: number;
} {
  let insights = 0;
  let questions = 0;
  let announcements = 0;
  let personal = 0;

  for (const tweet of tweets) {
    if (tweet.includes("?")) questions++;
    else if (tweet.toLowerCase().includes("just launched") || tweet.toLowerCase().includes("just shipped")) announcements++;
    else if (tweet.toLowerCase().includes("learned") || tweet.toLowerCase().includes("insight")) insights++;
    else personal++;
  }

  const total = tweets.length;
  return {
    insights: (insights / total) * 100,
    questions: (questions / total) * 100,
    announcements: (announcements / total) * 100,
    personal: (personal / total) * 100,
  };
}

function analyzeToneProfile(tweets: string[]): {
  serious: number;
  humorous: number;
  technical: number;
  philosophical: number;
} {
  // Simple heuristic-based analysis
  let serious = 0;
  let humorous = 0;
  let technical = 0;
  let philosophical = 0;

  for (const tweet of tweets) {
    const lowerTweet = tweet.toLowerCase();
    
    if (lowerTweet.includes("😂") || lowerTweet.includes("lol") || lowerTweet.includes("haha")) humorous++;
    if (lowerTweet.includes("code") || lowerTweet.includes("api") || lowerTweet.includes("system")) technical++;
    if (lowerTweet.includes("think") || lowerTweet.includes("believe") || lowerTweet.includes("philosophy")) philosophical++;
    else serious++;
  }

  const total = tweets.length;
  return {
    serious: (serious / total) * 100,
    humorous: (humorous / total) * 100,
    technical: (technical / total) * 100,
    philosophical: (philosophical / total) * 100,
  };
}

function inferQuestionStyle(respondsTo: string[]): string {
  if (respondsTo.some(r => r.toLowerCase().includes("thoughtful"))) return "deep_questions";
  if (respondsTo.some(r => r.toLowerCase().includes("data"))) return "metric_questions";
  return "open_ended";
}

export function extractTweetId(url: string): string {
  // Extract tweet ID from various X/Twitter URL formats
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /^(\d+)$/, // Just the ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  throw new Error(`Could not extract tweet ID from: ${url}`);
}

