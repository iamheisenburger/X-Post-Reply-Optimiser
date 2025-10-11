import { NextRequest, NextResponse } from "next/server";
import { twitterApi } from "@/lib/twitter-api";
import { analyzeCreatorProfile } from "@/lib/openai-client";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Parse username from various input formats
    let cleanUsername = username.trim();
    
    // Remove @ if present
    cleanUsername = cleanUsername.replace(/^@/, "");
    
    // Extract username from URL formats
    // https://x.com/username or https://twitter.com/username or https://x.com/username/status/123
    if (cleanUsername.includes("x.com/") || cleanUsername.includes("twitter.com/")) {
      const urlMatch = cleanUsername.match(/(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/);
      if (urlMatch && urlMatch[1]) {
        cleanUsername = urlMatch[1];
      }
    }
    
    console.log(`🔍 Analyzing profile: @${cleanUsername}`);

    // 1. Fetch user info from Twitter API
    const userInfo = await twitterApi.getUser(cleanUsername);
    
    if (!userInfo) {
      return NextResponse.json(
        { error: `Could not fetch user @${username}. Check if account exists.` },
        { status: 404 }
      );
    }

    console.log(`✅ Fetched @${userInfo.username}: ${userInfo.followers_count.toLocaleString()} followers`);

    // 2. Fetch user's recent tweets for better analysis
    console.log(`📥 Fetching recent tweets...`);
    const recentTweets = await twitterApi.getUserTweets(userInfo.id, 15);
    console.log(`✅ Fetched ${recentTweets.length} tweets`);

    // Extract just the text from tweets
    const tweetTexts = recentTweets.map(t => t.text);

    // 3. AI analyzes the profile with FULL context
    if (tweetTexts.length > 0) {
      console.log(`🤖 Running AI analysis with ${tweetTexts.length} tweets (RICH ANALYSIS)...`);
    } else {
      console.log(`⚠️ No tweets available - analyzing bio only (BASIC ANALYSIS)...`);
    }
    
    const analysis = await analyzeCreatorProfile(
      userInfo.description,
      tweetTexts // Pass tweets if available, empty array if not
    );

    console.log(`✅ Analysis complete: ${analysis.primaryNiche} niche`);

    // 3. Save to Convex database
    await fetchMutation(api.creators.upsert, {
      username: userInfo.username,
      displayName: userInfo.name,
      followerCount: userInfo.followers_count,
      verified: userInfo.verified || false,
      
      // AI-generated intelligence
      primaryNiche: analysis.primaryNiche,
      secondaryNiches: analysis.secondaryNiches || [],
      audiencePrimaryInterests: analysis.audienceInterests || [],
      audienceIrrelevantTopics: analysis.audienceIrrelevantTopics || [],
      audienceLanguageStyle: analysis.preferredTone || "direct",
      audienceSophisticationLevel: inferSophisticationLevel(userInfo.followers_count),
      
      respondsTo: analysis.respondsTo || ["thoughtful questions"],
      ignores: ["generic praise", "self-promotion"],
      preferredTone: analysis.preferredTone || "direct",
      
      mmaRelevance: analysis.crossoverPotential.mmaRelevance,
      saasRelevance: analysis.crossoverPotential.saasRelevance,
      disciplineTopics: analysis.crossoverPotential.disciplineTopics,
      philosophyTopics: analysis.crossoverPotential.philosophyTopics,
      
      optimalMode: analysis.optimalReplyMode,
      avoidTopics: analysis.avoidTopics || [],
      emphasizeTopics: analysis.emphasizeTopics || [],
      toneMatch: analysis.preferredTone || "direct",
      questionStyle: "open_ended",
      
      lastUpdated: Date.now(),
      tweetAnalysisCount: tweetTexts.length, // Number of tweets analyzed
    });

    console.log(`💾 Profile saved to database`);

    return NextResponse.json({
      success: true,
      profile: {
        username: userInfo.username,
        displayName: userInfo.name,
        primaryNiche: analysis.primaryNiche,
        saasRelevance: analysis.crossoverPotential.saasRelevance,
        mmaRelevance: analysis.crossoverPotential.mmaRelevance,
        tweetAnalysisCount: tweetTexts.length, // Show how many tweets were analyzed
        analysisType: tweetTexts.length > 0 ? "full" : "basic", // Explicit type
      },
    });

  } catch (error) {
    console.error("Error analyzing profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

function inferSophisticationLevel(followers: number): string {
  if (followers > 100000) return "expert";
  if (followers > 10000) return "intermediate";
  return "beginner";
}

