import { NextRequest, NextResponse } from "next/server";
import { generateWithClaude } from "@/lib/anthropic-client";
import { getPostingGuidelines } from "@/lib/community-voice-analyzer";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const COMMUNITY_POST_SYSTEM_PROMPT = `You are a community-native content creator who writes posts that blend seamlessly into specific online communities.

Your goal is to create posts that:
1. Sound NATIVE to the community (not like an outsider)
2. Build AUTHORITY and RELATABILITY
3. Maximize ENGAGEMENT from community members
4. Help grow followers within that community

CRITICAL RULES:
- Match the community's voice EXACTLY (phrases, tone, length, emoji usage)
- Use the posting guidelines provided for each community
- Reference your REAL journey and metrics (never fake data)
- Be authentic and vulnerable when appropriate
- Avoid generic motivational content
- NO EM-DASHES (—) or hyphens (-) for clause separation
- Write naturally like a human scrolling on their phone`;

interface CommunityPostRequest {
  communityName: string;
  date: string;
  context: {
    events: string[];
    insights: string[];
    struggles: string[];
    futurePlans: string[];
    metrics: {
      followers: number;
      subwiseUsers: number;
      subwiseMRR?: number;
      trainingMinutes?: number;
    };
  };
}

/**
 * Generate a single post for a specific community
 */
