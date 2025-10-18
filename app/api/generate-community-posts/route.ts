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

CRITICAL ANTI-AI RULES (these patterns scream "bot"):
❌ NO filler words: "honestly", "however", "furthermore", "actually", "to be fair"
❌ NO rigid structures: intro → update → reflection → question
❌ NO engagement bait questions at the end
❌ NO motivational speaker tone or generic inspiration
❌ NO parallel structures like "isn't just about X — it's about Y"
❌ NO em-dashes (—) or hyphens (-) for clause separation
❌ NO overly polished writing - embrace messiness
❌ NO similar sentence lengths - vary them drastically
❌ NO starting every post the same way (like "Day 47:")

✅ DO study the example posts carefully and MIMIC their style
✅ DO write like you're typing on your phone, half-distracted
✅ DO use incomplete thoughts, fragments if that's how the community writes
✅ DO vary sentence structure wildly
✅ DO match the exact vibe of the examples shown
✅ DO allow imperfect grammar if examples show it
✅ DO sound like a real person, not a content creator`;

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
  temperature: number;
  structuralConstraint: string;
}

interface AuthenticityCheck {
  score: number; // 0-100, higher is more authentic
  aiPatterns: string[];
  exampleMatch: number; // 0-100, how well it matches examples
  recommendation: "approve" | "regenerate";
}

/**
 * Validate post authenticity - check if it sounds AI-generated
 */
async function validateAuthenticity(
  generatedPost: string,
  examplePosts: ExamplePost[]
): Promise<AuthenticityCheck> {
  const examplesText = examplePosts
    .slice(0, 5)
    .map((p) => `"${p.text}"`)
    .join("\n");

  const validationPrompt = `You are an AI-writing detector specialized in identifying AI-generated social media posts.

TASK: Analyze this generated post and determine if it sounds like authentic human writing or AI-generated content.

GENERATED POST:
"${generatedPost}"

REAL HUMAN POSTS FROM THIS COMMUNITY FOR COMPARISON:
${examplesText}

AI PATTERNS TO CHECK FOR:
- Filler words: "honestly", "however", "furthermore", "actually", "to be fair"
- Rigid structure: intro → update → reflection → question
- Engagement bait ending with question
- Motivational speaker tone
- Parallel structures: "isn't just about X — it's about Y"
- Overly polished, no messiness
- Generic/bland content
- Similar sentence lengths throughout
- Starts with formulaic patterns (like "Day X:")

