import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { validatePostBatch, getImprovementInstructions } from "@/lib/post-quality-validator";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MAX_ATTEMPTS = 3; // Iterate up to 3 times for quality

interface DailyInput {
  date: string;
  challengeDay?: number; // Optional - will calculate if not provided
  events: string[];
  insights: string[];
  struggles: string[];
  futurePlans?: string[];
  metrics: {
    followers: number;
    subwiseUsers: number;
    subwiseMRR?: number;
    trainingMinutes?: number;
  };
}

interface GeneratedPost {
  date: string;
  content: string;
  category: string;
  postType: string;
  algorithmScore: number;
  scoreBreakdown: {
    hookStrength: number;
    conversationTrigger: number;
    specificity: number;
    authenticity: number;
  };
  suggestMedia: boolean;
  mediaType?: string;
}

const SYSTEM_PROMPT = `You are an X (Twitter) post expert who creates engaging, algorithm-optimized posts for a 30-day growth challenge.

X ALGORITHM FOR ORIGINAL POSTS:
• Posts with images/videos: 2x boost
• Posts with questions: +conversation replies (+13.5x weight)
• Posts with data/numbers: +credibility (+8 likes, +5 profile clicks)
• Posts with personal experience: +10 likes (relatability)
• Short posts (<280 chars): +5 likes (readability)
• Controversial takes: +3 profile clicks ("Who is this guy?")

POST CATEGORIES:
1. MMA - Training updates, discipline lessons, fighter mindset
2. SubWise - Building in public, metrics, failures, wins
3. XGrowth - The growth challenge itself, predicted vs actual
4. Philosophy - Lessons from training → business, mindset

POST TYPES:
1. Progress Update - Data-driven (Day X: A→B, learned Y)
2. Contrarian Take - Challenge common belief with evidence
3. Lesson Learned - "X weeks ago believed A. Now know B because C."
4. Thread Starter - Hook + "🧵 Let me explain:" (teaser)
5. Behind-the-Scenes - Photo suggestion + what you're doing now

CRITICAL RULES:
• Mix categories (2 SubWise, 2 MMA, 1 philosophy)
• Mix tones (2 inspirational, 2 educational, 1 vulnerable)
• Mix formats (3 text-only, 1 thread starter, 1 visual suggestion)
• ALWAYS include specific numbers/data when available
• NO fake expertise - only claim what's verified
• Transparency is your edge: "I'm documenting everything publicly"

Your user context:
- Aspiring pro MMA fighter
- Building SubWise (subscription tracker) to 100 users
- Currently: 3 → 250 followers in 30 days challenge
- Documenting everything with predicted vs actual charts
- Posting 5x/day + 20 replies/day`;

