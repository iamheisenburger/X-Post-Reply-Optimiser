import { NextRequest, NextResponse } from "next/server";
import { twitterApi } from "@/lib/twitter-api";
import { buildCreatorIntelligence, extractTweetId } from "@/lib/ai-reply-system/creator-intelligence";
import { generateOptimizedReplies } from "@/lib/ai-reply-system/reply-generator";
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
    console.log(`🎯 Extracted tweet ID: ${tweetId}`);

    // 2. Fetch tweet data
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
          error: "Could not fetch tweet. Check your TWITTER_API_KEY and tweet URL."
        },
        { status: 404 }
      );
    }

    console.log(`✅ Fetched tweet from @${tweet.author.username}`);

    // 3. Build creator intelligence - CHECK DATABASE FIRST!
    let creatorIntelligence;
    try {
      const cachedProfile = await fetchQuery(api.creators.getByUsername, { 
        username: tweet.author.username 
      });

      if (cachedProfile) {
        console.log(`✅ Using pre-analyzed profile from database!`);
        
        // Transform cached profile to CreatorIntelligence format
        creatorIntelligence = {
          username: cachedProfile.username,
          displayName: cachedProfile.displayName,
          followerCount: cachedProfile.followerCount,
          verified: cachedProfile.verified,
          primaryNiche: cachedProfile.primaryNiche as "saas" | "mma" | "tech" | "finance" | "mindset" | "other",
          secondaryNiches: cachedProfile.secondaryNiches,
          engagementStyle: cachedProfile.toneMatch || "professional",
          averageEngagement: {
            replies: 10, // Heuristic based on follower count
            likes: Math.round(cachedProfile.followerCount * 0.02),
            retweets: Math.round(cachedProfile.followerCount * 0.005),
          },
          responsiveness: {
            respondsToReplies: cachedProfile.respondsTo.includes("questions") || cachedProfile.respondsTo.includes("insights"),
            avgResponseTime: "< 2 hours",
          },
          crossoverPotential: {
            mmaRelevance: cachedProfile.mmaRelevance as 0 | 1 | 2 | 3 | 4 | 5,
            saasRelevance: cachedProfile.saasRelevance as 0 | 1 | 2 | 3 | 4 | 5,
            disciplineTopics: cachedProfile.disciplineTopics as 0 | 1 | 2 | 3 | 4 | 5,
            philosophyTopics: cachedProfile.philosophyTopics as 0 | 1 | 2 | 3 | 4 | 5,
          },
          metrics: {
            followers: cachedProfile.followerCount,
            engagementRate: 0.03,
          },
          audience: {
            demographics: {
              primaryInterests: cachedProfile.audiencePrimaryInterests,
              languageStyle: cachedProfile.audienceLanguageStyle,
              sophisticationLevel: cachedProfile.audienceSophisticationLevel,
              irrelevantTopics: cachedProfile.audienceIrrelevantTopics,
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
          tweet.text
        );
      }
    } catch (error) {
      console.error("Error building creator intelligence:", error);
      return NextResponse.json(
        { error: "Failed to analyze creator profile. Check your OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    console.log(`🧠 Built intelligence: ${creatorIntelligence.primaryNiche} niche, ${creatorIntelligence.optimalReplyStrategy.mode} mode`);

    // 4. Calculate time since tweet posted (for recency boost)
    const tweetDate = new Date(tweet.created_at);
    const now = new Date();
    const minutesSincePosted = Math.floor((now.getTime() - tweetDate.getTime()) / (1000 * 60));

    console.log(`⏱️  Tweet posted ${minutesSincePosted} minutes ago ${minutesSincePosted <= 5 ? '(RECENCY BOOST!)' : ''}`);

    // 5. Generate algorithm-optimized replies using NEW system
    const replies = await generateOptimizedReplies({
      tweetText: tweet.text,
      tweetAuthor: tweet.author.username,
      creatorProfile: creatorIntelligence,
      minutesSincePosted,
      yourHandle: process.env.NEXT_PUBLIC_X_HANDLE || "madmanhakim",
    });

    console.log(`✨ Generated ${replies.length} algorithm-optimized replies`);
    console.log(`📊 Score range: ${replies[replies.length-1].score} - ${replies[0].score}`);

    // 6. Transform for frontend
    const transformedReplies = replies.map((reply, idx) => ({
      text: reply.text,
      score: reply.score,
      breakdown: {
        engagement: reply.prediction.scoreBreakdown.authorReply + reply.prediction.scoreBreakdown.replies,
        recency: reply.prediction.scoreBreakdown.recencyBonus,
        conversationDepth: reply.prediction.scoreBreakdown.replies,
        quality: reply.prediction.scoreBreakdown.likes,
        profileClick: reply.prediction.scoreBreakdown.profileClicks,
      },
      mode: "algorithm_optimized",
      iteration: idx + 1,
      reasoning: [reply.reasoning],
      features: {
        hasQuestion: reply.features.hasQuestion,
        hasPushback: reply.features.hasPushback,
        hasData: reply.features.hasSpecificData,
        authorReplyProb: Math.round(reply.prediction.authorReplyProb * 100),
      },
    }));

    const averageScore = Math.round(
      transformedReplies.reduce((sum, r) => sum + r.score, 0) / transformedReplies.length
    );

    // 7. Return results
    return NextResponse.json({
      replies: transformedReplies,
      selectedMode: "algorithm_optimized",
      creatorProfile: {
        username: creatorIntelligence.username,
        displayName: creatorIntelligence.displayName,
        primaryNiche: creatorIntelligence.primaryNiche,
        mmaRelevance: creatorIntelligence.crossoverPotential.mmaRelevance,
        saasRelevance: creatorIntelligence.crossoverPotential.saasRelevance,
        engagementStyle: creatorIntelligence.engagementStyle,
      },
      totalIterations: 1, // One-shot generation!
      averageScore: averageScore,
      algorithmInsights: {
        authorReplyWeight: "75x (TARGET THIS!)",
        conversationWeight: "13.5x",
        likeWeight: "1x",
        recencyBoost: minutesSincePosted <= 5 ? "ACTIVE ⚡" : "DECAYING 📉",
        tweetAge: `${minutesSincePosted} min`,
      },
    });

  } catch (error) {
    console.error("Error in generate-reply API:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage, stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined },
      { status: 500 }
    );
  }
}
