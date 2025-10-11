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

    console.log(`🔍 Analyzing profile: @${username}`);

    // 1. Fetch user info from Twitter API
    const userInfo = await twitterApi.getUser(username);
    
    if (!userInfo) {
      return NextResponse.json(
        { error: `Could not fetch user @${username}. Check if account exists.` },
        { status: 404 }
      );
    }

    console.log(`✅ Fetched @${userInfo.username}: ${userInfo.followers_count.toLocaleString()} followers`);

    // 2. AI analyzes the profile (bio only - no timeline needed)
    console.log(`🤖 Running AI analysis...`);
    const analysis = await analyzeCreatorProfile(
      userInfo.description,
      [] // No tweets needed - bio is enough
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
      tweetAnalysisCount: 0, // Bio-based analysis
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

