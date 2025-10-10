// Creator Intelligence Builder - Deep profile analysis

import type { CreatorIntelligence } from "./types";
import { twitterApi } from "../twitter-api";
import { analyzeCreatorProfile } from "../openai-client";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

/**
 * Build creator intelligence profile with Convex caching.
 * 
 * COST OPTIMIZATION: Checks cache FIRST to avoid duplicate OpenAI analysis!
 * 
 * @param username - The creator's username (without @)
 * @param profileData - Optional pre-fetched profile data (from tweet.author)
 */
export async function buildCreatorIntelligence(
  username: string,
  profileData?: {
    id: string;
    name: string;
    description: string;
    followers_count: number;
    following_count: number;
    verified: boolean;
  },
  currentTweetText?: string
): Promise<CreatorIntelligence> {
  console.log(`🔍 Building intelligence profile for @${username}...`);

  // 1. CHECK CONVEX CACHE FIRST (avoids duplicate OpenAI costs!)
  try {
    const cached = await fetchQuery(api.creators.getByUsername, { username });
    if (cached) {
      console.log(`✅ Using cached profile for @${username} (saved $0.02!)`);
      
      // Transform from flattened Convex schema to CreatorIntelligence
      return {
        username: cached.username,
        displayName: cached.displayName,
        followerCount: cached.followerCount,
        verified: cached.verified,
        primaryNiche: cached.primaryNiche as "saas" | "mma" | "tech" | "finance" | "mindset" | "other",
        secondaryNiches: cached.secondaryNiches,
        audience: {
          demographics: {
            primaryInterests: cached.audiencePrimaryInterests,
            irrelevantTopics: cached.audienceIrrelevantTopics,
            languageStyle: cached.audienceLanguageStyle,
            sophisticationLevel: cached.audienceSophisticationLevel,
          },
          engagementPatterns: {
            respondsTo: cached.respondsTo,
            ignores: cached.ignores,
            preferredTone: cached.preferredTone,
          },
        },
        contentPatterns: {
          topics: [], // Not stored in simplified schema
          postTypes: { insights: 0, questions: 0, announcements: 0, personal: 0 },
          toneProfile: { serious: 0, humorous: 0, technical: 0, philosophical: 0 },
        },
        crossoverPotential: {
          mmaRelevance: cached.mmaRelevance as 0 | 1 | 2 | 3 | 4 | 5,
          saasRelevance: cached.saasRelevance as 0 | 1 | 2 | 3 | 4 | 5,
          disciplineTopics: cached.disciplineTopics as 0 | 1 | 2 | 3 | 4 | 5,
          philosophyTopics: cached.philosophyTopics as 0 | 1 | 2 | 3 | 4 | 5,
        },
        optimalReplyStrategy: {
          mode: cached.optimalMode as "pure_saas" | "pure_mma" | "mindset_crossover" | "technical" | "storytelling",
          avoidTopics: cached.avoidTopics,
          emphasizeTopics: cached.emphasizeTopics,
          toneMatch: cached.toneMatch,
          questionStyle: cached.questionStyle,
        },
        lastUpdated: cached.lastUpdated,
        tweetAnalysisCount: cached.tweetAnalysisCount,
      };
    }
  } catch (error) {
    console.log(`No cached profile for @${username}, building fresh...`);
  }

  // 2. Use provided profile data OR fetch it
  let profile;
  if (profileData) {
    console.log(`✅ Using provided profile data (saved API call!)`);
    profile = {
      username,
      ...profileData,
    };
  } else {
    console.log(`⚠️ No profile data provided, fetching from API...`);
    profile = await twitterApi.getUser(username);
    
    if (!profile) {
      throw new Error(`Could not fetch profile for @${username}`);
    }
  }

  // 3. Fetch recent tweets for analysis (reduced from 20 to 10 to save costs)
  const recentTweets = await twitterApi.getUserTweets(profile.id, 10);
  let tweetTexts = recentTweets.map(t => t.text);
  
  console.log(`Fetched ${tweetTexts.length} tweets for analysis`);

  // 4. If no tweets available (suspended/private account), use current tweet as fallback
  if (tweetTexts.length === 0 && currentTweetText) {
    console.log(`⚠️ No timeline tweets available, using current tweet for analysis`);
    tweetTexts = [currentTweetText];
  }

  // 5. AI analyzes the creator (with retry for internal errors)
  console.log(`🤖 Analyzing content patterns...`);
  let analysis;
  try {
    analysis = await analyzeCreatorProfile(profile.description, tweetTexts);
  } catch (firstError) {
    console.error(`OpenAI analysis failed:`, firstError);
    
    // Retry once if it's an internal error
    if (firstError instanceof Error && firstError.message.includes('internal_error')) {
      console.log(`🔄 Retrying OpenAI analysis...`);
      try {
        analysis = await analyzeCreatorProfile(profile.description, tweetTexts);
      } catch {
        console.error(`Retry failed, using heuristic fallback`);
        analysis = createHeuristicAnalysis(profile, tweetTexts);
      }
    } else {
      console.error(`Using heuristic fallback`);
      analysis = createHeuristicAnalysis(profile, tweetTexts);
    }
  }

  // 4. Build comprehensive profile
  const intelligence: CreatorIntelligence = {
    username: profile.username,
    displayName: profile.name,
    followerCount: profile.followers_count,
    verified: profile.verified || false,
    
    primaryNiche: analysis.primaryNiche as "saas" | "mma" | "tech" | "finance" | "mindset" | "other",
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
      mmaRelevance: analysis.crossoverPotential.mmaRelevance as 0 | 1 | 2 | 3 | 4 | 5,
      saasRelevance: analysis.crossoverPotential.saasRelevance as 0 | 1 | 2 | 3 | 4 | 5,
      disciplineTopics: analysis.crossoverPotential.disciplineTopics as 0 | 1 | 2 | 3 | 4 | 5,
      philosophyTopics: analysis.crossoverPotential.philosophyTopics as 0 | 1 | 2 | 3 | 4 | 5,
    },
    
    optimalReplyStrategy: {
      mode: analysis.optimalReplyMode as "pure_saas" | "pure_mma" | "mindset_crossover" | "technical" | "storytelling",
      avoidTopics: analysis.avoidTopics || [],
      emphasizeTopics: analysis.emphasizeTopics || [],
      toneMatch: analysis.preferredTone || "direct",
      questionStyle: inferQuestionStyle(analysis.respondsTo || []),
    },
    
    lastUpdated: Date.now(),
    tweetAnalysisCount: recentTweets.length,
  };

  console.log(`✅ Intelligence profile built for @${username}`);
  console.log(`   Primary niche: ${intelligence.primaryNiche}`);
  console.log(`   Optimal mode: ${intelligence.optimalReplyStrategy.mode}`);
  console.log(`   MMA relevance: ${intelligence.crossoverPotential.mmaRelevance}/5`);
  console.log(`   SaaS relevance: ${intelligence.crossoverPotential.saasRelevance}/5`);

  // 5. SAVE TO CONVEX FOR FUTURE REPLIES (huge cost savings!)
  try {
    await fetchMutation(api.creators.upsert, {
      username: intelligence.username,
      displayName: intelligence.displayName,
      followerCount: intelligence.followerCount,
      verified: intelligence.verified,
      primaryNiche: intelligence.primaryNiche,
      secondaryNiches: intelligence.secondaryNiches,
      audiencePrimaryInterests: intelligence.audience.demographics.primaryInterests,
      audienceIrrelevantTopics: intelligence.audience.demographics.irrelevantTopics,
      audienceLanguageStyle: intelligence.audience.demographics.languageStyle || "",
      audienceSophisticationLevel: intelligence.audience.demographics.sophisticationLevel || "",
      respondsTo: intelligence.audience.engagementPatterns.respondsTo,
      ignores: intelligence.audience.engagementPatterns.ignores,
      preferredTone: intelligence.audience.engagementPatterns.preferredTone,
      mmaRelevance: intelligence.crossoverPotential.mmaRelevance,
      saasRelevance: intelligence.crossoverPotential.saasRelevance,
      disciplineTopics: intelligence.crossoverPotential.disciplineTopics,
      philosophyTopics: intelligence.crossoverPotential.philosophyTopics,
      optimalMode: intelligence.optimalReplyStrategy.mode,
      avoidTopics: intelligence.optimalReplyStrategy.avoidTopics,
      emphasizeTopics: intelligence.optimalReplyStrategy.emphasizeTopics,
      toneMatch: intelligence.optimalReplyStrategy.toneMatch,
      questionStyle: intelligence.optimalReplyStrategy.questionStyle,
      lastUpdated: intelligence.lastUpdated,
      tweetAnalysisCount: intelligence.tweetAnalysisCount,
    });
    console.log(`💾 Profile cached in Convex for future use`);
  } catch (error) {
    console.error(`⚠️ Could not cache profile:`, error);
    // Don't fail the whole request if caching fails
  }

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
  if (tweets.length === 0) {
    return { insights: 0, questions: 0, announcements: 0, personal: 0 };
  }

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
  if (tweets.length === 0) {
    return { serious: 0, humorous: 0, technical: 0, philosophical: 0 };
  }

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

