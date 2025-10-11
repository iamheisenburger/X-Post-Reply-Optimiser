// Example Library - Curated high-performing replies (90%+)
// These are REAL examples (or realistic templates based on successful patterns)
// Used for few-shot learning in prompts

export interface ExampleReply {
  tweet: string;
  reply: string;
  score: number;
  why: string;
  niche: "saas" | "mindset" | "mma" | "tech" | "finance" | "other";
  gotAuthorReply?: boolean;
}

/**
 * Curated library of 30+ high-performing reply examples
 * Organized by niche for easy retrieval
 */
export const HIGH_PERFORMING_EXAMPLES: ExampleReply[] = [
  // ========== SaaS Examples (10+) ==========
  {
    tweet: "Debugging production on a Friday afternoon is a special kind of hell.",
    reply: "Been there. Last month we had a Redis cache stampede at 4PM before a long weekend. Solved by adding circuit breakers + exponential backoff. What's your go-to Friday debugging strategy?",
    score: 94,
    why: "✅ Concrete scenario (Redis, 4PM, long weekend) ✅ Specific solution ✅ Recent timeframe ✅ Technical context ✅ Contextual question",
    niche: "saas",
    gotAuthorReply: true
  },
  {
    tweet: "The best MVPs are embarrassingly simple. If you're not a little ashamed, it's not an MVP.",
    reply: "So true. Our first version was literally a Google Form + Airtable + Zapier. 0 code. Got to 50 users in 2 weeks, validated core value prop before building anything. What was your most embarrassingly simple MVP?",
    score: 96,
    why: "✅ Ultra-specific tech stack ✅ Concrete results (50 users, 2 weeks) ✅ Validates tweet's thesis ✅ 0 filler words",
    niche: "saas",
    gotAuthorReply: true
  },
  {
    tweet: "Product-market fit isn't a milestone. It's a moving target.",
    reply: "Experienced this at 10K MRR. What worked for initial 100 users completely broke at 1K. Rebuilt onboarding 3 times in 6 months. Each cohort had different 'aha moment' triggers. How do you track PMF evolution as you scale?",
    score: 93,
    why: "✅ Specific milestone (10K MRR) ✅ Concrete numbers (100 → 1K users) ✅ Detailed action (rebuilt 3 times in 6 months) ✅ Insight about evolution",
    niche: "saas"
  },
  {
    tweet: "A slightly scary reality of using AI: When you cut out approval steps, things move so much faster. But so do mistakes.",
    reply: "Your point about cutting approval steps resonates. At 8K MRR we automated deployment reviews, saw 3x faster deploys but added automated testing gates (80% coverage minimum) to catch issues. What safety nets did you implement?",
    score: 91,
    why: "✅ Specific revenue (8K MRR) ✅ Measurable result (3x faster) ✅ Concrete solution (80% coverage) ✅ Question about their approach",
    niche: "saas"
  },
  {
    tweet: "Founders overthink landing pages. Just answer: What is it? Who's it for? Why now?",
    reply: "Tested this exact framework last quarter. Stripped our landing page from 2000 words to 150, conversion jumped 42% (0.8% → 1.14%). Those 3 questions forced us to cut all the fluff. What's your ideal word count for above-fold?",
    score: 95,
    why: "✅ Specific timeframe (last quarter) ✅ Concrete before/after (2000 → 150 words) ✅ Measurable result (42% jump, actual %s) ✅ Technical question",
    niche: "saas"
  },
  {
    tweet: "If you're not embarrassed by your v1, you launched too late.",
    reply: "Launched with broken checkout in 2023. First customer had to email me their credit card (scary). Fixed in 4 hours, got 10 customers that week. Embarrassment was worth the validation. What feature did you launch broken that taught you most?",
    score: 92,
    why: "✅ Specific year (2023) ✅ Concrete story (broken checkout, email CC) ✅ Quick timeframe (4 hours) ✅ Measurable outcome (10 customers) ✅ Learning-focused question",
    niche: "saas"
  },
  {
    tweet: "Charging more money solves more problems than you think.",
    reply: "Doubled our pricing from $49 to $99/mo last year - lost 30% of signups but revenue increased 40%. Best part: support tickets dropped 60% (cheaper customers were 3x more demanding). What pricing change had the biggest unexpected benefit for you?",
    score: 94,
    why: "✅ Specific prices ($49 → $99) ✅ Concrete results (30%, 40%, 60%, 3x) ✅ Unexpected insight ✅ Open-ended question",
    niche: "saas"
  },
  {
    tweet: "The hardest part of building in public isn't sharing the wins. It's sharing the failures.",
    reply: "Shared our biggest failure last month - feature we spent 6 weeks building got 2% adoption. Post got 10x more engagement than any of our wins, and 3 founders reached out with solutions we hadn't considered. What failure taught you most when you shared it?",
    score: 93,
    why: "✅ Specific timeframe (last month, 6 weeks) ✅ Concrete failure (2% adoption) ✅ Measurable result (10x engagement, 3 founders) ✅ Reflective question",
    niche: "saas"
  },
  {
    tweet: "Customer interviews are useless if you're asking the wrong questions.",
    reply: "Changed our interview approach in Q4 2024 - stopped asking 'What features do you want?' Started asking 'Walk me through your last [painful task].' Insights tripled. Built 2 features that drove 25% MRR growth. What question format works best for you?",
    score: 92,
    why: "✅ Specific quarter (Q4 2024) ✅ Before/after comparison ✅ Measurable result (insights tripled, 25% MRR growth) ✅ Tactical question",
    niche: "saas"
  },
  {
    tweet: "The best growth hack is building something people actually want.",
    reply: "Spent 6 months on growth hacks (referral programs, viral loops, giveaways) - got 1K users with 5% retention. Spent 6 weeks fixing core workflow based on user feedback - got 500 users with 65% retention. Sometimes simple is hard. What metric shifted your focus?",
    score: 94,
    why: "✅ Specific timeframes (6 months, 6 weeks) ✅ Concrete comparison (1K at 5% vs 500 at 65%) ✅ Insight about simplicity ✅ Metric-focused question",
    niche: "saas"
  },

  // ========== Mindset Examples (8+) ==========
  {
    tweet: "Your self-talk shapes your reality. Feed your mind courage, not doubt.",
    reply: "Tracked my internal dialogue for 30 days last year - 68% was negative. Started using 'yet' reframes ('can't do this YET') and specific evidence journals. Shifted decision-making from fear-based to possibility-based. What specific reframe works best when doubt hits?",
    score: 95,
    why: "✅ Concrete experiment (30 days) ✅ Specific data (68%) ✅ Actual technique ('yet' reframes) ✅ Measurable outcome (fear → possibility)",
    niche: "mindset",
    gotAuthorReply: true
  },
  {
    tweet: "Discipline isn't sexy, but it's the only thing that compounds.",
    reply: "Tested this with morning routine in Q3 2024. 90 consecutive days of: 5AM wake, 30min writing, 45min workout. Output doubled, decision fatigue dropped 70%. The compounding was invisible until day 60. What discipline practice showed delayed compound effects for you?",
    score: 93,
    why: "✅ Specific quarter (Q3 2024) ✅ Concrete routine (5AM, 30min, 45min) ✅ Duration (90 days, day 60) ✅ Measurable results (2x output, 70% less fatigue)",
    niche: "mindset"
  },
  {
    tweet: "Most people fail because they give up 3 feet from gold.",
    reply: "Almost quit my startup at month 11. Revenue was $200 MRR, needed $2K to survive. Pushed for 4 more weeks - landed 2 contracts totaling $3.5K MRR. That '3 feet' moment taught me patience beats timing. What was your closest call before breakthrough?",
    score: 94,
    why: "✅ Specific timeframe (month 11, 4 weeks) ✅ Concrete numbers ($200, $2K, $3.5K MRR) ✅ Before/after story ✅ Reflective question",
    niche: "mindset"
  },
  {
    tweet: "You can't outperform your self-image.",
    reply: "Struggled with this until Q1 2024. Saw myself as 'small creator' - capped at 2K followers for 18 months. Reframed to 'helpful expert' - hit 10K in 4 months. Same content, different identity. What identity shift unlocked growth for you?",
    score: 92,
    why: "✅ Specific quarter (Q1 2024) ✅ Concrete plateau (18 months at 2K) ✅ Measurable breakthrough (10K in 4 months) ✅ Before/after identity ✅ Growth-focused question",
    niche: "mindset"
  },
  {
    tweet: "Comfort zone is where dreams go to die.",
    reply: "Left my $120K job in 2023 with $15K savings and no backup plan. First 6 months were brutal - bank account hit $800 twice. Now at $18K MRR 18 months later. Comfort zone tax is real but delayed. What leap cost you short-term for long-term?",
    score: 93,
    why: "✅ Specific year (2023) ✅ Concrete numbers ($120K, $15K, $800, $18K MRR) ✅ Timeline (6 months, 18 months) ✅ Honest struggle + outcome",
    niche: "mindset"
  },
  {
    tweet: "Fear of judgment keeps more people stuck than lack of resources.",
    reply: "Posted my first vulnerable story in June 2024 - hands shaking, expected backlash. Got 500 replies, 15 DMs saying 'me too,' 2 partnership offers. Realized judgment lives in my head. What post scared you but changed everything?",
    score: 91,
    why: "✅ Specific date (June 2024) ✅ Concrete results (500 replies, 15 DMs, 2 partnerships) ✅ Emotional honesty ✅ Transformation question",
    niche: "mindset"
  },
  {
    tweet: "Success leaves clues. Failure screams lessons.",
    reply: "Analyzed 50 failed projects last quarter - found 3 patterns in all of them: rushed validation, feature bloat, ignored metrics. Built checklist from those failures. Next 2 projects succeeded, both under 8 weeks. What failure pattern do you see repeatedly?",
    score: 92,
    why: "✅ Specific analysis (50 projects, last quarter) ✅ Concrete patterns (3 specific) ✅ Measurable outcome (2 successes, under 8 weeks) ✅ Pattern-recognition question",
    niche: "mindset"
  },
  {
    tweet: "Consistency beats intensity every single time.",
    reply: "Tested this in 2024 - Intense mode: 12hr days for 3 weeks, then burned out for 2 weeks. Consistent mode: 4hrs daily for 3 months, no breaks. Consistent produced 3x more output with 80% less stress. How do you balance intensity vs sustainability?",
    score: 94,
    why: "✅ Specific year (2024) ✅ Concrete comparison (12hr×3wk vs 4hr×3mo) ✅ Measurable result (3x output, 80% less stress) ✅ Tactical question",
    niche: "mindset"
  },

  // ========== MMA Examples (5+) ==========
  {
    tweet: "Islam Makhachev's cage control is on another level.",
    reply: "Your analysis is spot-on. Studied his UFC 294 fight - used 17 different takedown setups over 25 minutes but only committed to 6. Efficiency over volume. That patience forces opponents to overcommit. How do you rate control vs finishing?",
    score: 95,
    why: "✅ Specific fight (UFC 294) ✅ Concrete analysis (17 setups, committed to 6, 25 minutes) ✅ Technical insight ✅ Strategic question",
    niche: "mma",
    gotAuthorReply: true
  },
  {
    tweet: "Volkanovski's feints are criminally underrated.",
    reply: "Rewatched Holloway 3 last week - counted 42 feints in rounds 2-4 alone. The stance switch at 2:15 in R3 forced Max's adjustment, but the counter-feint in R4 neutralized it. Layers on layers. What feint sequence impressed you most recently?",
    score: 93,
    why: "✅ Specific fight (Holloway 3) ✅ Concrete data (42 feints, rounds 2-4, 2:15 timestamp) ✅ Technical breakdown ✅ Recency (last week)",
    niche: "mma"
  },
  {
    tweet: "Charles Oliveira's submission game is textbook.",
    reply: "His UFC 280 sequence was masterclass - level change feint → Thai clinch → back take → RNC, all in 47 seconds. Watched it frame-by-frame: the grip switch at 0:23 was the key. What's the most technically perfect submission sequence you've analyzed?",
    score: 94,
    why: "✅ Specific event (UFC 280) ✅ Detailed sequence with timing (47 seconds, 0:23) ✅ Frame-by-frame analysis ✅ Technical appreciation question",
    niche: "mma"
  },
  {
    tweet: "Jon Jones' fight IQ is what separates him from everyone else.",
    reply: "Watched his entire UFC run last month - he makes 3-4 mid-fight adjustments every single fight. UFC 285: switched stance 8 times in R1 alone, baited Gane's leg kicks 12 times before committing to wrestling. Adapts faster than opponents can counter. What adaptation impressed you most?",
    score: 92,
    why: "✅ Comprehensive analysis (entire UFC run, last month) ✅ Specific fight (UFC 285) ✅ Concrete data (8 switches, 12 baits, R1) ✅ Pattern recognition",
    niche: "mma"
  },
  {
    tweet: "Wrestling is the foundation of modern MMA.",
    reply: "Analyzed top 10 ranked fighters across 3 divisions - 7 out of 10 have D1 wrestling or equivalent. Control time averaged 8.5 minutes per fight vs 2.3 for non-wrestlers. The cage becomes their weapon. What wrestling credential matters most at elite level?",
    score: 91,
    why: "✅ Specific analysis (top 10, 3 divisions) ✅ Concrete data (7/10, 8.5 vs 2.3 minutes) ✅ Comparative insight ✅ Credential-focused question",
    niche: "mma"
  },

  // ========== Tech Examples (5+) ==========
  {
    tweet: "Microservices are overrated for most startups.",
    reply: "Learned this the hard way. Broke our monolith into 7 services last quarter - deployment frequency increased 5x but debugging complexity tripled. Spent 2 weeks fixing a bug that would've taken 30 minutes in the monolith. When did service split make sense for you?",
    score: 93,
    why: "✅ Specific architecture (7 services, last quarter) ✅ Measurable trade-offs (5x frequency, 3x complexity) ✅ Concrete example (2 weeks vs 30 min) ✅ Decision-focused question",
    niche: "tech"
  },
  {
    tweet: "Premature optimization is the root of all evil.",
    reply: "Spent 3 weeks optimizing our API from 200ms to 50ms at 100 daily users. Users didn't notice. Then at 10K users, different bottleneck emerged (database N+1 queries). Wasted optimization. Now we optimize at scale thresholds: 1K, 10K, 100K users. What's your threshold?",
    score: 94,
    why: "✅ Specific timeframe (3 weeks) ✅ Concrete metrics (200ms → 50ms, 100 → 10K users) ✅ Lesson learned (N+1 queries) ✅ Threshold strategy ✅ Tactical question",
    niche: "tech"
  },
  {
    tweet: "Redis is magic until it's not.",
    reply: "Hit this at 10K concurrent users last month. Cache stampede took down our API for 12 minutes. Implemented circuit breakers + exponential backoff + 300ms TTL staggering. Load times dropped from 4.2s to 380ms. What Redis failure taught you most?",
    score: 92,
    why: "✅ Specific scale (10K concurrent, last month) ✅ Concrete downtime (12 minutes) ✅ Detailed solution (circuit breakers, exponential backoff, 300ms TTL) ✅ Measurable result (4.2s → 380ms)",
    niche: "tech"
  },
  {
    tweet: "Docker makes development easy but production hard.",
    reply: "Deployed our first Docker production setup in 2023. Worked flawlessly for 3 months, then memory leak in one container crashed all 15 services. Took 6 hours to identify. Learned resource limits the hard way. What Docker gotcha bit you in production?",
    score: 91,
    why: "✅ Specific year (2023) ✅ Timeline (3 months) ✅ Concrete scale (15 services) ✅ Debugging time (6 hours) ✅ Lesson learned ✅ Production-focused question",
    niche: "tech"
  },
  {
    tweet: "GraphQL vs REST is the wrong debate.",
    reply: "Ran both for 18 months on same product. GraphQL: 40% fewer API calls, 3x development time. REST: predictable, debuggable, but 2x bandwidth. Trade-offs depend on team size and client diversity. We use REST + field filtering now. What drove your API choice?",
    score: 93,
    why: "✅ Specific timeframe (18 months, same product) ✅ Concrete trade-offs (40%, 3x, 2x) ✅ Decision rationale ✅ Context-aware question",
    niche: "tech"
  },

  // ========== Finance Examples (3) ==========
  {
    tweet: "Diversification is the only free lunch in investing.",
    reply: "Rebalanced portfolio last quarter - found 40% concentrated in tech. Spread to 15% per sector over 30 days. Recent correction hit my account 22% less than my previous allocation would have. Sleep better now. What's your target sector max?",
    score: 92,
    why: "✅ Specific action (last quarter, 40% → 15%) ✅ Timeline (30 days) ✅ Measurable outcome (22% less impact) ✅ Risk management focus",
    niche: "finance"
  },
  {
    tweet: "Dollar-cost averaging beats timing the market.",
    reply: "Tested this over 3 years: $500/month DCA vs trying to time dips. DCA: $18K invested, portfolio at $24.2K. Timing: $18K invested (missed 4 months waiting), portfolio at $21.8K. Stress level: DCA wins by 10x. What strategy keeps you consistent?",
    score: 94,
    why: "✅ Specific timeframe (3 years) ✅ Concrete amounts ($500/mo, $18K, $24.2K vs $21.8K) ✅ Behavioral insight (stress) ✅ Consistency question",
    niche: "finance"
  },
  {
    tweet: "Most people overestimate short-term returns and underestimate long-term compounding.",
    reply: "Analyzed my 5-year portfolio last month: Year 1-2 returns were -5% and +8% (disappointing). Years 3-5: +15%, +22%, +28%. Compound effect kicked in year 4. Total: 73% vs 12% if I'd quit after year 2. What timeframe shifted your perspective?",
    score: 93,
    why: "✅ Specific analysis (5 years, last month) ✅ Year-by-year breakdown (-5%, +8%, +15%, +22%, +28%) ✅ Compound visualization (73% vs 12%) ✅ Perspective-shift question",
    niche: "finance"
  },

  // ========== Other/General Examples (3) ==========
  {
    tweet: "The best time to start was yesterday. The second best time is now.",
    reply: "Started learning Spanish in June 2024 at age 35. Thought I was too old. 6 months later: conversational in basic topics, read 3 books, watched 2 shows without subtitles. Regret not starting at 25 but grateful I didn't wait until 45. What did you start 'late' but glad you did?",
    score: 91,
    why: "✅ Specific start (June 2024, age 35) ✅ Timeline (6 months) ✅ Concrete achievements (3 books, 2 shows) ✅ Age perspective ✅ Reflective question",
    niche: "other"
  },
  {
    tweet: "Input determines output. Garbage in, garbage out.",
    reply: "Audited my input diet in Q4 2024: 4hrs daily of social media doom scrolling, 30min books. Flipped it: 3.5hrs learning/books, 1hr curated social. 3 months later: launched 2 projects, read 15 books, 10x better mental clarity. What input shift changed your output most?",
    score: 93,
    why: "✅ Specific audit (Q4 2024) ✅ Before/after comparison (4hrs vs 3.5hrs) ✅ Timeline (3 months) ✅ Measurable outcomes (2 projects, 15 books, 10x clarity)",
    niche: "other"
  },
  {
    tweet: "Network effects compound faster than you think.",
    reply: "Helped 12 people with no expectation of return in 2023. In 2024, 8 of them sent me referrals totaling $45K in contracts. 3 became long-term partners. Never would've predicted the ROI. Helping > networking. What unexpected connection paid off for you?",
    score: 92,
    why: "✅ Specific count (12 people, 2023) ✅ Timeline (1 year later, 2024) ✅ Concrete results (8 referrals, $45K, 3 partnerships) ✅ Philosophy shift ✅ ROI question",
    niche: "other"
  }
];

/**
 * Get examples filtered by niche
 */
export function getExamplesByNiche(niche: string, limit: number = 5): ExampleReply[] {
  const nicheExamples = HIGH_PERFORMING_EXAMPLES.filter(ex => ex.niche === niche);
  
  // If not enough examples for this niche, add some "other" examples
  if (nicheExamples.length < limit) {
    const otherExamples = HIGH_PERFORMING_EXAMPLES.filter(ex => ex.niche === "other");
    return [...nicheExamples, ...otherExamples].slice(0, limit);
  }
  
  // Shuffle for variety
  return nicheExamples.sort(() => Math.random() - 0.5).slice(0, limit);
}

/**
 * Get a random mix of high-performing examples
 */
export function getRandomExamples(limit: number = 5): ExampleReply[] {
  return [...HIGH_PERFORMING_EXAMPLES]
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}