function scorePost(post: string): {
  algorithmScore: number;
  scoreBreakdown: {
    hookStrength: number;
    conversationTrigger: number;
    specificity: number;
    authenticity: number;
  };
} {
  // Hook strength (first 10 words)
  const firstWords = post.split(' ').slice(0, 10).join(' ');
  let hookStrength = 50;
  if (/\d+/.test(firstWords)) hookStrength += 15; // Numbers in hook
  if (/[!?]/.test(firstWords)) hookStrength += 10; // Punctuation
  if (/(Day|Week) \d+/.test(firstWords)) hookStrength += 15; // Progress indicator
  if (/(Everyone|Most people|They say)/.test(firstWords)) hookStrength += 10; // Contrarian signal
  hookStrength = Math.min(100, hookStrength);

  // Conversation trigger
  let conversationTrigger = 40;
  if (/\?/.test(post)) conversationTrigger += 25; // Has question
  if (/\b(but|actually|disagree|however|wrong|myth)\b/i.test(post)) conversationTrigger += 20; // Contrarian
  if (/\b(you|your)\b/i.test(post)) conversationTrigger += 15; // Direct address
  conversationTrigger = Math.min(100, conversationTrigger);

  // Specificity (numbers/data)
  let specificity = 30;
  const numberMatches = post.match(/\d+/g);
  if (numberMatches) specificity += Math.min(40, numberMatches.length * 10);
  if (/\d+[%x]|\$\d+|\d+\s*(users|people|times|days|min|hours|followers)/.test(post)) specificity += 20;
  if (/\b(I|my|when I|in my)\b/i.test(post)) specificity += 10; // Personal
  specificity = Math.min(100, specificity);

  // Authenticity
  let authenticity = 50;
  if (/\b(I|my|me)\b/i.test(post)) authenticity += 15; // First person
  if (/\b(failed|struggle|hard|difficult|challenge)\b/i.test(post)) authenticity += 20; // Vulnerability
  if (/\b(realized|learned|discovered|found)\b/i.test(post)) authenticity += 15; // Growth
  authenticity = Math.min(100, authenticity);

  // Overall score (weighted average)
  const algorithmScore = Math.round(
    hookStrength * 0.3 +
    conversationTrigger * 0.25 +
    specificity * 0.25 +
    authenticity * 0.20
  );

  return {
    algorithmScore,
    scoreBreakdown: {
      hookStrength: Math.round(hookStrength),
      conversationTrigger: Math.round(conversationTrigger),
      specificity: Math.round(specificity),
      authenticity: Math.round(authenticity),
    },
  };
}

function buildPrompt(input: DailyInput): string {
  const { events, insights, struggles, futurePlans, metrics, challengeDay } = input;

  const eventsList = events.length > 0 ? events.map((e, i) => `${i + 1}. ${e}`).join('\n') : "No events logged";
  const insightsList = insights.length > 0 ? insights.map((i, idx) => `${idx + 1}. ${i}`).join('\n') : "No insights logged";
  const strugglesList = struggles.length > 0 ? struggles.map((s, i) => `${i + 1}. ${s}`).join('\n') : "No struggles logged";
  const futurePlansList = futurePlans && futurePlans.length > 0 ? futurePlans.map((p, i) => `${i + 1}. ${p}`).join('\n') : "No future plans logged";

  // Use provided challenge day or calculate from assumed start date
  const daysInto = challengeDay || 1;

  const prevFollowers = Math.max(3, metrics.followers - Math.floor(Math.random() * 3)); // Estimate previous
  const followerDelta = metrics.followers - prevFollowers;

  return `Generate 5 X posts for ${challengeDay ? `Day ${daysInto} of the journey` : 'today'}.

YESTERDAY'S EVENTS:
${eventsList}

INSIGHTS LEARNED:
${insightsList}

STRUGGLES:
${strugglesList}

FUTURE PLANS (What I'm building/adding next):
${futurePlansList}

CURRENT METRICS (as of today):
- X Followers: ${metrics.followers} (was ~${prevFollowers} yesterday, ${followerDelta >= 0 ? '+' : ''}${followerDelta})
- SubWise Users: ${metrics.subwiseUsers}
- SubWise MRR: $${metrics.subwiseMRR || 0}
- Training: ${metrics.trainingMinutes || 0} min

GOAL: 3 → 250 followers in 30 days

GENERATE 5 POSTS:
1. Progress Update (SubWise) - Show metrics + insight
2. Contrarian Take (Philosophy) - Challenge common belief
3. Behind-the-Scenes (MMA) - Training update with photo suggestion
4. Lesson Learned (SubWise) - What you discovered building
5. Thread Starter (XGrowth) - Tease predicted vs actual analysis

REQUIREMENTS:
- Use the EXACT metrics above (don't make up numbers)
- Reference specific events/insights from the input
- Mix tones: inspirational, educational, vulnerable
- 2-3 should have questions to drive conversation
- Include data/numbers in at least 3 posts
- Suggest photos for 1-2 posts (training or screenshot)
- Keep each under 280 characters
- Make them authentic - this is a real journey

OUTPUT FORMAT (MUST FOLLOW EXACTLY):

POST 1 - CATEGORY: [mma/subwise/xgrowth/philosophy], TYPE: [progress/contrarian/lesson/thread_starter/bts]:
[Post text here - just the tweet, no extra labels]
MEDIA: [yes/no - if yes, suggest type like "training_photo" or "screenshot"]

POST 2 - CATEGORY: [category], TYPE: [type]:
[Post text]
MEDIA: [yes/no]

POST 3 - CATEGORY: [category], TYPE: [type]:
[Post text]
MEDIA: [yes/no]

POST 4 - CATEGORY: [category], TYPE: [type]:
[Post text]
MEDIA: [yes/no]

POST 5 - CATEGORY: [category], TYPE: [type]:
[Post text]
MEDIA: [yes/no]

Generate the 5 posts now. Use authentic voice, specific data, and variety.`;
}

