import { NextRequest, NextResponse } from "next/server";
import { twitterApi } from "@/lib/twitter-api";
import { buildCreatorIntelligence, extractTweetId } from "@/lib/ai-reply-system/creator-intelligence";
import { generateOptimizedReplies } from "@/lib/ai-reply-system/optimization-engine";
import { MADMANHAKIM_PROFILE } from "@/lib/ai-reply-system";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function POST(request: NextRequest) {
  try {
    const { tweetUrl } = await request.json();

    if (!tweetUrl) {
      return NextResponse.json(
        { error: "Tweet URL is required" },
        { status: 400 }
      );
    }

    // 1. Extract tweet ID from URL
    const tweetId = extractTweetId(tweetUrl);
    console.log(`Extracted tweet ID: ${tweetId}`);

    // 2. Fetch tweet data
    console.log(`Attempting to fetch tweet with ID: ${tweetId}`);
    
    if (!process.env.TWITTER_API_KEY) {
      return NextResponse.json(
        { error: "TWITTER_API_KEY is not configured in environment variables." },
        { status: 500 }
      );
    }
    
    const tweet = await twitterApi.getTweet(tweetId);
    if (!tweet) {
      return NextResponse.json(
        { 
          error: "Could not fetch tweet. Possible issues:\n" +
                 "1. Tweet ID might be invalid\n" +
                 "2. TWITTER_API_KEY might be incorrect\n" +
                 "3. TwitterAPI.io endpoint might have changed\n\n" +
                 "Check Vercel function logs for detailed error."
        },
        { status: 404 }
      );
    }

    console.log(`Fetched tweet from @${tweet.author.username}`);

    // 3. Build creator intelligence - CHECK DATABASE FIRST!
    console.log(`Checking for cached profile of @${tweet.author.username}...`);
    
    let creatorIntelligence;
    try {
      // First, check if profile exists in Profiles database
      const cachedProfile = await fetchQuery(api.creators.getByUsername, { 
        username: tweet.author.username 
      });

      if (cachedProfile) {
        console.log(`✅ Using pre-analyzed profile from Profiles database!`);
        
        // Transform cached profile to CreatorIntelligence format
        creatorIntelligence = {
          username: cachedProfile.username,
          displayName: cachedProfile.displayName,
          followerCount: cachedProfile.followerCount,
          verified: cachedProfile.verified,
          primaryNiche: cachedProfile.primaryNiche as "saas" | "mma" | "tech" | "finance" | "mindset" | "other",
          secondaryNiches: cachedProfile.secondaryNiches,
          metrics: {
            followers: cachedProfile.followerCount,
            engagementRate: 0.03, // Default heuristic, TODO: Calculate from cached data
          },
          audience: {
            demographics: {
              primaryInterests: cachedProfile.audiencePrimaryInterests,
              irrelevantTopics: cachedProfile.audienceIrrelevantTopics,
              languageStyle: cachedProfile.audienceLanguageStyle,
              sophisticationLevel: cachedProfile.audienceSophisticationLevel,
            },
            engagementPatterns: {
              respondsTo: cachedProfile.respondsTo,
              ignores: cachedProfile.ignores,
              preferredTone: cachedProfile.preferredTone,
            },
          },
          contentPatterns: {
            topics: [],
            postTypes: { insights: 0, questions: 0, announcements: 0, personal: 0 },
            toneProfile: { serious: 0, humorous: 0, technical: 0, philosophical: 0 },
          },
          crossoverPotential: {
            mmaRelevance: cachedProfile.mmaRelevance as 0 | 1 | 2 | 3 | 4 | 5,
            saasRelevance: cachedProfile.saasRelevance as 0 | 1 | 2 | 3 | 4 | 5,
            disciplineTopics: cachedProfile.disciplineTopics as 0 | 1 | 2 | 3 | 4 | 5,
            philosophyTopics: cachedProfile.philosophyTopics as 0 | 1 | 2 | 3 | 4 | 5,
          },
          optimalReplyStrategy: {
            mode: cachedProfile.optimalMode as "pure_saas" | "pure_mma" | "mindset_crossover" | "technical" | "storytelling",
            avoidTopics: cachedProfile.avoidTopics,
            emphasizeTopics: cachedProfile.emphasizeTopics,
            toneMatch: cachedProfile.toneMatch,
            questionStyle: cachedProfile.questionStyle,
          },
          lastUpdated: cachedProfile.lastUpdated,
          tweetAnalysisCount: cachedProfile.tweetAnalysisCount,
        };
      } else {
        // Fallback: Analyze on-the-fly (basic intelligence from tweet only)
        console.log(`⚠️ Profile not in database. Add @${tweet.author.username} to Profiles page for better results.`);
        
        creatorIntelligence = await buildCreatorIntelligence(
          tweet.author.username,
          {
            id: tweet.author.id,
            name: tweet.author.name,
            description: tweet.author.description,
            followers_count: tweet.author.followers_count,
            following_count: tweet.author.following_count,
            verified: tweet.author.verified || false,
          },
          tweet.text // Use current tweet as fallback
        );
      }
    } catch (error) {
      console.error("Error building creator intelligence:", error);
      return NextResponse.json(
        { error: "Failed to analyze creator profile. Check your OPENAI_API_KEY and TWITTER_API_KEY." },
        { status: 500 }
      );
    }

    console.log(`Built intelligence for @${tweet.author.username}: ${creatorIntelligence.primaryNiche} niche`);

    // 4. Transform tweet to TweetData format
    const tweetData = {
      id: tweet.id,
      text: tweet.text,
      createdAt: tweet.created_at,
      conversationId: tweet.conversation_id || tweet.id,
      author: {
        id: tweet.author.id,
        username: tweet.author.username,
        name: tweet.author.name,
        description: tweet.author.description,
        followers_count: tweet.author.followers_count,
      },
      hasMedia: tweet.hasMedia,
      isThread: tweet.isThread,
    };

    // 5. Generate optimized replies
    const result = await generateOptimizedReplies(
      tweetData,
      creatorIntelligence,
      MADMANHAKIM_PROFILE
    );

    console.log(`Generated ${result.replies.length} replies with avg ${result.averageIterations.toFixed(1)} iterations`);

    // 6. Return result
    return NextResponse.json({
      replies: result.replies,
      selectedMode: result.selectedMode,
      creatorProfile: {
        username: creatorIntelligence.username,
        displayName: creatorIntelligence.displayName,
        primaryNiche: creatorIntelligence.primaryNiche,
        mmaRelevance: creatorIntelligence.crossoverPotential.mmaRelevance,
        saasRelevance: creatorIntelligence.crossoverPotential.saasRelevance,
      },
      averageIterations: result.averageIterations,
    });

  } catch (error) {
    console.error("Error in generate-reply API:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

