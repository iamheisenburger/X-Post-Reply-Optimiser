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
  // But invalidate if it's the old broken "other" niche with 0/0 crossover
  try {
    const cached = await fetchQuery(api.creators.getByUsername, { username });
    if (cached) {
      // Check if this is the old broken cache (other niche + 0 everything)
      const isBrokenCache = 
        cached.primaryNiche === "other" &&
        cached.mmaRelevance === 0 &&
        cached.saasRelevance === 0;
      
      if (isBrokenCache && currentTweetText) {
        console.log(`🔄 Detected broken cache for @${username}, rebuilding...`);
        // Delete the bad cache and continue to rebuild
        await fetchMutation(api.creators.removeByUsername, { username });
      } else {
        console.log(`✅ Using cached profile for @${username} (saved $0.02!)`);
        
        // Transform from flattened Convex schema to CreatorIntelligence
        return {
        username: cached.username,
        displayName: cached.displayName,
        followerCount: cached.followerCount,
        verified: cached.verified,
        primaryNiche: cached.primaryNiche as "saas" | "mma" | "tech" | "finance" | "mindset" | "other",
        secondaryNiches: cached.secondaryNiches,
        metrics: {
          followers: cached.followerCount,
          engagementRate: 0.03, // Default heuristic for cached profiles
        },
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
    }
  } catch {
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
    
    metrics: {
      followers: profile.followers_count,
      engagementRate: calculateEngagementRate(recentTweets),
    },
    
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
 * Uses keyword analysis of bio + tweet content to classify niche
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
  
  // Score each niche based on keyword presence
  let saasScore = 0;
  let mmaScore = 0;
  let techScore = 0;
  let mindsetScore = 0;
  let financeScore = 0;
  
  // SaaS indicators
  if (allText.match(/\b(saas|startup|founder|build|ship|launch|product|mrr|arr|revenue|growth|users|scale)\b/g)) {
    saasScore = (allText.match(/\b(saas|startup|founder|build|ship|launch|product|mrr|arr|revenue|growth|users|scale)\b/g) || []).length;
  }
  
  // MMA indicators
  if (allText.match(/\b(mma|ufc|fighter|fight|boxing|combat|martial arts|octagon|bout|knockout|submission)\b/g)) {
    mmaScore = (allText.match(/\b(mma|ufc|fighter|fight|boxing|combat|martial arts|octagon|bout|knockout|submission)\b/g) || []).length;
  }
  
  // Tech indicators
  if (allText.match(/\b(code|developer|engineer|programming|software|api|framework|devops|architecture)\b/g)) {
    techScore = (allText.match(/\b(code|developer|engineer|programming|software|api|framework|devops|architecture)\b/g) || []).length;
  }
  
  // Mindset indicators (NEW - much broader!)
  if (allText.match(/\b(mindset|discipline|focus|mental|growth|comfort zone|fear|doubt|excuse|motivation|success|goal|habit|routine|consistency|resilience|determination|philosophy|wisdom|perspective|believe|think|improve|challenge|overcome)\b/g)) {
    mindsetScore = (allText.match(/\b(mindset|discipline|focus|mental|growth|comfort zone|fear|doubt|excuse|motivation|success|goal|habit|routine|consistency|resilience|determination|philosophy|wisdom|perspective|believe|think|improve|challenge|overcome)\b/g) || []).length;
  }
  
  // Finance indicators
  if (allText.match(/\b(invest|trading|stocks|crypto|wealth|money|finance|portfolio)\b/g)) {
    financeScore = (allText.match(/\b(invest|trading|stocks|crypto|wealth|money|finance|portfolio)\b/g) || []).length;
  }
  
  // Determine primary niche
  const scores = [
    { niche: "saas", score: saasScore },
    { niche: "mma", score: mmaScore },
    { niche: "tech", score: techScore },
    { niche: "mindset", score: mindsetScore },
    { niche: "finance", score: financeScore },
  ];
  
  scores.sort((a, b) => b.score - a.score);
  
  const primaryNiche = scores[0].score > 0 ? scores[0].niche : "other";
  
  console.log(`   Niche scores: SaaS=${saasScore}, MMA=${mmaScore}, Tech=${techScore}, Mindset=${mindsetScore}, Finance=${financeScore}`);
  console.log(`   → Primary niche: ${primaryNiche}`);
  
  // Determine crossover potential (0-5 scale)
  const saasRelevance = Math.min(5, Math.round(saasScore / 2));
  const mmaRelevance = Math.min(5, Math.round(mmaScore / 2));
  const disciplineTopics = Math.min(5, Math.round((mindsetScore + mmaScore) / 3));
  const philosophyTopics = Math.min(5, Math.round(mindsetScore / 2));
  
  // Determine optimal mode
  let optimalMode: string;
  if (primaryNiche === "saas") {
    optimalMode = "pure_saas";
  } else if (primaryNiche === "mma") {
    optimalMode = "pure_mma";
  } else if (primaryNiche === "mindset") {
    // Mindset content can use crossover if there's ANY SaaS or MMA relevance
    optimalMode = saasRelevance >= 2 || mmaRelevance >= 2 ? "mindset_crossover" : "storytelling";
  } else if (primaryNiche === "tech") {
    optimalMode = "technical";
  } else {
    // For "other" or low-confidence, use storytelling (most flexible)
    optimalMode = "storytelling";
  }
  
  return {
    primaryNiche,
    secondaryNiches: scores.filter(s => s.score > 0 && s.niche !== primaryNiche).map(s => s.niche),
    audienceInterests: primaryNiche === "mindset" ? ["personal growth", "discipline", "success"] : ["entrepreneurship", "innovation"],
    audienceIrrelevantTopics: [],
    crossoverPotential: {
      mmaRelevance,
      saasRelevance,
      disciplineTopics,
      philosophyTopics,
    },
    optimalReplyMode: optimalMode,
    respondsTo: ["thoughtful questions", "insights", "personal experiences"],
    preferredTone: primaryNiche === "mindset" ? "inspirational" : "direct",
    avoidTopics: [],
    emphasizeTopics: primaryNiche === "mindset" ? ["growth", "discipline", "mindset"] : ["growth", "building"],
  };
}

function calculateEngagementRate(tweets: Array<{
  likeCount?: number;
  like_count?: number;
  retweetCount?: number;
  retweet_count?: number;
  replyCount?: number;
  reply_count?: number;
  viewCount?: number;
  view_count?: number;
  impressionCount?: number;
}>): number {
  if (tweets.length === 0) return 0;
  
  let totalEngagement = 0;
  let totalImpressions = 0;
  
  for (const tweet of tweets) {
    const likes = tweet.likeCount || tweet.like_count || 0;
    const retweets = tweet.retweetCount || tweet.retweet_count || 0;
    const replies = tweet.replyCount || tweet.reply_count || 0;
    const views = tweet.viewCount || tweet.view_count || tweet.impressionCount || 0;
    
    totalEngagement += likes + retweets + replies;
    if (views > 0) {
      totalImpressions += views;
    }
  }
  
  // If we have view data, use engagement / views
  if (totalImpressions > 0) {
    return totalEngagement / totalImpressions;
  }
  
  // Otherwise use engagement per tweet as a proxy
  return totalEngagement / tweets.length / 100; // Normalize to 0-1 range
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