function parsePosts(response: string, date: string): GeneratedPost[] {
  const posts: GeneratedPost[] = [];

  // More flexible regex - handles spaces and mixed case in category/type
  const postPattern = /POST\s+\d+\s*-\s*CATEGORY:\s*([^,]+),\s*TYPE:\s*([^:]+):\s*([\s\S]+?)(?=POST\s+\d+|$)/gi;

  const postMatches = [...response.matchAll(postPattern)];

  for (const match of postMatches) {
    const category = match[1].trim().toLowerCase().replace(/\s+/g, '');
    const postType = match[2].trim().toLowerCase().replace(/\s+/g, '_');
    const fullContent = match[3].trim();

    // Extract content and media info
    let content = fullContent;
    let hasMedia = false;
    let mediaType: string | undefined;

    // Check for media info after the content
    const mediaMatch = /MEDIA:\s*(yes|no)(?:\s*-\s*([^\n]+))?/i.exec(fullContent);
    if (mediaMatch) {
      // Remove MEDIA line from content
      content = fullContent.substring(0, mediaMatch.index).trim();
      hasMedia = mediaMatch[1].toLowerCase() === 'yes';
      mediaType = hasMedia && mediaMatch[2] ? mediaMatch[2].trim() : hasMedia ? 'photo' : undefined;
    } else {
      // Check if MEDIA is on the next line
      const textAfter = response.substring(match.index + match[0].length, match.index + match[0].length + 50);
      const nextMediaMatch = /^\s*MEDIA:\s*(yes|no)(?:\s*-\s*([^\n]+))?/i.exec(textAfter);
      if (nextMediaMatch) {
        hasMedia = nextMediaMatch[1].toLowerCase() === 'yes';
        mediaType = hasMedia && nextMediaMatch[2] ? nextMediaMatch[2].trim() : hasMedia ? 'photo' : undefined;
      }
    }

    if (content.length > 10) { // Only add if there's actual content
      const scoring = scorePost(content);

      posts.push({
        date,
        content,
        category,
        postType,
        ...scoring,
        suggestMedia: hasMedia,
        mediaType,
      });
    }
  }

  return posts;
}

