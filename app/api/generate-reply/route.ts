import { NextRequest, NextResponse } from "next/server";
import { twitterApi } from "@/lib/twitter-api";
import { buildCreatorIntelligence, extractTweetId } from "@/lib/ai-reply-system/creator-intelligence";
import { generateOptimizedReplies } from "@/lib/ai-reply-system/optimization-engine";
import { MADMANHAKIM_PROFILE } from "@/lib/ai-reply-system";

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

    // 3. Build or fetch creator intelligence
    let creatorIntelligence;
    try {
      creatorIntelligence = await buildCreatorIntelligence(tweet.author.username);
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

    console.log(`Generated ${result.replies.length} replies with avg score ${result.averageScore.toFixed(1)}`);

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
      totalIterations: result.totalIterations,
      averageScore: result.averageScore,
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

