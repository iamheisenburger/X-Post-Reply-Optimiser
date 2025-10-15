import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface ThreadInput {
  date: string;
  challengeDay: number;
  wins: string[];
  lessons: string[];
  struggles: string[];
  tomorrowFocus: string[];
  futurePlans: string[];
  metrics: {
    followers: number;
    subwiseUsers: number;
    subwiseMRR?: number;
    trainingMinutes?: number;
  };
}

interface GeneratedThread {
  date: string;
  content: string;
  algorithmScore: number;
  scoreBreakdown: {
    hookStrength: number;
    conversationTrigger: number;
    specificity: number;
    authenticity: number;
  };
  suggestMedia: boolean;
  mediaType?: string;
  mediaSuggestions?: string;
}

const SYSTEM_PROMPT = `You're documenting a 30-day growth challenge. This is your END OF DAY reflection thread.

WHO YOU ARE:
- Aspiring pro MMA fighter (injured, studying technique)
- Building SubWise (subscription tracker) from 0 to 100 users
- Growing 3 → 250 X followers in 30 days
- Documenting everything raw and honest

HOOK (FIRST TWEET) - CRITICAL:
Don't start with "Day X/30: Started with Y followers..."
That's boring. Hook them with:
- A raw observation ("Spent 6 hours on a bug that should've taken 30 min...")
- A vulnerable truth ("Zero progress today. Literally zero...")
- A surprising metric ("7 followers gained. Lost 3. Net: +4. This is brutal...")
- A specific moment ("Realized at 2am I've been building the wrong feature...")

THREAD FLOW (5-8 tweets total):
1. Hook - Make them WANT to read more
2-6. Story - What happened, numbers, lessons, struggles, plans
7-8. Close - Question or invitation to follow

STYLE:
• Natural, like texting a friend
• Use real data, real moments
• Short tweets (80-180 chars)
• Vulnerable, not polished
• NO "Day X update" openings
• NO motivational clichés
• Tell a story, don't report metrics

Make it feel like someone's actual diary, not a performance.`;