export async function POST(request: NextRequest) {
  try {
    // Check API key first
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY is not set!');
      return NextResponse.json(
        { error: 'API key not configured', details: 'ANTHROPIC_API_KEY environment variable is missing' },
        { status: 500 }
      );
    }

    const input: DailyInput = await request.json();

    console.log('🚀 Starting POST GENERATION with quality iteration');
    console.log('   Date:', input.date);
    console.log('   Challenge Day:', input.challengeDay || 'N/A');
    console.log('   Events:', input.events.length);
    console.log('   Insights:', input.insights.length);
    console.log('   Metrics:', input.metrics);

    // Allowed claims (what you can authentically claim)
    const allowedClaims = [
      `${input.metrics.followers} followers`,
      `${input.metrics.subwiseUsers} users`,
      'Day ' + (input.challengeDay || 1),
      '0 users', // You're at 0
      '7 followers', // Current state
    ];

    let attemptNumber = 0;
    let posts: GeneratedPost[] = [];
    let lastClaudeResponse = '';
    let qualityPassed = false;

    // QUALITY ITERATION LOOP (like reply generator)
    while (attemptNumber < MAX_ATTEMPTS && !qualityPassed) {
      attemptNumber++;

      console.log(`\n${"=".repeat(60)}`);
      console.log(`🔄 ATTEMPT ${attemptNumber}/${MAX_ATTEMPTS}`);
      console.log(`${"=".repeat(60)}`);

      // Build messages array for Claude
      const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

      // First attempt: Just the prompt
      if (attemptNumber === 1) {
        const prompt = buildPrompt(input);
        messages.push({ role: "user", content: prompt });
      } else {
        // Subsequent attempts: Include previous response + feedback
        const prompt = buildPrompt(input);
        messages.push({ role: "user", content: prompt });
        messages.push({ role: "assistant", content: lastClaudeResponse });

        // Add quality feedback
        const validationResult = validatePostBatch(
          posts.map(p => ({ content: p.content, category: p.category })),
          allowedClaims
        );

        const feedback = validationResult.reports
          .map((report, idx) => {
            if (!report.passed) {
              return `\n❌ POST ${idx + 1} ISSUES (score: ${report.score}/100):\n${getImprovementInstructions(report)}`;
            }
            return '';
          })
          .filter(f => f)
          .join('\n');

        messages.push({
          role: "user",
          content: `${feedback}\n\n🔧 REGENERATE all 5 posts with these fixes. Be SPECIFIC, AUTHENTIC, and DATA-DRIVEN!`
        });

        console.log('📝 Sending quality feedback to Claude...');
      }

      // Call Claude
      console.log('📤 Calling Claude API...');
      const message = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2000,
        temperature: 0.8,
        system: SYSTEM_PROMPT,
        messages,
      });

      console.log('✅ Claude responded');

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      lastClaudeResponse = responseText;

      // Parse posts
      posts = parsePosts(responseText, input.date);

      if (posts.length === 0) {
        console.error('❌ No posts parsed');
        continue; // Try again
      }

      console.log(`   Parsed ${posts.length} posts`);

      // QUALITY VALIDATION
      const validationResult = validatePostBatch(
        posts.map(p => ({ content: p.content, category: p.category })),
        allowedClaims
      );

      console.log(`   Quality: ${validationResult.allPassed ? '✅ PASSED' : '⚠️ FAILED'}`);
      console.log(`   Average score: ${validationResult.averageScore}/100`);

      validationResult.reports.forEach((report, idx) => {
        const status = report.passed ? '✅' : '❌';
        console.log(`   Post ${idx + 1}: ${status} ${report.score}/100`);
        if (!report.passed && report.issues.length > 0) {
          console.log(`      Issues: ${report.issues.join(', ')}`);
        }
      });

      qualityPassed = validationResult.allPassed;

      if (qualityPassed) {
        console.log(`\n✅ QUALITY PASSED on attempt ${attemptNumber}!`);
        break;
      } else if (attemptNumber < MAX_ATTEMPTS) {
        console.log(`\n⚠️  Quality failed, iterating... (${attemptNumber}/${MAX_ATTEMPTS})`);
      }
    }

    // Final results
    console.log(`\n📋 FINAL RESULTS:`);
    console.log(`   Attempts: ${attemptNumber}`);
    console.log(`   Quality: ${qualityPassed ? 'PASSED' : 'ACCEPTABLE'}`);
    console.log(`   Posts: ${posts.length}`);

    if (posts.length === 0) {
      return NextResponse.json(
        {
          error: 'Failed to generate posts',
          details: 'No posts could be parsed after ' + attemptNumber + ' attempts',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      posts,
      success: true,
      qualityReport: {
        passed: qualityPassed,
        attempts: attemptNumber,
      },
    });

  } catch (error) {
    console.error('Error generating posts:', error);
    return NextResponse.json(
      { error: 'Failed to generate posts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
