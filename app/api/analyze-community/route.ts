import { NextRequest, NextResponse } from "next/server";
import { analyzeCommunityVoice, type CommunityTweet } from "@/lib/community-voice-analyzer";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const TWITTER_API_BASE_URL =
  process.env.TWITTER_API_BASE_URL || "https://api.twitterapi.io";
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;

function getHeaders(): HeadersInit {
  if (!TWITTER_API_KEY) {
    throw new Error("TWITTER_API_KEY is required");
  }
  return {
    "x-api-key": TWITTER_API_KEY,
    "Content-Type": "application/json",
  };
}

/**
 * Fetch ALL tweets from a community to understand average posting style
 *
 * No filtering - we want to see how the average person posts in this community
 */
async function fetchCommunityTweets(
  communityId: string
): Promise<CommunityTweet[]> {
  console.log(`🔍 Fetching ALL community tweets (no filters)...`);
  console.log(`   Using community ID: ${communityId}`);

  const url = `${TWITTER_API_BASE_URL}/twitter/community/tweets?communityId=${communityId}`;

  const response = await fetch(url, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Community tweets fetch failed: ${response.status}`);
    console.error(`   Error: ${errorText}`);
    throw new Error(`Failed to fetch community tweets: ${response.status}`);
  }

  const data = await response.json();

  // Parse response - format may vary
  let tweets = data.tweets || data.data?.tweets || data.data || [];
  if (!Array.isArray(tweets)) {
    console.warn(`⚠️ Unexpected response format from community API`);
    tweets = [];
  }

  console.log(`✅ Found ${tweets.length} tweets from community (unfiltered)`);

  // Map to CommunityTweet format - NO FILTERING
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return tweets.map((tweet: any) => ({
    text: tweet.text || tweet.full_text || "",
    likes: tweet.public_metrics?.like_count || tweet.favorite_count || 0,
    replies: tweet.public_metrics?.reply_count || tweet.reply_count || 0,
    date: tweet.created_at || new Date().toISOString(),
    authorUsername: tweet.author?.username || tweet.user?.screen_name,
  }));
}

export async function POST(request: NextRequest) {
  try {
    const {
      communityName,
      communityDescription,
      communityId,
    } = await request.json();

    if (!communityName || !communityDescription) {
      return NextResponse.json(
        { error: "communityName and communityDescription are required" },
        { status: 400 }
      );
    }

    if (!communityId) {
      return NextResponse.json(
        { error: "communityId is required" },
        { status: 400 }
      );
    }

    console.log(`\n🏘️ Analyzing community: ${communityName}`);

    // Step 1: Fetch ALL tweets from the community (no filters)
    const communityTweets = await fetchCommunityTweets(communityId);

    if (communityTweets.length < 10) {
      return NextResponse.json(
        {
          error: `Not enough tweets found (${communityTweets.length}). Need at least 10 tweets from the community.`,
        },
        { status: 400 }
      );
    }

    // Step 2: Analyze voice using Claude
    console.log(`🤖 Analyzing community voice with Claude...`);
    const voiceProfile = await analyzeCommunityVoice(
      communityName,
      communityDescription,
      communityTweets
    );

    // Step 3: Save to Convex
    console.log(`💾 Saving community profile to Convex...`);
    await fetchMutation(api.communityProfiles.upsert, {
      communityName: voiceProfile.communityName,
      twitterCommunityId: communityId,
      description: voiceProfile.description,
      voiceProfile: voiceProfile.voiceProfile,
      topPosts: voiceProfile.topPosts.map((tweet) => ({
        text: tweet.text,
        likes: tweet.likes,
        replies: tweet.replies,
        date: tweet.date,
        authorUsername: tweet.authorUsername,
      })),
    });

    console.log(`✅ Community profile saved successfully`);

    return NextResponse.json({
      success: true,
      communityName: voiceProfile.communityName,
      voiceProfile: voiceProfile.voiceProfile,
      analyzedTweets: voiceProfile.topPosts.length,
    });
  } catch (error) {
    console.error("Error analyzing community:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
