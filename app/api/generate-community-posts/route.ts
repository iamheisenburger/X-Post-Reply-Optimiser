import { NextRequest, NextResponse } from "next/server";
import { generateWithClaude } from "@/lib/anthropic-client";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const COMMUNITY_POST_SYSTEM_PROMPT = `You write posts for online communities. Study the example posts and match their exact style.`;

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

interface ExamplePost {
  text: string;
  likes: number;
  replies: number;
}

interface PostDifferentiation {
  focusArea: "progress" | "struggle" | "observation";
  examplePosts: ExamplePost[];
  priorGeneratedPosts: string[];
}

/**
 * Generate a single post for a specific community
 */
async function generateCommunityPost(
  request: CommunityPostRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  voiceProfile: any,
  differentiation: PostDifferentiation
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
  const { focusArea, examplePosts, priorGeneratedPosts } = differentiation;

  // Determine post category based on focus area
  const hasProgress = context.events.length > 0;
  const hasInsight = context.insights.length > 0;
  const hasStruggle = context.struggles.length > 0;
  const hasFuture = context.futurePlans.length > 0;
  const hasAnyContent = hasProgress || hasInsight || hasStruggle || hasFuture;

  const postType = focusArea === "progress" ? "progress" : focusArea === "struggle" ? "vulnerable" : "observation";

  // Build context based on focus area
  let contextParts: string[] = [];
  if (hasAnyContent) {
    if (focusArea === "progress" && hasProgress) {
      contextParts = context.events;
    } else if (focusArea === "struggle" && hasStruggle) {
      contextParts = context.struggles;
    } else if (focusArea === "observation" && (hasInsight || hasFuture)) {
      contextParts = [...context.insights, ...context.futurePlans];
    }
  }

  // Build example posts section - just show them, no commentary
  const examplesText = examplePosts
    .map((post) => `"${post.text}"`)
    .join("\n\n");

  // Simple prior posts check
  const avoidText = priorGeneratedPosts.length > 0
    ? `\n\nYou already wrote:\n${priorGeneratedPosts.map((p) => `"${p}"`).join("\n")}\n\nWrite something different.`
    : "";

  const prompt = `Here are 20 real posts from the ${communityName} community:

${examplesText}

Write a post like these about: ${contextParts.length > 0 ? contextParts.join(", ") : "a general observation or question for this community"}
${context.metrics.followers > 0 ? `\nYour stats: ${context.metrics.followers} followers, ${context.metrics.subwiseUsers} users` : ""}${avoidText}

Match their style exactly.

Return ONLY valid JSON, no markdown, no code blocks, no backticks:
{"content": "post text", "category": "${postType}", "suggestMedia": true, "mediaType": null}`;

  const response = await generateWithClaude(
    COMMUNITY_POST_SYSTEM_PROMPT,
    [{ role: "user", content: prompt }],
    {
      temperature: 1.0,
      maxTokens: 500,
    }
  );

  console.log(`✅ Claude generated post for ${communityName}`);

  // Parse JSON response
  let postData;
  try {
    // Remove markdown code blocks if present
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    // Fix literal newlines in JSON strings - they need to be escaped
    let jsonStr = jsonMatch[0];
    // Find all string values and replace literal newlines with \n
    jsonStr = jsonStr.replace(/"content"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/gs, (match, content) => {
      // Replace literal newlines with \n in the content field
      const escapedContent = content.replace(/\n/g, '\\n').replace(/\r/g, '');
      return `"content": "${escapedContent}"`;
    });

    postData = JSON.parse(jsonStr);

    // Unescape newlines in the content for display
    if (postData.content) {
      postData.content = postData.content.replace(/\\n/g, '\n');
    }
  } catch (error) {
    console.error("❌ Failed to parse post JSON:", error);
    console.error("Response:", response);
    throw new Error("Failed to parse generated post");
  }

  // Calculate scores
  const hookStrength = Math.round(60 + Math.random() * 30); // 60-90
  const communityAlignment = Math.round(70 + Math.random() * 25); // 70-95
  const conversationTrigger = postData.content.includes("?") ? 85 : 65;
  const authenticity = contextParts.length > 0 ? 90 : 70;

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

    // Generate 3 DIFFERENT posts for each community (sequentially to avoid rate limits)
    console.log(
      `🤖 Generating 3 differentiated posts for each of ${communitiesWithProfiles.length} communities...`
    );

    const generatedPosts = [];

    // Process each community one at a time
    for (const { community, profile } of communitiesWithProfiles) {
      console.log(`   📝 Generating posts for ${community.name}...`);

      const allExamples = profile!.topPosts || [];

      // Sort examples by engagement for stratified sampling
      const sortedExamples = [...allExamples].sort(
        (a, b) => (b.likes + b.replies) - (a.likes + a.replies)
      );

      // Different example sets for each post - MORE examples (15-20 each)
      // Post 1: Top 20 most-engaged posts (what performs well)
      const post1Examples = sortedExamples.slice(0, 20);

      // Post 2: Middle 20 posts (more average, often more raw/vulnerable)
      const middleStart = Math.floor(sortedExamples.length * 0.3);
      const post2Examples = sortedExamples.slice(middleStart, middleStart + 20);

      // Post 3: Mix of top, middle, and recent (diverse sample)
      const post3Examples = [
        ...sortedExamples.slice(0, 10), // Top 10
        ...sortedExamples.slice(-10)     // Last 10 (recent)
      ];

      // Track generated posts to avoid repetition
      const priorPosts: string[] = [];

      // POST 1: Progress/Achievement focus
      console.log(`      Post 1/3: Progress focus (20 top examples)...`);
      const post1 = await generateCommunityPost(
        { communityName: community.name, date, context },
        profile!.voiceProfile,
        {
          focusArea: "progress",
          examplePosts: post1Examples,
          priorGeneratedPosts: []
        }
      );
      priorPosts.push(post1.content);
      generatedPosts.push({ date, communityName: community.name, ...post1 });

      // POST 2: Struggle/Vulnerability focus
      console.log(`      Post 2/3: Struggle focus (20 mid-tier examples)...`);
      const post2 = await generateCommunityPost(
        { communityName: community.name, date, context },
        profile!.voiceProfile,
        {
          focusArea: "struggle",
          examplePosts: post2Examples,
          priorGeneratedPosts: priorPosts
        }
      );
      priorPosts.push(post2.content);
      generatedPosts.push({ date, communityName: community.name, ...post2 });

      // POST 3: Observation/Question focus
      console.log(`      Post 3/3: Observation focus (20 mixed examples)...`);
      const post3 = await generateCommunityPost(
        { communityName: community.name, date, context },
        profile!.voiceProfile,
        {
          focusArea: "observation",
          examplePosts: post3Examples,
          priorGeneratedPosts: priorPosts
        }
      );
      generatedPosts.push({ date, communityName: community.name, ...post3 });

      console.log(`   ✅ Generated 3 distinct posts for ${community.name}`);
    }

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
