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
 * Fetch 200+ tweets from a community to understand average posting style
 *
 * No filtering - we want to see how the average person posts in this community
 * Fetches multiple pages to get at least 200 tweets for comprehensive analysis
 */
async function fetchCommunityTweets(
  communityId: string
): Promise<CommunityTweet[]> {
  console.log(`🔍 Fetching 200+ community tweets (no filters)...`);
  console.log(`   Using community ID: ${communityId}`);

  const allTweets: CommunityTweet[] = [];
  let cursor: string | null = null;
  let pageCount = 0;
  const maxPages = 10; // Fetch up to 10 pages (200-500 tweets depending on API)

  while (pageCount < maxPages && allTweets.length < 200) {
    pageCount++;
    // Based on twitterapi.io docs: GET /twitter/community/tweets?community_id={id}
    const url: string = cursor
      ? `${TWITTER_API_BASE_URL}/twitter/community/tweets?community_id=${communityId}&cursor=${cursor}`
      : `${TWITTER_API_BASE_URL}/twitter/community/tweets?community_id=${communityId}`;

    console.log(`   Fetching page ${pageCount}...`);
    console.log(`   URL: ${url}`);

    const response = await fetch(url, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Community tweets fetch failed: ${response.status} ${response.statusText}`);
      console.error(`   URL: ${url}`);
      console.error(`   Response: ${errorText}`);

      // Try to parse as JSON for better error details
      try {
        const errorJson = JSON.parse(errorText);
        console.error(`   Parsed Error:`, JSON.stringify(errorJson, null, 2));
      } catch {
        // Not JSON, already logged as text
      }

      // If we already have some tweets, continue with what we have
      if (allTweets.length >= 50) {
        console.log(`   ⚠️ API error but continuing with ${allTweets.length} tweets collected so far`);
        break;
      }

      throw new Error(`Failed to fetch community tweets: ${response.status}`);
    }

    const data = await response.json();

    // Log response structure for debugging
    if (pageCount === 1) {
      console.log(`   Response keys: [${Object.keys(data).join(', ')}]`);
      console.log(`   Response preview: ${JSON.stringify(data).substring(0, 200)}...`);
    }

    // Parse response - format may vary based on API version
    const tweets = data.tweets || data.data?.tweets || data.data || [];
    if (!Array.isArray(tweets)) {
      console.warn(`⚠️ Unexpected response format from community API on page ${pageCount}`);
      console.warn(`   Expected tweets array, got: ${typeof tweets}`);
      console.warn(`   Response keys: [${Object.keys(data).join(', ')}]`);
      break;
    }

    // Map to CommunityTweet format - NO FILTERING
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedTweets: CommunityTweet[] = tweets.map((tweet: any) => ({
      text: tweet.text || tweet.full_text || "",
      likes: tweet.public_metrics?.like_count || tweet.favorite_count || 0,
      replies: tweet.public_metrics?.reply_count || tweet.reply_count || 0,
      date: tweet.created_at || new Date().toISOString(),
      authorUsername: tweet.author?.username || tweet.user?.screen_name,
      hasImage: !!(tweet.entities?.media?.length || tweet.attachments?.media_keys?.length),
    }));

    allTweets.push(...mappedTweets);
    console.log(`   Page ${pageCount}: ${mappedTweets.length} tweets (total: ${allTweets.length})`);

    // Check for pagination cursor
    cursor = data.meta?.next_token || data.next_cursor || null;
    if (!cursor) {
      console.log(`   No more pages available`);
      break;
    }

    // Small delay between pages to avoid rate limits
    if (pageCount < maxPages && allTweets.length < 200) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`✅ Found ${allTweets.length} tweets from community across ${pageCount} pages (unfiltered)`);
  return allTweets;
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

    const dataToSave = {
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
    };

    console.log(`Data being saved:`, JSON.stringify(dataToSave, null, 2).substring(0, 500));

    await fetchMutation(api.communityProfiles.upsert, dataToSave);

    console.log(`✅ Community profile saved successfully`);

    return NextResponse.json({
      success: true,
      communityName: voiceProfile.communityName,
      voiceProfile: voiceProfile.voiceProfile,
      analyzedTweets: voiceProfile.topPosts.length,
    });
  } catch (error) {
    console.error("Error analyzing community:", error);

    // Log full error details for debugging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
