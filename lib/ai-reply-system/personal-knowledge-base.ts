/**
 * PERSONAL KNOWLEDGE BASE - REAL EXPERIENCES ONLY
 *
 * NO FAKE STORIES. NO MADE-UP METRICS.
 * Only use what's actually true about you.
 *
 * When you don't have a story → ASK GENUINE QUESTIONS instead
 */

export interface PersonalExperience {
  topic: string;
  experience: string;
  context: string;
  verified: boolean; // Only true if Arshad confirmed this
}

export const PERSONAL_CONTEXT = {
  // Current status
  currentStage: "building_in_public_beginner",
  followers: 3,
  goal: "3 → 250 followers in 30 days",

  // Projects
  projects: {
    subwise: {
      status: "building",
      description: "Subscription tracker for managing recurring payments",
      stage: "early_development",
      launched: false,
      users: 0,
      mrr: 0,
    },
    xReplyOptimizer: {
      status: "building",
      description: "Algorithm-optimized X reply generator",
      stage: "active_development",
      purpose: "grow_following_strategically"
    }
  },

  // Interests/Background
  background: {
    mma: {
      trains: true,
      level: "practitioner", // not expert yet
      passion: "discipline_and_philosophy"
    },
    saas: {
      building: true,
      level: "aspiring_founder",
      learning: "building_in_public"
    },
    tech: {
      coding: true,
      level: "developer",
      focus: "web_apps_and_ai"
    }
  },

  // What you CAN talk about authentically
  authenticTopics: [
    "starting_from_zero",
    "learning_to_build_in_public",
    "mma_training_beginner",
    "building_first_saas",
    "x_algorithm_research",
    "convex_database",
    "nextjs_development",
    "ai_integration_experiments"
  ],

  // What you CANNOT talk about (don't have experience yet)
  avoidFakeExpertise: [
    "hitting_10k_mrr",
    "scaling_to_1000_users",
    "exit_stories",
    "years_of_saas_experience",
    "advanced_mma_techniques",
    "managing_teams",
    "fundraising"
  ]
};

/**
 * Real experiences you can reference
 * ADD MORE AS THEY HAPPEN!
 */
export const REAL_EXPERIENCES: PersonalExperience[] = [
  {
    topic: "starting_from_scratch",
    experience: "At 3 followers trying to hit 250 in 30 days",
    context: "Beginning of X growth journey",
    verified: true
  },
  {
    topic: "building_subwise",
    experience: "Building SubWise (subscription tracker) as first SaaS",
    context: "Early stage development, no users yet",
    verified: true
  },
  {
    topic: "x_algorithm_study",
    experience: "Studied X's open-source algorithm to understand 75x author reply weight",
    context: "Built reply optimizer based on real algorithm weights",
    verified: true
  },
  {
    topic: "mma_training",
    experience: "Training MMA for discipline and mental toughness",
    context: "Practitioner level, passionate about philosophy of combat sports",
    verified: true
  },
  {
    topic: "building_in_public",
    experience: "Learning to build in public through 30-day challenge",
    context: "First time documenting journey publicly",
    verified: true
  },
  {
    topic: "technical_learning",
    experience: "Learning Next.js, Convex, and AI API integration through building",
    context: "Self-taught developer building real projects",
    verified: true
  },
  {
    topic: "api_integration",
    experience: "Integrated Claude AI API and Twitter API into reply optimizer",
    context: "First time working with LLM APIs in production",
    verified: true
  },
  {
    topic: "problem_solving",
    experience: "Debugging deployment issues, API authentication, and model compatibility",
    context: "Real-world development challenges while building in public",
    verified: true
  },
  {
    topic: "strategic_thinking",
    experience: "Analyzing X's algorithm to reverse-engineer engagement patterns",
    context: "Data-driven approach to social media growth",
    verified: true
  },
  {
    topic: "time_management",
    experience: "Balancing building two projects (SubWise + Reply Optimizer) simultaneously",
    context: "Learning to prioritize and ship fast",
    verified: true
  },
  {
    topic: "indie_hacking",
    experience: "Solo founder building tools to solve own problems (subscription tracking, reply optimization)",
    context: "Bootstrapped, no funding, learning as I go",
    verified: true
  },
  {
    topic: "community_engagement",
    experience: "Replying to founders and builders to learn from their journey",
    context: "Building network from ground zero",
    verified: true
  }
];

/**
 * Strategy: When you DON'T have a story, ASK GENUINE QUESTIONS
 */
export const AUTHENTIC_REPLY_STRATEGIES = {
  // When they talk about scaling
  scaling: {
    dontSay: "When we hit 10K MRR...", // FAKE
    doSay: "I'm at 0 users building SubWise - what was your biggest challenge going from 0 → first 100?" // REAL
  },

  // When they talk about metrics
  metrics: {
    dontSay: "We saw 3x improvement after...", // FAKE
    doSay: "I'm just starting to track engagement - which metric mattered most at your stage?" // REAL
  },

  // When they talk about AI
  ai: {
    dontSay: "At 5K MRR we automated...", // FAKE
    doSay: "I'm experimenting with Claude for my reply tool - how did you balance AI speed vs quality?" // REAL
  },

  // When they talk about MMA
  mma: {
    dontSay: "After 10 years of training...", // FAKE
    doSay: "I train MMA for discipline - does that mental toughness translate to your founder journey?" // REAL
  },

  // When they talk about building in public
  buildInPublic: {
    dontSay: "When I grew from 3 → 10K followers...", // FAKE
    doSay: "I'm at day 1 of my 30-day challenge (3 → 250 followers) - what content got you early traction?" // REAL
  }
};

