/**
 * Example Library - HONEST High-Performing Replies
 * 
 * These are curated examples of 90%+ scoring replies that are HONEST.
 * NO FAKE SCENARIOS. NO FABRICATED STORIES.
 * 
 * Strategies used:
 * 1. Thoughtful specific questions with numbers/ratios
 * 2. Edge case exploration
 * 3. Framework/mental model sharing (if genuine)
 * 4. Specific curiosity about implementation
 */

export interface ReplyExample {
  tweet: string;
  reply: string;
  niche: string;
  score: number;
  why: string;
  gotAuthorReply: boolean;
  strategy: 'question' | 'framework' | 'curiosity' | 'observation';
}

const examples: ReplyExample[] = [
  // ============================================
  // MINDSET EXAMPLES - Honest Questions/Insights
  // ============================================
  {
    tweet: "The biggest battle is always within. Master your inner voice, master your destiny.",
    reply: "When you say master your inner voice - does it mean changing the voice itself, or changing how you respond to it? Like is the goal to have 0 negative thoughts, or to have 10 negative + 10 positive but choose which to act on?",
    niche: "mindset",
    score: 92,
    why: "Uses exact keywords (inner voice, master), asks specific question with numbers, shows deep thinking about implementation, 0 fake scenarios",
    gotAuthorReply: true,
    strategy: 'question'
  },
  {
    tweet: "Your comfort zone is a beautiful place but nothing grows there.",
    reply: "Does the distance outside your comfort zone matter? Like 10% beyond (mild discomfort) vs 100% beyond (terror)? Or is it binary - any discomfort = growth?",
    niche: "mindset",
    score: 91,
    why: "Specific question with percentages, explores edge cases, uses keywords (comfort zone, growth), no fake stories",
    gotAuthorReply: false,
    strategy: 'question'
  },
  {
    tweet: "Talk to yourself kindly, your mind believes every word. Feed it hope, not doubt. Feed it courage, not fear.",
    reply: "Does the ratio of hope to doubt matter more than absolute quantity? Like 10 hopeful thoughts + 2 doubts vs 3 hopeful + 0 doubts? Or does any doubt contaminate the hope?",
    niche: "mindset",
    score: 93,
    why: "Uses exact keywords (hope, doubt, mind), specific numerical comparison, explores practical implementation, 0 fabrication",
    gotAuthorReply: true,
    strategy: 'question'
  },
  {
    tweet: "You don't need motivation. You need discipline. Motivation is fleeting, discipline compounds.",
    reply: "When you say discipline compounds - does it compound linearly (2x discipline = 2x results) or exponentially (2x discipline = 4x results over time)? Curious if there's a tipping point.",
    niche: "mindset",
    score: 90,
    why: "Uses keywords (discipline, compounds), asks about specific mathematical relationship, shows analytical thinking",
    gotAuthorReply: false,
    strategy: 'question'
  },
  {
    tweet: "Your current self and your future self are in competition. Who wins depends on your daily choices.",
    reply: "Is it better to think of future self as 1 year away, 5 years away, or 10 years away for daily decisions? Does the time horizon change which choices win?",
    niche: "mindset",
    score: 91,
    why: "Specific timeframes (1/5/10 years), explores implementation detail, uses keywords (future self, daily choices)",
    gotAuthorReply: true,
    strategy: 'question'
  },

  // ============================================
  // SAAS EXAMPLES - Technical Curiosity
  // ============================================
  {
    tweet: "Shipped 3 features last week. Users loved 1, ignored 2. Focus beats volume every time.",
    reply: "For the 2 ignored features - was it that users didn't discover them, or discovered but didn't need them? Curious if it's a positioning problem vs product-market fit problem.",
    niche: "saas",
    score: 92,
    why: "Uses keywords (features, users, ignored), asks specific diagnostic question, shows product thinking, 0 fake metrics",
    gotAuthorReply: true,
    strategy: 'curiosity'
  },
  {
    tweet: "Your landing page conversion rate tells you everything. Ours went from 0.5% to 4.2% with one change - we removed options.",
    reply: "When you removed options, did you A/B test single path vs 2 options vs 3+ options to find the threshold? Or was it binary (many vs one)?",
    niche: "saas",
    score: 91,
    why: "Uses keywords (options, conversion), asks about testing methodology with specific numbers, shows analytical thinking",
    gotAuthorReply: false,
    strategy: 'question'
  },
  {
    tweet: "Stop building features. Start removing friction. Every click is a decision point where users can leave.",
    reply: "For clicks that can't be removed (like payment requires confirm) - is it better to add explanation (\"Why we ask\") or just optimize the click itself to be faster? What reduces friction more?",
    niche: "saas",
    score: 90,
    why: "Uses keywords (friction, clicks), explores edge case, practical implementation question, honest curiosity",
    gotAuthorReply: true,
    strategy: 'curiosity'
  },
  {
    tweet: "Pricing is positioning. We doubled our price and increased conversions. Cheap signals low quality.",
    reply: "Did you double price across all tiers, or just the top tier? Curious if there's a sweet spot or if it needs to be system-wide to change positioning.",
    niche: "saas",
    score: 91,
    why: "Uses keywords (price, positioning), specific implementation question, shows strategic thinking",
    gotAuthorReply: false,
    strategy: 'question'
  },
  {
    tweet: "Technical debt isn't the code you write badly. It's the features you ship before finding product-market fit.",
    reply: "How do you distinguish between 'testing PMF' features (ok to be messy) vs 'we have PMF' features (need to be solid)? Is there a clear signal or is it gradual?",
    niche: "saas",
    score: 92,
    why: "Uses keywords (features, product-market fit), explores practical boundary question, honest curiosity about implementation",
    gotAuthorReply: true,
    strategy: 'curiosity'
  },

  // ============================================
  // MMA EXAMPLES - Technical Analysis
  // ============================================
  {
    tweet: "Volkanovski's boxing defense is underrated. He slips 68% of power punches in the pocket. Elite head movement.",
    reply: "For the 32% that land - are those mostly jabs/straights where he's accepting to counter, or is it hooks/uppercuts getting through? Curious what he's willing to trade.",
    niche: "mma",
    score: 93,
    why: "Uses exact stats (68%, calculates 32%), asks specific technical question about punch types, shows deep fight analysis",
    gotAuthorReply: true,
    strategy: 'curiosity'
  },
  {
    tweet: "Submission threat changes striking. When Islam is in range, opponents think 'defend takedown' not 'counter punch'. Opens up everything.",
    reply: "Does the submission threat need to be recent (last 2 rounds) or does it persist entire fight once established? Like if he attempts a sub in R1, does it affect R4-5 striking?",
    niche: "mma",
    score: 91,
    why: "Uses keywords (submission threat, striking), specific timeframe question (R1 vs R4-5), analytical thinking",
    gotAuthorReply: false,
    strategy: 'question'
  },
  {
    tweet: "Pressure fighters need 3x cardio of counter-fighters. You're moving forward 25 minutes while they're moving backward.",
    reply: "Is the 3x cardio drain from physical movement, or from mental intensity of being aggressive? Like would a pressure fighter moving backward use 3x less energy?",
    niche: "mma",
    score: 90,
    why: "Uses exact metric (3x), explores underlying mechanism, specific comparison question",
    gotAuthorReply: true,
    strategy: 'question'
  },
  {
    tweet: "Oliveira's guard is so dangerous that fighters choose to stay standing even when they're better wrestlers. It's a trap either way.",
    reply: "For elite wrestlers like Dariush or Islam - do they have a threshold (like 'only take down if 80% sure of passing')? Or is Oliveira's guard so dangerous it's never worth it?",
    niche: "mma",
    score: 92,
    why: "Uses keywords (guard, wrestlers, take down), specific percentage threshold question, explores decision-making",
    gotAuthorReply: true,
    strategy: 'curiosity'
  },

  // ============================================
  // TECHNICAL EXAMPLES - Architecture Questions
  // ============================================
  {
    tweet: "Microservices solve scaling problems but create debugging problems. Every network call is a potential failure point.",
    reply: "For the debugging complexity - is it worse to have 10 services with 90 calls between them, or 20 services with 40 calls? Like is it about number of services or number of connections?",
    niche: "technical",
    score: 91,
    why: "Uses keywords (services, debugging, calls), specific numerical comparison, explores optimization tradeoff",
    gotAuthorReply: false,
    strategy: 'question'
  },
  {
    tweet: "Code review velocity matters. If reviews take >24 hours, engineers start working on multiple features simultaneously. Context switching kills productivity.",
    reply: "What's more costly - slow reviews (>24h) causing context switching, or fast reviews (<4h) that miss bugs and require rework? Is there a quality vs speed tipping point?",
    niche: "technical",
    score: 92,
    why: "Uses keywords (reviews, context switching), specific timeframes (24h vs 4h), explores tradeoff with real numbers",
    gotAuthorReply: true,
    strategy: 'question'
  },
  {
    tweet: "Database indexes speed up reads but slow down writes. Most apps over-index and wonder why writes are slow.",
    reply: "Is there a rule of thumb for read:write ratio where indexes flip from helping to hurting? Like 80:20 is good but 50:50 is bad?",
    niche: "technical",
    score: 90,
    why: "Uses keywords (indexes, reads, writes), asks about specific ratio thresholds, practical implementation question",
    gotAuthorReply: false,
    strategy: 'question'
  },

  // ============================================
  // GENERAL EXAMPLES - Cross-Domain Thinking
  // ============================================
  {
    tweet: "Consistency beats intensity. 30 minutes daily for a year > 4 hours once a week.",
    reply: "Is there a frequency threshold where this flips? Like is 30min daily better than 1hr every 2 days? Or does any gap break the compound effect?",
    niche: "other",
    score: 91,
    why: "Uses keywords (consistency, daily), specific time comparisons (30min vs 1hr), explores boundary conditions",
    gotAuthorReply: true,
    strategy: 'question'
  },
  {
    tweet: "The best time to start was yesterday. The second best time is now. Waiting for perfect conditions is procrastination in disguise.",
    reply: "For starting now with 60% preparation vs waiting 3 months for 90% preparation - does the 3-month delay cost more than the 30% extra readiness gains?",
    niche: "other",
    score: 90,
    why: "Uses keywords (start, waiting), specific percentages and timeframes, explores practical decision-making",
    gotAuthorReply: false,
    strategy: 'question'
  },
  {
    tweet: "Input determines output. If you consume junk content, you'll produce junk ideas. Garbage in, garbage out.",
    reply: "Does content quality matter more than quantity? Like is 1 hour of high-quality reading better than 5 hours of mixed quality? Or does any garbage contaminate the good?",
    niche: "other",
    score: 92,
    why: "Uses keywords (content, garbage), specific time comparison (1h vs 5h), explores quality vs quantity tradeoff",
    gotAuthorReply: true,
    strategy: 'question'
  },
  {
    tweet: "Your network is your net worth. But quality > quantity. 5 deep connections beat 500 shallow ones.",
    reply: "When you say deep connections - is that measured by time invested (100+ hours), value exchanged ($10K+ both ways), or trust level (would trust with serious decision)? What defines deep?",
    niche: "other",
    score: 91,
    why: "Uses keywords (deep connections, quality), specific metrics (100h, $10K), asks for clarification on definition",
    gotAuthorReply: true,
    strategy: 'curiosity'
  },

  // ============================================
  // FRAMEWORK EXAMPLES - Mental Models
  // ============================================
  {
    tweet: "Decision fatigue is real. Successful people eliminate small decisions to preserve mental energy for big ones.",
    reply: "Is there a threshold for 'small decision'? Like <$100 and <1hr time = automate/eliminate? Or is it more about cognitive load than actual stakes?",
    niche: "mindset",
    score: 90,
    why: "Uses keywords (decision, eliminate), proposes specific thresholds ($100, 1hr), explores categorization",
    gotAuthorReply: false,
    strategy: 'question'
  },
  {
    tweet: "Optimize for energy, not time. 4 focused hours > 12 distracted hours. Attention is your most valuable resource.",
    reply: "For the energy optimization - does it mean scheduling hardest work when energy is highest, or does it mean eliminating energy drains (meetings, notifications)? Or both equally important?",
    niche: "mindset",
    score: 91,
    why: "Uses keywords (energy, focused, attention), explores two different implementation paths, shows strategic thinking",
    gotAuthorReply: true,
    strategy: 'curiosity'
  }
];

/**
 * Get examples by niche, fallback to general if not enough
 */
export function getExamplesByNiche(niche: string, count: number = 5): ReplyExample[] {
  const filtered = examples.filter(ex => ex.niche === niche);
  
  // If not enough for specific niche, add general examples
  if (filtered.length < count) {
    const otherExamples = examples.filter(ex => ex.niche === "other");
    return [...filtered, ...otherExamples].slice(0, count);
  }
  
  // Randomize selection to provide variety
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get examples by strategy type
 */
export function getExamplesByStrategy(
  strategy: 'question' | 'framework' | 'curiosity' | 'observation',
  count: number = 3
): ReplyExample[] {
  const filtered = examples.filter(ex => ex.strategy === strategy);
  return filtered.slice(0, count);
}
