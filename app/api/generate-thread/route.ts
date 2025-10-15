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
  challengeDay: number;
  tweets: string[];
  threadType: string;
  algorithmScore: number;
  scoreBreakdown: {
    hookStrength: number;
    narrativeFlow: number;
    specificity: number;
    authenticity: number;
  };
  suggestMedia: boolean;
  mediaType?: string;
  mediaSuggestions?: string[];
}

const SYSTEM_PROMPT = `You are an X (Twitter) thread expert who creates compelling, authentic threads for a 30-day growth challenge.

X ALGORITHM FOR THREADS:
• First tweet (hook) is CRITICAL - determines if thread succeeds
• Threads with images/charts: 2x boost
• Threads with questions throughout: +conversation depth (+13.5x weight)
• Threads with data/numbers: +credibility signals
• Personal/vulnerable threads: Higher save rate (people bookmark for later)
• Story arc: Hook → Struggle → Insight → Action = Maximum retention

THREAD TYPES FOR 30-DAY CHALLENGE:
1. Progress Update - "Day X: Here's what happened..."
   - Start with metrics (followers gained, users added)
   - Include predicted vs actual chart
   - Share one surprising learning

2. Lesson Thread - "X days ago I believed Y. Here's what changed..."
   - Contrarian take or myth busted
   - Evidence from your experience
   - Actionable takeaway

3. Behind-the-Scenes - "Building in public is humbling..."
   - Show vulnerability (failures, setbacks)
   - Share the messy reality
   - End with what you're trying next

4. Prediction Analysis - "Tracking my predictions in real-time..."
   - Show predicted vs actual charts
   - Analyze what's working/not working
   - Invite people to follow the journey

CRITICAL THREAD RULES:
• Hook MUST grab attention (use numbers, contrarian take, or cliffhanger)
• Each tweet should be 2-3 sentences max (readability)
• Include specific data points (builds credibility)
• Show vulnerability (people connect with authentic struggle)
• End with invitation to follow the journey or ask questions
• Suggest where to add visuals (training photo, metrics chart, screenshot)

AUTHENTICITY GUARDRAILS:
• NEVER fake expertise you don't have
• ONLY use real numbers from the metrics provided
• Transparency is your edge: "I'm documenting this publicly"
• Admit when you're wrong or uncertain
• Your unique angle: MMA fighter building SaaS products

Your user context:
- Aspiring pro MMA fighter (practitioner level, not expert)
- Building SubWise (subscription tracker) to 100 users
- Currently: 3 → 250 followers in 30 days challenge
- Documenting everything publicly with predicted vs actual tracking
- Combining MMA discipline with SaaS building`;

