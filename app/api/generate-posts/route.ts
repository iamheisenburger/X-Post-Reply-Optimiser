import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface DailyInput {
  date: string;
  challengeDay?: number;
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

const SYSTEM_PROMPT = `You're a real person documenting a 30-day growth challenge. Not a guru, not an expert - just someone building in public with brutal honesty.

WHAT WORKS ON X:
• Questions = more replies
• Real numbers = more credibility  
• Vulnerability = more connection
• Photos/screenshots = more engagement
• Controversial takes = more profile clicks (but risky)

WHO YOU ARE:
- Aspiring pro MMA fighter (currently injured, studying technique)
- Building SubWise (subscription tracker) from 0 to 100 users
- Growing 3 → 250 X followers in 30 days
- Documenting EVERYTHING: wins, failures, metrics, struggles
- No BS, no filters - raw data and real lessons

POST MIX (5 posts):
1. SubWise progress - actual metrics, what you learned
2. MMA/training - discipline, technique, injuries, mindset
3. Philosophy - lessons from training → business
4. Growth challenge - predicted vs actual, transparency
5. Wild card - whatever feels authentic today

STYLE:
• Short and punchy (under 280 chars)
• Use real data from today's inputs
• First person ("I", "my") - this is YOUR journey
• Questions when it feels natural
• NO generic advice, NO fake expertise
• Transparency is your superpower

This is a real challenge. Make the posts feel human, not robotic.`;

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
  if (/\d+/.test(firstWords)) hookStrength += 15;
  if (/[!?]/.test(firstWords)) hookStrength += 10;
  if (/(Day|Week) \d+/.test(firstWords)) hookStrength += 15;
  if (/(Everyone|Most people|They say)/.test(firstWords)) hookStrength += 10;
  hookStrength = Math.min(100, hookStrength);

  // Conversation trigger
  let conversationTrigger = 40;
  if (/\?/.test(post)) conversationTrigger += 25;
  if (/\b(but|actually|disagree|however|wrong|myth)\b/i.test(post)) conversationTrigger += 20;
  if (/\b(you|your)\b/i.test(post)) conversationTrigger += 15;
  conversationTrigger = Math.min(100, conversationTrigger);

  // Specificity (numbers/data)
  let specificity = 30;
  const numberMatches = post.match(/\d+/g);
  if (numberMatches) specificity += Math.min(40, numberMatches.length * 10);
  if (/\d+[%x]|\$\d+|\d+\s*(users|people|times|days|min|hours|followers)/.test(post)) specificity += 20;
  if (/\b(I|my|when I|in my)\b/i.test(post)) specificity += 10;
  specificity = Math.min(100, specificity);

  // Authenticity
  let authenticity = 50;
  if (/\b(I|my|me)\b/i.test(post)) authenticity += 15;
  if (/\b(failed|struggle|hard|difficult|challenge)\b/i.test(post)) authenticity += 20;
  if (/\b(realized|learned|discovered|found)\b/i.test(post)) authenticity += 15;
  authenticity = Math.min(100, authenticity);

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

  const eventsList = events.length > 0 ? events.map((e, i) => `${i + 1}. ${e}`).join('\n') : "Nothing logged yet";
  const insightsList = insights.length > 0 ? insights.map((i, idx) => `${idx + 1}. ${i}`).join('\n') : "No insights yet";
  const strugglesList = struggles.length > 0 ? struggles.map((s, i) => `${i + 1}. ${s}`).join('\n') : "No struggles logged";
  const futurePlansList = futurePlans && futurePlans.length > 0 ? futurePlans.map((p, i) => `${i + 1}. ${p}`).join('\n') : "No plans added";

  return `Generate 5 posts for Day ${challengeDay || 1} of the 30-day challenge.

WHAT HAPPENED YESTERDAY:
${eventsList}

WHAT I LEARNED:
${insightsList}

WHAT WAS HARD:
${strugglesList}

WHAT I'M BUILDING/PLANNING:
${futurePlansList}

CURRENT METRICS (real numbers, don't change these):
- X Followers: ${metrics.followers}
- SubWise Users: ${metrics.subwiseUsers}
- SubWise MRR: $${metrics.subwiseMRR || 0}
- Training: ${metrics.trainingMinutes || 0} min

GOAL: 3 → 250 followers in 30 days

Generate 5 posts. Mix SubWise, MMA, philosophy, growth challenge. Keep it real, use actual data, sound human.

OUTPUT FORMAT:

POST 1 - CATEGORY: [mma/subwise/xgrowth/philosophy], TYPE: [progress/contrarian/lesson/thread_starter/bts]:
[The actual tweet text]
MEDIA: [yes/no - if yes, say what like "training_photo" or "metrics_screenshot"]

POST 2 - CATEGORY: [category], TYPE: [type]:
[Tweet text]
MEDIA: [yes/no]

POST 3 - CATEGORY: [category], TYPE: [type]:
[Tweet text]
MEDIA: [yes/no]

POST 4 - CATEGORY: [category], TYPE: [type]:
[Tweet text]
MEDIA: [yes/no]

POST 5 - CATEGORY: [category], TYPE: [type]:
[Tweet text]
MEDIA: [yes/no]

Keep it real:
- Use TODAY'S actual metrics (don't invent numbers)
- Reference what actually happened in events/insights  
- Mix it up: some vulnerable, some educational, some inspiring
- Questions are great but only if they feel natural
- Suggest photos when it makes sense (training, screenshots)
- Under 280 chars each
- Make them sound like a real person, not a bot`;
}

function parsePosts(response: string, date: string): GeneratedPost[] {
  const posts: GeneratedPost[] = [];
  
  // More flexible regex to handle variations
  const postPattern = /POST \d+ - CATEGORY:\s*([^,]+),\s*TYPE:\s*([^:]+):\s*(.+?)\s*MEDIA:\s*(yes|no)(?:\s*-?\s*([^\n]+))?/gis;

  const matches = [...response.matchAll(postPattern)];

  for (const match of matches) {
    const category = match[1].trim().toLowerCase().replace(/\s+/g, '');
    const postType = match[2].trim().toLowerCase().replace(/\s+/g, '');
    const content = match[3].trim();
    const hasMedia = match[4].toLowerCase() === 'yes';
    const mediaType = hasMedia && match[5] ? match[5].trim() : undefined;

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

  return posts;
}

export async function POST(request: NextRequest) {
  try {
    const input: DailyInput = await request.json();

    console.log('🚀 Generating posts for:', input.date);
    console.log('Events:', input.events);
    console.log('Insights:', input.insights);
    console.log('Metrics:', input.metrics);

    const prompt = buildPrompt(input);

    // Call Claude Sonnet with higher temperature for more human output
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      temperature: 0.8,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    console.log('\n📝 Claude response:', responseText);

    const posts = parsePosts(responseText, input.date);

    console.log(`\n✅ Generated ${posts.length} posts`);
    posts.forEach((post, i) => {
      console.log(`\nPost ${i + 1}:`);
      console.log(`  Category: ${post.category}`);
      console.log(`  Type: ${post.postType}`);
      console.log(`  Score: ${post.algorithmScore}/100`);
      console.log(`  Content: ${post.content.substring(0, 80)}...`);
    });

    return NextResponse.json({
      posts,
      success: true,
    });

  } catch (error) {
    console.error('Error generating posts:', error);
    return NextResponse.json(
      { error: 'Failed to generate posts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