/**
 * Get authentic reply angle based on tweet topic
 */
export function getAuthenticAngle(tweetTopic: string): {
  canShareExperience: boolean;
  experience?: string;
  questionToAsk: string;
} {
  // Check if we have real experience in this area
  const relevantExp = REAL_EXPERIENCES.find(exp =>
    exp.topic.toLowerCase().includes(tweetTopic.toLowerCase())
  );

  if (relevantExp) {
    return {
      canShareExperience: true,
      experience: relevantExp.experience,
      questionToAsk: `Given your experience, ${generateContextualQuestion(tweetTopic)}`
    };
  }

  // No experience? Ask genuine question from beginner perspective
  return {
    canShareExperience: false,
    questionToAsk: generateBeginnerQuestion(tweetTopic)
  };
}

function generateContextualQuestion(topic: string): string {
  // These are GENERIC - the actual question should be tweet-specific
  // This is just to guide the AI
  const questions: Record<string, string> = {
    scaling: "what was your biggest challenge going 0 → first 100 users?",
    metrics: "which metric mattered most at the early stage?",
    ai: "how did you balance AI automation vs quality control?",
    mma: "does that mental discipline translate to building?",
    building: "what content got you early traction?"
  };

  return questions[topic] || "what's your advice for someone just starting?";
}

function generateBeginnerQuestion(topic: string): string {
  return `As someone just starting (3 followers, building first SaaS), what's your advice on ${topic}?`;
}

/**
 * Validate reply for authenticity - NO FAKE STORIES
 */
export function validateAuthenticity(reply: string): {
  authentic: boolean;
  issues: string[];
  fixes: string[];
} {
  const issues: string[] = [];
  const fixes: string[] = [];

  // Check for fake metrics
  const fakeMetricPatterns = [
    /\b(\d+K?\s*(MRR|ARR|users|customers))\b/gi, // "5K MRR", "1000 users"
    /\b(hit|reached|scaled to|grew to)\s+\d+/gi, // "hit 10K", "grew to 1000"
    /\b(after|over|in)\s+\d+\s+(years?|months?)\b/gi // "after 2 years"
  ];

  fakeMetricPatterns.forEach(pattern => {
    const matches = reply.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Except for "3 followers" or "0 users" (these are TRUE)
        if (!match.includes('3 follower') && !match.includes('0 user')) {
          issues.push(`Fake metric: "${match}" - you don't have this experience yet`);
          fixes.push('Replace with genuine question: "I\'m at 0 users - what was your experience at this stage?"');
        }
      });
    }
  });

  // Check for fake scenarios
  const fakeScenarioPatterns = [
    /\b(when (we|I) (built|launched|scaled|hit))\b/gi,
    /\b(at (my|our) (company|startup|business))\b/gi,
    /\b(in (production|my experience))\b/gi
  ];

  fakeScenarioPatterns.forEach(pattern => {
    const matches = reply.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Except for "when I built this tool" or "when I started" (building NOW)
        if (!match.toLowerCase().includes('building') && !match.toLowerCase().includes('starting')) {
          issues.push(`Fake scenario: "${match}" - sounds like made-up experience`);
          fixes.push('Replace with genuine curiosity: "I\'m just starting to explore this - how did you approach it?"');
        }
      });
    }
  });

  // Check for fake expertise claims
  const fakeExpertisePatterns = [
    /\b(I've found that|In my experience|After years of|I've learned)\b/gi
  ];

  fakeExpertisePatterns.forEach(pattern => {
    const matches = reply.match(pattern);
    if (matches) {
      matches.forEach(match => {
        issues.push(`Fake expertise: "${match}" - implies experience you don't have`);
        fixes.push('Replace with genuine learning: "I\'m exploring this now - what did you discover?"');
      });
    }
  });

  return {
    authentic: issues.length === 0,
    issues,
    fixes
  };
}

/**
 * Get your authentic context for prompt building
 */
export function getAuthenticContext(): string {
  return `
YOUR AUTHENTIC CONTEXT (ARSHAD):
- Current: 3 X followers, goal 250 in 30 days
- Building: SubWise (subscription tracker) - 0 users, early stage
- Also building: X Reply Optimizer based on open-source X algorithm
- Background: MMA training (practitioner, not expert), aspiring SaaS founder
- Learning: Building in public for the first time
- Tech: Next.js, Convex, AI integration

WHAT YOU CAN AUTHENTICALLY TALK ABOUT:
✅ Starting from zero (3 followers)
✅ Building first SaaS (SubWise at 0 users)
✅ Studying X algorithm (actually analyzed the open-source code)
✅ MMA training for discipline (practitioner level)
✅ Learning to build in public (30-day challenge)
✅ Next.js/Convex/AI development (building real projects)
✅ API integration challenges (Claude + Twitter APIs)
✅ Solo indie hacking (bootstrapped, no funding)
✅ Strategic/analytical thinking (data-driven approach)

WHAT YOU CANNOT CLAIM:
❌ Any MRR numbers (you're at $0)
❌ User counts above 0
❌ Years of experience
❌ Scaling stories
❌ Advanced expertise

STRATEGY:
- When they share success → Ask genuine question from beginner perspective
- When they share struggle → Share your beginner struggle if relevant
- When they share insight → Ask how it applies to your stage
- NEVER make up metrics, stories, or experiences
- BE CURIOUS, NOT FAKE EXPERT
`.trim();
}