function scoreThread(content: string): {
  algorithmScore: number;
  scoreBreakdown: {
    hookStrength: number;
    conversationTrigger: number;
    specificity: number;
    authenticity: number;
  };
} {
  const tweets = content.split('\n\n');
  const firstTweet = tweets[0] || content.substring(0, 200);

  let hookStrength = 50;
  if (/Day \d+/.test(firstTweet)) hookStrength += 20;
  if (/\d+/.test(firstTweet)) hookStrength += 15;
  if (/[!?]/.test(firstTweet)) hookStrength += 15;
  hookStrength = Math.min(100, hookStrength);

  let conversationTrigger = 40;
  if (/\?/.test(content)) conversationTrigger += 25;
  if (/\b(you|your|anyone)\b/i.test(content)) conversationTrigger += 20;
  if (/\b(follow|watch|join|track)\b/i.test(content)) conversationTrigger += 15;
  conversationTrigger = Math.min(100, conversationTrigger);

  let specificity = 30;
  const numberMatches = content.match(/\d+/g);
  if (numberMatches) specificity += Math.min(50, numberMatches.length * 8);
  if (/\d+\s*(followers|users|min|hours|days)/.test(content)) specificity += 20;
  specificity = Math.min(100, specificity);

  let authenticity = 50;
  if (/\b(I|my|me)\b/i.test(content)) authenticity += 15;
  if (/\b(failed|struggle|hard|difficult|challenge|tired)\b/i.test(content)) authenticity += 20;
  if (/\b(learned|realized|discovered)\b/i.test(content)) authenticity += 15;
  authenticity = Math.min(100, authenticity);

  const algorithmScore = Math.round(
    hookStrength * 0.35 +
    conversationTrigger * 0.20 +
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

function buildPrompt(input: ThreadInput): string {
  const { wins, lessons, struggles, tomorrowFocus, futurePlans, metrics, challengeDay } = input;

  const winsList = wins.length > 0 ? wins.map((w, i) => `${i + 1}. ${w}`).join('\n') : "Nothing yet";
  const lessonsList = lessons.length > 0 ? lessons.map((l, i) => `${i + 1}. ${l}`).join('\n') : "No lessons yet";
  const strugglesList = struggles.length > 0 ? struggles.map((s, i) => `${i + 1}. ${s}`).join('\n') : "No struggles logged";
  const tomorrowList = tomorrowFocus.length > 0 ? tomorrowFocus.map((t, i) => `${i + 1}. ${t}`).join('\n') : "Not planned yet";
  const futureList = futurePlans.length > 0 ? futurePlans.map((p, i) => `${i + 1}. ${p}`).join('\n') : "No future plans";

  return `Generate a thread for Day ${challengeDay} of the 30-day challenge.

TODAY'S WINS:
${winsList}

WHAT I LEARNED:
${lessonsList}

WHAT WAS HARD:
${strugglesList}

TOMORROW'S FOCUS:
${tomorrowList}

FUTURE PLANS:
${futureList}

TODAY'S METRICS (use these exact numbers):
- X Followers: ${metrics.followers}
- SubWise Users: ${metrics.subwiseUsers}
- SubWise MRR: $${metrics.subwiseMRR || 0}
- Training: ${metrics.trainingMinutes || 0} min

CHALLENGE GOAL: 3 → 250 followers in 30 days (Day ${challengeDay})

Write a 5-8 tweet thread about today. Use the actual wins/lessons/struggles above. Make it a STORY, not a report.

CRITICAL RULES:
1. First tweet = STRONG HOOK (no "Day X/30" bullshit)
2. Each tweet separated by blank line
3. 5-8 tweets total (not always 8, pick what fits the story)
4. Sound like texting a friend, not writing a blog

HOOK IDEAS:
- Lead with a specific moment from today
- Start with a number that surprises
- Open with a vulnerable truth
- Begin with what went wrong

FORMAT:
[Hook tweet - grab attention]

[Build the story - what happened]

[The numbers - but weave them in naturally]

[What you learned or realized]

[What was hard or unexpected]

[Tomorrow or next move]

[Question to audience]

Each tweet: 80-180 chars. Natural language. Real moments. Blank line between tweets.

MEDIA (if it fits):
MEDIA: [yes/no - if yes, describe what]

Make it feel REAL. Like someone actually documenting their journey, not performing for an audience.`;
}

function parseThread(response: string, date: string): GeneratedThread | null {
  // Extract thread content (everything before MEDIA line)
  const mediaMatch = response.match(/MEDIA:\s*(yes|no)(?:\s*-?\s*([^\n]+))?/i);
  
  const content = mediaMatch 
    ? response.substring(0, mediaMatch.index).trim()
    : response.trim();

  if (!content) return null;

  const hasMedia = mediaMatch ? mediaMatch[1].toLowerCase() === 'yes' : false;
  const mediaSuggestions = hasMedia && mediaMatch && mediaMatch[2] ? mediaMatch[2].trim() : undefined;
  const mediaType = hasMedia ? 'metrics_screenshot' : undefined;

  const scoring = scoreThread(content);

  return {
    date,
    content,
    ...scoring,
    suggestMedia: hasMedia,
    mediaType,
    mediaSuggestions,
  };
}

export async function POST(request: NextRequest) {
  try {
    const input: ThreadInput = await request.json();

    console.log('🧵 Generating thread for Day', input.challengeDay);
    console.log('Wins:', input.wins);
    console.log('Lessons:', input.lessons);
    console.log('Metrics:', input.metrics);

    const prompt = buildPrompt(input);

    // Call Claude Sonnet 4.5 (latest) with temp 0.8 for human output
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
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

    const thread = parseThread(responseText, input.date);

    if (!thread) {
      throw new Error('Failed to parse thread from Claude response');
    }

    console.log('\n✅ Generated thread');
    console.log(`  Score: ${thread.algorithmScore}/100`);
    console.log(`  Length: ${thread.content.length} chars`);
    console.log(`  Tweets: ~${thread.content.split('\n\n').length}`);

    return NextResponse.json({
      thread,
      success: true,
    });

  } catch (error) {
    console.error('Error generating thread:', error);
    return NextResponse.json(
      { error: 'Failed to generate thread', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