async function generateCommunityPost(
  request: CommunityPostRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  voiceProfile: any
): Promise<{
  content: string;
  category: string;
  algorithmScore: number;
  communityFitScore: number;
  scoreBreakdown: {
    hookStrength: number;
    communityAlignment: number;
    conversationTrigger: number;
    authenticity: number;
  };
  suggestMedia: boolean;
  mediaType?: string;
}> {
  const { communityName, context } = request;

  // Build posting guidelines
  const guidelines = getPostingGuidelines(voiceProfile);

  // Determine post category based on context
  const hasProgress = context.events.length > 0;
  const hasInsight = context.insights.length > 0;
  const hasStruggle = context.struggles.length > 0;
  const hasFuture = context.futurePlans.length > 0;
  const hasAnyContent = hasProgress || hasInsight || hasStruggle || hasFuture;

  let postType = "general";
  if (hasProgress && context.metrics.followers > 0) postType = "progress";
  else if (hasInsight) postType = "insight";
  else if (hasStruggle) postType = "vulnerable";
  else if (hasFuture) postType = "building_in_public";

  // Build context summary
  const contextSummary = [
    hasProgress ? `Events: ${context.events.join(", ")}` : "",
    hasInsight ? `Insights: ${context.insights.join(", ")}` : "",
    hasStruggle ? `Struggles: ${context.struggles.join(", ")}` : "",
    hasFuture ? `Building: ${context.futurePlans.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // If no context provided, use observation-based post types
  // These don't require personal stories, just community-native commentary
  if (!hasAnyContent) {
    postType = "observation"; // Community-relevant observation/question/commentary
  }

  const prompt = `Generate 1 post for the "${communityName}" community that sounds NATIVE to that community.

COMMUNITY VOICE PROFILE:
- Common phrases: ${voiceProfile.commonPhrases.slice(0, 5).join(", ")}
- Tone: ${voiceProfile.toneCharacteristics.join(", ")}
- Topics: ${voiceProfile.topicPatterns.slice(0, 5).join(", ")}
- Engagement triggers: ${voiceProfile.engagementTriggers.join(", ")}
- Length: ${voiceProfile.lengthPreference}
- Emoji usage: ${voiceProfile.emojiUsage}
- Technical depth: ${voiceProfile.technicalDepth}

POSTING GUIDELINES:
${guidelines}

${hasAnyContent ? `YOUR CONTEXT (use this to write an authentic post):
${contextSummary}

Current metrics:
- X followers: ${context.metrics.followers}
- SubWise users: ${context.metrics.subwiseUsers}
${context.metrics.subwiseMRR ? `- SubWise MRR: $${context.metrics.subwiseMRR}` : ""}
${context.metrics.trainingMinutes ? `- Training: ${context.metrics.trainingMinutes} min` : ""}` : `NO PERSONAL CONTEXT PROVIDED.

Since you have no personal stories/events to share, create a community-native post that:
- Asks a relevant question that sparks discussion
- Shares an observation about topics this community cares about
- Invites others to share their experiences
- Uses community voice patterns but requires NO personal data

DO NOT:
- Make up fake events, metrics, or personal stories
- Claim to have done something that wasn't mentioned
- Fabricate data or achievements

INSTEAD:
- Ask genuine questions ("What's your take on X?")
- Share observations ("Anyone else notice that...?")
- Invite experiences ("How do you handle...?")
- Comment on trends this community discusses`}

POST TYPE: ${postType}

REQUIREMENTS:
1. Sound NATIVE to ${communityName} community (use their phrases, tone, style)
2. Match length preference: ${voiceProfile.lengthPreference}
3. Use emoji ${voiceProfile.emojiUsage === "frequent" ? "liberally (2-3)" : voiceProfile.emojiUsage === "moderate" ? "sparingly (1-2)" : "rarely or not at all"}
4. Technical depth: ${voiceProfile.technicalDepth}
5. NO EM-DASHES (—) or hyphens (-) for separating clauses
6. ${hasAnyContent ? "Be AUTHENTIC - only use real data from YOUR CONTEXT above" : "NO FAKE DATA - ask questions/share observations instead of making up stories"}
7. Trigger engagement using: ${voiceProfile.engagementTriggers.slice(0, 2).join(", ")}

RESPOND WITH JSON (no markdown, no code blocks):
{
  "content": "the post text here",
  "category": "${postType}",
  "suggestMedia": true/false,
  "mediaType": "screenshot" | "metrics_chart" | "training_photo" | null
}`;

  const response = await generateWithClaude(
    COMMUNITY_POST_SYSTEM_PROMPT,
    [{ role: "user", content: prompt }],
    {
      temperature: 0.8,
      maxTokens: 500,
    }
  );

  console.log(`✅ Claude generated post for ${communityName}`);

  // Parse JSON response
  let postData;
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    postData = JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("❌ Failed to parse post JSON:", error);
    console.error("Response:", response);
    throw new Error("Failed to parse generated post");
  }

  // Calculate scores
  const hookStrength = Math.round(60 + Math.random() * 30); // 60-90
  const communityAlignment = Math.round(70 + Math.random() * 25); // 70-95
  const conversationTrigger = postData.content.includes("?") ? 85 : 65;
  const authenticity = contextSummary.length > 50 ? 90 : 70;

  const algorithmScore = Math.round(
    (hookStrength + conversationTrigger + authenticity) / 3
  );
  const communityFitScore = communityAlignment;

  return {
    content: postData.content,
    category: postData.category || postType,
    algorithmScore,
    communityFitScore,
    scoreBreakdown: {
      hookStrength,
      communityAlignment,
      conversationTrigger,
      authenticity,
    },
    suggestMedia: postData.suggestMedia || false,
    mediaType: postData.mediaType || undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { date, events, insights, struggles, futurePlans, metrics } =
      await request.json();

    if (!date) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    console.log(`\n🏘️ Generating community posts for ${date}`);

    // Define communities
    const communities = [
      { name: "Software Engineering", description: "Professional software engineers discussing code quality, architecture, and best practices" },
      { name: "Indie Hackers", description: "Solo founders building and growing profitable online businesses" },
      { name: "Build in Public", description: "Entrepreneurs sharing their journey transparently, including metrics and struggles" },
      { name: "The First Thousand", description: "Creators growing from 0 to 1000 followers sharing tactics and strategies" },
    ];

    // Fetch voice profiles for all communities
    const profiles = await Promise.all(
      communities.map(async (community) => {
        const profile = await fetchQuery(api.communityProfiles.getByName, {
          communityName: community.name,
        });
        return { community, profile };
      })
    );

    // Check which communities have profiles
    const communitiesWithProfiles = profiles.filter((p) => p.profile !== null);
    const communitiesNeedingAnalysis = profiles.filter((p) => p.profile === null);

    if (communitiesNeedingAnalysis.length > 0) {
      console.log(`⚠️ ${communitiesNeedingAnalysis.length} communities need analysis first:`);
      communitiesNeedingAnalysis.forEach((p) =>
        console.log(`   - ${p.community.name}`)
      );
    }

    if (communitiesWithProfiles.length === 0) {
      return NextResponse.json(
        {
          error: "No community profiles found. Please analyze communities first.",
          needsAnalysis: communities.map((c) => c.name),
        },
        { status: 400 }
      );
    }

    // Prepare context
    const context = {
      events: events || [],
      insights: insights || [],
      struggles: struggles || [],
      futurePlans: futurePlans || [],
      metrics: {
        followers: metrics?.followers || 3,
        subwiseUsers: metrics?.subwiseUsers || 0,
        subwiseMRR: metrics?.subwiseMRR,
        trainingMinutes: metrics?.trainingMinutes,
      },
    };

    // Generate 3 posts for each community
    console.log(
      `🤖 Generating 3 posts for each of ${communitiesWithProfiles.length} communities...`
    );

    const generatedPosts = (
      await Promise.all(
        communitiesWithProfiles.map(async ({ community, profile }) => {
          // Generate 3 posts per community in parallel
          const posts = await Promise.all([
            generateCommunityPost(
              {
                communityName: community.name,
                date,
                context,
              },
              profile!.voiceProfile
            ),
            generateCommunityPost(
              {
                communityName: community.name,
                date,
                context,
              },
              profile!.voiceProfile
            ),
            generateCommunityPost(
              {
                communityName: community.name,
                date,
                context,
              },
              profile!.voiceProfile
            ),
          ]);

          return posts.map((post) => ({
            date,
            communityName: community.name,
            ...post,
          }));
        })
      )
    ).flat(); // Flatten array of arrays into single array

    // Save to Convex
    console.log(`💾 Saving ${generatedPosts.length} posts to Convex...`);
    await fetchMutation(api.communityPosts.saveGenerated, {
      posts: generatedPosts,
    });

    console.log(`✅ Community posts generated and saved successfully`);

    return NextResponse.json({
      success: true,
      posts: generatedPosts,
      generated: generatedPosts.length,
      needsAnalysis: communitiesNeedingAnalysis.map((p) => p.community.name),
    });
  } catch (error) {
    console.error("Error generating community posts:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}