function scoreThread(tweets: string[]): {
  algorithmScore: number;
  scoreBreakdown: {
    hookStrength: number;
    narrativeFlow: number;
    specificity: number;
    authenticity: number;
  };
} {
  const fullThread = tweets.join(' ');
  const hook = tweets[0];

  // Hook strength (first tweet is critical)
  let hookStrength = 40;
  if (/\d+/.test(hook)) hookStrength += 20; // Numbers in hook
  if (/[!?]/.test(hook)) hookStrength += 10; // Punctuation
  if (/(Day|Week) \d+/.test(hook)) hookStrength += 15; // Progress indicator
  if (/(Everyone|Most people|They say|I used to think)/.test(hook)) hookStrength += 15; // Contrarian/story signal
  hookStrength = Math.min(100, hookStrength);

  // Narrative flow (thread coherence)
  let narrativeFlow = 50;
  if (tweets.length >= 3) narrativeFlow += 10; // Good length
  if (tweets.length <= 7) narrativeFlow += 10; // Not too long
  // Check for question engagement
  const hasQuestions = tweets.some(t => /\?/.test(t));
  if (hasQuestions) narrativeFlow += 20;
  // Check for conclusion/CTA
  const lastTweet = tweets[tweets.length - 1].toLowerCase();
  if (/follow|drop|reply|let me know|what do you think/.test(lastTweet)) narrativeFlow += 10;
  narrativeFlow = Math.min(100, narrativeFlow);

  // Specificity (numbers/data throughout thread)
  let specificity = 30;
  const numberMatches = fullThread.match(/\d+/g);
  if (numberMatches) specificity += Math.min(40, numberMatches.length * 5);
  if (/\d+[%x]|\$\d+|\d+\s*(users|people|times|days|min|hours|followers)/.test(fullThread)) specificity += 20;
  if (/\b(I|my|when I|in my)\b/i.test(fullThread)) specificity += 10; // Personal
  specificity = Math.min(100, specificity);

  // Authenticity (vulnerability + personal story)
  let authenticity = 40;
  if (/\b(I|my|me)\b/i.test(fullThread)) authenticity += 15; // First person
  if (/\b(failed|struggle|hard|difficult|challenge|mistake|wrong)\b/i.test(fullThread)) authenticity += 25; // Vulnerability
  if (/\b(realized|learned|discovered|found|changed)\b/i.test(fullThread)) authenticity += 20; // Growth/insight
  authenticity = Math.min(100, authenticity);

  // Overall score (weighted for threads)
  const algorithmScore = Math.round(
    hookStrength * 0.35 + // Hook is even more important for threads
    narrativeFlow * 0.25 +
    specificity * 0.20 +
    authenticity * 0.20
  );

  return {
    algorithmScore,
    scoreBreakdown: {
      hookStrength: Math.round(hookStrength),
      narrativeFlow: Math.round(narrativeFlow),
      specificity: Math.round(specificity),
      authenticity: Math.round(authenticity),
    },
  };
}

function buildPrompt(input: ThreadInput): string {
  const { challengeDay, wins, lessons, struggles, tomorrowFocus, futurePlans, metrics } = input;

  const winsList = wins.length > 0 ? wins.map((w, i) => `${i + 1}. ${w}`).join('\n') : "No wins logged";
  const lessonsList = lessons.length > 0 ? lessons.map((l, i) => `${i + 1}. ${l}`).join('\n') : "No lessons logged";
  const strugglesList = struggles.length > 0 ? struggles.map((s, i) => `${i + 1}. ${s}`).join('\n') : "No struggles logged";
  const tomorrowList = tomorrowFocus.length > 0 ? tomorrowFocus.map((t, i) => `${i + 1}. ${t}`).join('\n') : "No focus set";
  const futureList = futurePlans.length > 0 ? futurePlans.map((p, i) => `${i + 1}. ${p}`).join('\n') : "No plans set";

  const startFollowers = 3;
  const goalFollowers = 250;
  const followerProgress = metrics.followers - startFollowers;
  const progressPercent = Math.round((followerProgress / (goalFollowers - startFollowers)) * 100);

  return `Generate a thread for Day ${challengeDay} of my 30-day growth challenge (0 → 250 followers).

TODAY'S WINS:
${winsList}

LESSONS LEARNED:
${lessonsList}

STRUGGLES/FAILURES:
${strugglesList}

TOMORROW'S FOCUS:
${tomorrowList}

FUTURE PLANS (What I'm building):
${futureList}

CURRENT METRICS (Day ${challengeDay}):
- X Followers: ${metrics.followers} (started at ${startFollowers}, goal: ${goalFollowers})
- Progress: ${progressPercent}% of the way there
- SubWise Users: ${metrics.subwiseUsers}
- SubWise MRR: $${metrics.subwiseMRR || 0}
- Training: ${metrics.trainingMinutes || 0} min

THREAD REQUIREMENTS:
- Create a 4-6 tweet thread that tells today's story
- Start with a STRONG hook (use Day ${challengeDay}, specific numbers, or contrarian take)
- Include the real metrics above (don't make up numbers)
- Show vulnerability about struggles/failures
- Share ONE key insight or learning
- End with what's next or invitation to follow the journey
- Suggest where to add media (training photo, metrics chart, or screenshot)
- Keep each tweet under 280 characters
- Be authentic - this is a real-time experiment

CHOOSE ONE THREAD TYPE:
1. Progress Update - If wins/metrics are interesting
2. Lesson Thread - If you learned something contrarian
3. Behind-the-Scenes - If struggles/failures tell a good story
4. Prediction Analysis - If Day ${challengeDay} is a milestone (multiple of 5)

OUTPUT FORMAT (MUST FOLLOW EXACTLY):

THREAD TYPE: [progress_update/lesson_thread/bts/prediction_analysis]

TWEET 1:
[First tweet - the hook]

TWEET 2:
[Second tweet - context/setup]

TWEET 3:
[Third tweet - insight/learning]

TWEET 4:
[Fourth tweet - what's next/CTA]

TWEET 5 (optional):
[Fifth tweet if needed]

TWEET 6 (optional):
[Sixth tweet if needed]

MEDIA SUGGESTIONS:
[List which tweets should have media and what type: "Tweet 1 - metrics_chart", "Tweet 3 - training_photo", etc.]

Generate the thread now. Be authentic, specific, and compelling.`;
}