/**
 * Heuristic fallback analysis when OpenAI fails
 */
function createHeuristicAnalysis(
  profile: { name: string; description: string; followers_count: number; username: string },
  tweetTexts: string[]
): {
  primaryNiche: string;
  secondaryNiches: string[];
  audienceInterests: string[];
  audienceIrrelevantTopics: string[];
  crossoverPotential: {
    mmaRelevance: number;
    saasRelevance: number;
    disciplineTopics: number;
    philosophyTopics: number;
  };
  optimalReplyMode: string;
  respondsTo: string[];
  preferredTone: string;
  avoidTopics: string[];
  emphasizeTopics: string[];
} {
  console.log(`📊 Creating heuristic analysis for @${profile.username}`);
  
  const bio = profile.description.toLowerCase();
  const allText = (bio + " " + tweetTexts.join(" ")).toLowerCase();
  
  // Detect primary niche based on keywords
  let primaryNiche = "other";
  let saasRelevance = 0;
  let mmaRelevance = 0;
  
  if (allText.includes("saas") || allText.includes("founder") || allText.includes("startup") || allText.includes("build")) {
    primaryNiche = "saas";
    saasRelevance = 5;
  } else if (allText.includes("mma") || allText.includes("ufc") || allText.includes("fighter") || allText.includes("boxing")) {
    primaryNiche = "mma";
    mmaRelevance = 5;
  } else if (allText.includes("code") || allText.includes("developer") || allText.includes("engineer")) {
    primaryNiche = "tech";
    saasRelevance = 3;
  } else if (allText.includes("discipline") || allText.includes("mindset") || allText.includes("focus")) {
    primaryNiche = "mindset";
    saasRelevance = 2;
    mmaRelevance = 2;
  }
  
  return {
    primaryNiche,
    secondaryNiches: [],
    audienceInterests: ["entrepreneurship", "personal development"],
    audienceIrrelevantTopics: [],
    crossoverPotential: {
      mmaRelevance,
      saasRelevance,
      disciplineTopics: 2,
      philosophyTopics: 2,
    },
    optimalReplyMode: saasRelevance >= mmaRelevance ? "pure_saas" : "pure_mma",
    respondsTo: ["thoughtful questions", "insights"],
    preferredTone: "direct",
    avoidTopics: [],
    emphasizeTopics: ["growth", "building"],
  };
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

