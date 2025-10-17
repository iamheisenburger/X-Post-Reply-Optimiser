import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

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

interface ThreadsContextData {
  challengeInfo: {
    startDate: string;
    goal: string;
    currentDay: number;
  };
  recentReflections: Array<{
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
    };
  }>;
  keyMilestones: Array<{
    day: number;
    description: string;
    impact: string;
  }>;
}

function buildDynamicThreadPrompt(threadsContext: ThreadsContextData | null, currentDay: number, todayMetrics: { followers: number; subwiseUsers: number }): string {
  if (!threadsContext || threadsContext.recentReflections.length === 0) {
    // Fallback to basic prompt
    return `You're documenting your journey with complete transparency. This is your END OF DAY reflection thread.

THREAD PURPOSE:
- Reflect on what happened TODAY
- Share real metrics and progress
- Be vulnerable about struggles
- Document what you learned
- No fluff, no motivational BS - just raw honesty

THREAD STRUCTURE (5-8 tweets):
1. HOOK - Day ${currentDay} update with key observation
2. WHAT HAPPENED - Today's events (specific details)
3. THE NUMBERS - Current metrics
4. WHAT I LEARNED - Key insight or lesson
5. WHAT WAS HARD - Struggle or challenge faced
6-7. Additional context/learnings
8. CALL TO ACTION - Question or invitation

STYLE:
• Direct, conversational, human
• Use real data - don't make up numbers
• First person ("I", "my")
• Short tweets (100-200 chars each)
• Vulnerable when it's real

Make it feel like someone documenting their real journey.`;
  }

  // Extract recent journey context
  const recentDays = threadsContext.recentReflections.slice(-3);
  const recentLessons = recentDays.flatMap(d => d.lessons).slice(-3);
  const recentStruggles = recentDays.flatMap(d => d.struggles).slice(-3);
  const startFollowers = threadsContext.recentReflections[0]?.metrics.followers || todayMetrics.followers;

  return `You're documenting Day ${currentDay} of your challenge. This is your END OF DAY reflection thread.

YOUR CHALLENGE:
- ${threadsContext.challengeInfo.goal}
- Started: Day 1 with ${startFollowers} followers
- Current: Day ${currentDay} with ${todayMetrics.followers} followers (+${todayMetrics.followers - startFollowers})
- SubWise: ${todayMetrics.subwiseUsers} users

RECENT JOURNEY CONTEXT:
${recentLessons.length > 0 ? `Recent learnings:\n${recentLessons.map(l => `• ${l}`).join('\n')}` : '• Learning as you go'}

${recentStruggles.length > 0 ? `Recent struggles:\n${recentStruggles.map(s => `• ${s}`).join('\n')}` : '• Facing challenges daily'}

${threadsContext.keyMilestones.length > 0 ? `Key milestones so far:\n${threadsContext.keyMilestones.map(m => `• Day ${m.day}: ${m.description}`).join('\n')}` : ''}

THREAD PURPOSE:
- Reflect on what happened TODAY (Day ${currentDay})
- Share REAL metrics and progress
- Be vulnerable about struggles
- Document what you learned
- No fluff, no motivational BS - just raw honesty

THREAD STRUCTURE (5-8 tweets):
1. HOOK - "Day ${currentDay}/30 Challenge" + compelling observation/metric/moment
2. WHAT HAPPENED - Today's events (specific details from input)
3. THE NUMBERS - Current metrics (${todayMetrics.followers} followers, ${todayMetrics.subwiseUsers} users)
4. WHAT I LEARNED - Key insight or lesson from today
5. WHAT WAS HARD - Struggle or challenge faced today
6-7. Additional reflections/context (if needed)
8. CALL TO ACTION - Question or invitation to follow journey

CRITICAL AUTHENTICITY RULES:
✅ Use EXACT current metrics (${todayMetrics.followers} followers, ${todayMetrics.subwiseUsers} users)
✅ Reference recent lessons and struggles listed above for context
✅ Stay truthful to actual progress: +${todayMetrics.followers - startFollowers} followers over ${currentDay} days
❌ Don't invent fake metrics or multipliers
❌ Don't make up experiences not in the input
❌ Don't claim expertise you don't have

STYLE:
• Direct, conversational, human
• Use real data from today's input
• First person ("I", "my")
• Each tweet: 100-200 characters (NOT one-liners)
• Multiple sentences per tweet is encouraged
• Vulnerable when it's real
• NO generic advice, NO motivational quotes

Generate between 5-8 tweets TOTAL (not 16, not 20 - just 5-8 substantial tweets).

Make it feel like someone documenting their real journey, not a content creator performing.`;
}

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

CHALLENGE GOAL: 3 → 250 followers in 30 days

Write a 5-8 tweet thread reflecting on Day ${challengeDay}. Use the actual wins/lessons/struggles above. Be honest, specific, human.

CRITICAL RULES:
1. Generate 5-8 tweets TOTAL (not 16, not 20 - just 5-8 substantial tweets)
2. Each tweet should be 100-200 characters of content (NOT one-liners)
3. Each tweet MUST be separated by a blank line (double line break)

HOOK (First Tweet):
Professional format: "Day ${challengeDay}/30 Challenge" or "Day ${challengeDay}/30" followed by the main point.
Make it compelling but professional.

Example structure:
Tweet 1: "Day ${challengeDay}/30 Challenge: [compelling observation/metric/moment]"
Tweet 2: What happened today (context)
Tweet 3: The actual numbers
Tweet 4: Key lesson learned
Tweet 5: What was difficult
Tweet 6: Tomorrow's plan
Tweet 7-8: Question to audience (optional)

IMPORTANT: Each tweet should be a full thought (100-200 chars), NOT single sentences. Multiple sentences per tweet is fine and encouraged.

MEDIA SUGGESTION (if it makes sense):
After the thread, add on a new line: MEDIA: [yes/no - if yes, suggest what image]

Keep it authentic. Remember: blank line between each tweet!`;
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

    // Fetch dynamic challenge context from Convex
    console.log('📚 Fetching dynamic challenge context from Convex...');
    const threadsContext = await fetchQuery(api.contextManagement.getThreadsContext);
    console.log(`✅ Threads context loaded: ${threadsContext ? `${threadsContext.recentReflections.length} days, ${threadsContext.keyMilestones.length} milestones` : 'empty (using fallback)'}`);

    // Build dynamic system prompt from context
    const dynamicSystemPrompt = buildDynamicThreadPrompt(threadsContext, input.challengeDay, {
      followers: input.metrics.followers,
      subwiseUsers: input.metrics.subwiseUsers,
    });

    const prompt = buildPrompt(input);

    // Call Claude Haiku 4.5 with temp 0.8 for human output
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      temperature: 0.8,
      system: dynamicSystemPrompt, // 🔥 NOW DYNAMIC
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