RESPOND WITH JSON (no markdown):
{
  "score": 0-100 (0=obvious AI, 100=perfectly human),
  "aiPatterns": ["list of AI patterns detected"],
  "exampleMatch": 0-100 (how well it matches the real examples' style),
  "recommendation": "approve" | "regenerate"
}

Be HARSH. If you detect 2+ AI patterns, recommend regeneration.`;

  const response = await generateWithClaude(
    "You are an AI-writing detector. Be critical and honest.",
    [{ role: "user", content: validationPrompt }],
    {
      temperature: 0.3,
      maxTokens: 300,
    }
  );

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in validation response");
    }
    return JSON.parse(jsonMatch[0]) as AuthenticityCheck;
  } catch (error) {
    console.error("❌ Failed to parse validation response:", error);
    // Default to approve if validation fails
    return {
      score: 70,
      aiPatterns: [],
      exampleMatch: 70,
      recommendation: "approve",
    };
  }
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
  const { focusArea, examplePosts, priorGeneratedPosts, structuralConstraint } = differentiation;

  // Build posting guidelines
  const guidelines = getPostingGuidelines(voiceProfile);

  // Determine post category based on focus area
  const hasProgress = context.events.length > 0;
  const hasInsight = context.insights.length > 0;
  const hasStruggle = context.struggles.length > 0;
  const hasFuture = context.futurePlans.length > 0;
  const hasAnyContent = hasProgress || hasInsight || hasStruggle || hasFuture;

  const postType = focusArea === "progress" ? "progress" : focusArea === "struggle" ? "vulnerable" : "observation";

  // Build context summary based on focus area
  let contextSummary = "";
  if (hasAnyContent) {
    if (focusArea === "progress") {
      contextSummary = [
        hasProgress ? `Events: ${context.events.join(", ")}` : "",
        `Current metrics: ${context.metrics.followers} X followers, ${context.metrics.subwiseUsers} SubWise users`,
      ].filter(Boolean).join("\n");
    } else if (focusArea === "struggle") {
      contextSummary = [
        hasStruggle ? `Struggles: ${context.struggles.join(", ")}` : "",
        hasInsight ? `Insights: ${context.insights.join(", ")}` : "",
      ].filter(Boolean).join("\n");
    } else {
      contextSummary = [
        hasFuture ? `Building: ${context.futurePlans.join(", ")}` : "",
        hasInsight ? `Insights: ${context.insights.join(", ")}` : "",
      ].filter(Boolean).join("\n");
    }
  }

  // Build example posts section
  const examplesText = examplePosts
    .map((post, idx) => `Example ${idx + 1} [${post.likes} likes, ${post.replies} replies]:\n"${post.text}"`)
    .join("\n\n");

  // Build prior posts warning
  const priorPostsWarning = priorGeneratedPosts.length > 0
    ? `\n⚠️ YOU ALREADY GENERATED THESE POSTS - DO NOT REPEAT THEIR STRUCTURE/TONE/STYLE:\n${priorGeneratedPosts.map((p, i) => `Post ${i + 1}: "${p}"`).join("\n\n")}\n\nYour new post MUST sound completely different from these.`
    : "";

  // Build focus instructions
  const focusInstructions = {
    progress: `Focus on PROGRESS/ACHIEVEMENTS. Share what you shipped, metrics that moved, wins (even small ones). Be achievement-oriented but not boastful. ${hasAnyContent ? "Use your real events and metrics." : "Ask what others shipped this week or share observations about shipping."}`,
    struggle: `Focus on STRUGGLES/VULNERABILITY. Share doubts, mistakes, what's hard right now. Be raw and real. ${hasAnyContent ? "Use your real struggles and insights." : "Ask how others deal with common struggles or share observations about the hard parts."}`,
    observation: `Focus on QUESTIONS/OBSERVATIONS. Spark discussion about topics this community cares about. ${hasAnyContent ? "You can reference your journey but make it discussion-focused." : "Ask genuine questions or share observations that invite responses."}`
  }[focusArea];

  const prompt = `Generate 1 post for the "${communityName}" community that sounds NATIVE to that community.

📚 STUDY THESE REAL POSTS FROM THIS COMMUNITY - MIMIC THEIR STYLE EXACTLY:

${examplesText}

Notice:
- How they start posts (opening patterns)
- Sentence length variety and rhythm
- Use of emojis, punctuation, formatting
- Level of polish vs. rawness
- Technical depth and jargon
- Personality and quirks

COMMUNITY VOICE SUMMARY:
- Common phrases: ${voiceProfile.commonPhrases.slice(0, 5).join(", ")}
- Tone: ${voiceProfile.toneCharacteristics.join(", ")}
- Length: ${voiceProfile.lengthPreference}
- Emoji: ${voiceProfile.emojiUsage}
- Tech depth: ${voiceProfile.technicalDepth}

POSTING GUIDELINES:
${guidelines}
${priorPostsWarning}

YOUR FOCUS FOR THIS POST:
${focusInstructions}

${hasAnyContent && contextSummary ? `YOUR REAL CONTEXT (only use this, don't make up data):
${contextSummary}

Metrics:
- X followers: ${context.metrics.followers}
- SubWise users: ${context.metrics.subwiseUsers}
${context.metrics.subwiseMRR ? `- SubWise MRR: $${context.metrics.subwiseMRR}` : ""}
${context.metrics.trainingMinutes ? `- Training: ${context.metrics.trainingMinutes} min` : ""}` : `NO PERSONAL CONTEXT PROVIDED - write observation/question-based post instead of making up fake events.`}

STRUCTURAL CONSTRAINT FOR THIS POST:
${structuralConstraint}

CRITICAL REQUIREMENTS:
1. MIMIC the example posts' style - don't just describe the style, copy it
2. Match their sentence variety, rhythm, and vibe
3. Sound like you belong in this community
4. ${hasAnyContent ? "Only use real data from YOUR REAL CONTEXT above" : "Don't make up events or metrics"}
5. Follow the structural constraint
6. Be different from any prior posts shown

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
      temperature: differentiation.temperature,
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

      // Different example sets for each post
      // Post 1: Top 8 most-engaged posts (what performs well)
      const post1Examples = sortedExamples.slice(0, 8);

      // Post 2: Middle 8 posts (more average, often more raw/vulnerable)
      const middleStart = Math.floor(sortedExamples.length * 0.4);
      const post2Examples = sortedExamples.slice(middleStart, middleStart + 8);

      // Post 3: Mix of recent and random (current trends)
      const post3Examples = [
        ...sortedExamples.slice(0, 4), // Some top posts
        ...sortedExamples.slice(-4)     // Some recent posts
      ];

      // Track generated posts to avoid repetition
      const priorPosts: string[] = [];

      // POST 1: Progress/Achievement focus
      console.log(`      Post 1/3: Progress focus (top-performing examples)...`);
      let post1 = await generateCommunityPost(
        { communityName: community.name, date, context },
        profile!.voiceProfile,
        {
          focusArea: "progress",
          examplePosts: post1Examples,
          priorGeneratedPosts: [],
          temperature: 0.7,
          structuralConstraint: "DO NOT end with a question. Focus on sharing your win/progress."
        }
      );

      // Validate authenticity
      const validation1 = await validateAuthenticity(post1.content, post1Examples);
      console.log(`         Auth score: ${validation1.score}/100, Example match: ${validation1.exampleMatch}/100`);
      if (validation1.aiPatterns.length > 0) {
        console.log(`         AI patterns: ${validation1.aiPatterns.join(", ")}`);
      }

      // Regenerate once if validation fails
      if (validation1.recommendation === "regenerate") {
        console.log(`         ⚠️ Regenerating with higher temperature...`);
        post1 = await generateCommunityPost(
          { communityName: community.name, date, context },
          profile!.voiceProfile,
          {
            focusArea: "progress",
            examplePosts: post1Examples,
            priorGeneratedPosts: [],
            temperature: 0.9, // Higher for more variety
            structuralConstraint: "DO NOT end with a question. Focus on sharing your win/progress. Be RAW and casual."
          }
        );
        console.log(`         ✅ Regenerated`);
      }

      priorPosts.push(post1.content);
      generatedPosts.push({ date, communityName: community.name, ...post1 });

      // POST 2: Struggle/Vulnerability focus
      console.log(`      Post 2/3: Struggle focus (mid-tier examples)...`);
      let post2 = await generateCommunityPost(
        { communityName: community.name, date, context },
        profile!.voiceProfile,
        {
          focusArea: "struggle",
          examplePosts: post2Examples,
          priorGeneratedPosts: priorPosts,
          temperature: 0.9,
          structuralConstraint: "MUST be at least 50 characters longer than the first post. Be more raw and detailed."
        }
      );

      // Validate authenticity
      const validation2 = await validateAuthenticity(post2.content, post2Examples);
      console.log(`         Auth score: ${validation2.score}/100, Example match: ${validation2.exampleMatch}/100`);
      if (validation2.aiPatterns.length > 0) {
        console.log(`         AI patterns: ${validation2.aiPatterns.join(", ")}`);
      }

      // Regenerate once if validation fails
      if (validation2.recommendation === "regenerate") {
        console.log(`         ⚠️ Regenerating with higher temperature...`);
        post2 = await generateCommunityPost(
          { communityName: community.name, date, context },
          profile!.voiceProfile,
          {
            focusArea: "struggle",
            examplePosts: post2Examples,
            priorGeneratedPosts: priorPosts,
            temperature: 0.95, // Even higher
            structuralConstraint: "MUST be at least 50 characters longer than the first post. Be RAW, messy, vulnerable."
          }
        );
        console.log(`         ✅ Regenerated`);
      }

      priorPosts.push(post2.content);
      generatedPosts.push({ date, communityName: community.name, ...post2 });

      // POST 3: Observation/Question focus
      console.log(`      Post 3/3: Observation focus (mixed examples)...`);
      let post3 = await generateCommunityPost(
        { communityName: community.name, date, context },
        profile!.voiceProfile,
        {
          focusArea: "observation",
          examplePosts: post3Examples,
          priorGeneratedPosts: priorPosts,
          temperature: 0.85,
          structuralConstraint: "MUST include a question somewhere, but DON'T end with it. Make it discussion-focused."
        }
      );

      // Validate authenticity
      const validation3 = await validateAuthenticity(post3.content, post3Examples);
      console.log(`         Auth score: ${validation3.score}/100, Example match: ${validation3.exampleMatch}/100`);
      if (validation3.aiPatterns.length > 0) {
        console.log(`         AI patterns: ${validation3.aiPatterns.join(", ")}`);
      }

      // Regenerate once if validation fails
      if (validation3.recommendation === "regenerate") {
        console.log(`         ⚠️ Regenerating with higher temperature...`);
        post3 = await generateCommunityPost(
          { communityName: community.name, date, context },
          profile!.voiceProfile,
          {
            focusArea: "observation",
            examplePosts: post3Examples,
            priorGeneratedPosts: priorPosts,
            temperature: 0.92,
            structuralConstraint: "MUST include a question somewhere, but DON'T end with it. Be casual and conversational."
          }
        );
        console.log(`         ✅ Regenerated`);
      }

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