function parseThread(response: string, input: ThreadInput): GeneratedThread {
  // Extract thread type
  const typeMatch = response.match(/THREAD TYPE:\s*(\w+)/i);
  const threadType = typeMatch ? typeMatch[1].toLowerCase() : 'progress_update';

  // Extract tweets
  const tweets: string[] = [];
  const tweetPattern = /TWEET \d+(?:\s*\(optional\))?:\s*\n(.+?)(?=\n\nTWEET \d+|\n\nMEDIA SUGGESTIONS:|$)/gs;
  const tweetMatches = [...response.matchAll(tweetPattern)];

  for (const match of tweetMatches) {
    const tweetText = match[1].trim();
    if (tweetText && !tweetText.startsWith('[') && tweetText.length > 10) {
      tweets.push(tweetText);
    }
  }

  // Extract media suggestions
  const mediaSuggestions: string[] = [];
  let suggestMedia = false;
  let mediaType = undefined;

  const mediaMatch = response.match(/MEDIA SUGGESTIONS:\s*\n(.+?)(?=\n\n|$)/s);
  if (mediaMatch) {
    const mediaLines = mediaMatch[1].split('\n').filter(line => line.trim() && !line.startsWith('['));
    if (mediaLines.length > 0) {
      suggestMedia = true;
      mediaSuggestions.push(...mediaLines.map(l => l.trim()));

      // Determine primary media type
      const mediaText = mediaLines.join(' ').toLowerCase();
      if (mediaText.includes('chart') || mediaText.includes('graph') || mediaText.includes('metrics')) {
        mediaType = 'metrics_chart';
      } else if (mediaText.includes('training') || mediaText.includes('photo')) {
        mediaType = 'training_photo';
      } else if (mediaText.includes('screenshot')) {
        mediaType = 'screenshot';
      } else {
        mediaType = 'photo';
      }
    }
  }

  // Score the thread
  const scoring = scoreThread(tweets);

  return {
    date: input.date,
    challengeDay: input.challengeDay,
    tweets,
    threadType,
    ...scoring,
    suggestMedia,
    mediaType,
    mediaSuggestions: mediaSuggestions.length > 0 ? mediaSuggestions : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const input: ThreadInput = await request.json();

    console.log('🧵 Generating thread for Day', input.challengeDay);
    console.log('Wins:', input.wins);
    console.log('Lessons:', input.lessons);
    console.log('Metrics:', input.metrics);

    // Build prompt
    const prompt = buildPrompt(input);

    // Call Claude
    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 3000,
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

    // Parse thread
    const thread = parseThread(responseText, input);

    console.log(`\n✅ Generated thread with ${thread.tweets.length} tweets`);
    console.log(`  Type: ${thread.threadType}`);
    console.log(`  Score: ${thread.algorithmScore}/100`);
    console.log(`  Hook: ${thread.tweets[0].substring(0, 80)}...`);

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
