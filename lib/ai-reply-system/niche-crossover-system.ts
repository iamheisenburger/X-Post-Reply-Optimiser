/**
 * NICHE CROSSOVER POSITIONING SYSTEM
 *
 * PROBLEM: You're in SaaS/MMA/Tech, but need to reply to creators in:
 * - Mindset/Philosophy
 * - Finance/Investing
 * - Health/Fitness
 * - Productivity
 * - Content Creation
 * - E-commerce
 * - AI/No-code
 * - Design/Marketing
 * - etc. (50+ different niches)
 *
 * SOLUTION: Find authentic CROSSOVER angles that connect your experiences
 * to their niche, without faking expertise.
 *
 * STRATEGY: "I don't know your field, but here's how YOUR insight connects to MY journey"
 */

export interface CrossoverAngle {
  theirNiche: string;
  yourExperience: string;
  connectionPoint: string;
  authenticQuestion: string;
  valuableInsight?: string;
}

/**
 * CROSSOVER MAP: How YOUR authentic experiences connect to THEIR niches
 */
export const NICHE_CROSSOVERS: Record<string, CrossoverAngle[]> = {
  // ============================================
  // MINDSET / PHILOSOPHY / PERSONAL DEVELOPMENT
  // ============================================
  "mindset": [
    {
      theirNiche: "mindset",
      yourExperience: "mma_training",
      connectionPoint: "Mental toughness and discipline",
      authenticQuestion: "Does the discipline from physical training (like MMA) actually transfer to business, or is that just motivational speak?"
    },
    {
      theirNiche: "mindset",
      yourExperience: "building_from_zero",
      connectionPoint: "Facing discomfort and uncertainty",
      authenticQuestion: "I'm at 3 followers building in public - is there a way to stay motivated when growth is slow, or do you just push through?"
    },
    {
      theirNiche: "mindset",
      yourExperience: "balancing_projects",
      connectionPoint: "Focus and prioritization",
      authenticQuestion: "Juggling 2 projects (SubWise + Reply Optimizer) - how do you decide what deserves focus when everything feels urgent?"
    }
  ],

  "philosophy": [
    {
      theirNiche: "philosophy",
      yourExperience: "mma_training",
      connectionPoint: "Philosophy of combat sports",
      authenticQuestion: "In MMA, every mistake gets punished immediately. Does that instant feedback loop create better learning than building (where feedback is delayed)?"
    },
    {
      theirNiche: "philosophy",
      yourExperience: "x_algorithm_study",
      connectionPoint: "Systems thinking and game theory",
      authenticQuestion: "I studied X's algorithm to understand the 'rules of the game' - is there value in reverse-engineering systems like this, or does it kill the art?"
    }
  ],

  "positivity": [
    {
      theirNiche: "positivity",
      yourExperience: "building_from_zero",
      connectionPoint: "Optimism despite current reality",
      authenticQuestion: "At 0 users and 3 followers, staying positive requires ignoring reality a bit. Is that healthy optimism or delusion?"
    }
  ],

  // ============================================
  // FINANCE / BUSINESS / INVESTING
  // ============================================
  "finance": [
    {
      theirNiche: "finance",
      yourExperience: "building_subwise",
      connectionPoint: "Personal finance and subscription management",
      authenticQuestion: "I'm building SubWise because I kept losing track of subscriptions. Do you think subscription creep is a real problem, or just lazy budgeting?"
    },
    {
      theirNiche: "finance",
      yourExperience: "bootstrapped_indie_hacking",
      connectionPoint: "Capital efficiency and bootstrapping",
      authenticQuestion: "Building without funding forces creativity. Does bootstrapping create better businesses, or just slower growth?"
    }
  ],

  "investing": [
    {
      theirNiche: "investing",
      yourExperience: "x_algorithm_study",
      connectionPoint: "Data-driven decision making",
      authenticQuestion: "I analyzed X's algorithm to understand what drives engagement. Do you apply similar reverse-engineering to investment research?"
    }
  ],

  // ============================================
  // HEALTH / FITNESS / LIFESTYLE
  // ============================================
  "fitness": [
    {
      theirNiche: "fitness",
      yourExperience: "mma_training",
      connectionPoint: "Training methodology and discipline",
      authenticQuestion: "Training MMA taught me consistency matters more than intensity. Does that apply to [their specific fitness approach]?"
    }
  ],

  "health": [
    {
      theirNiche: "health",
      yourExperience: "building_long_hours",
      connectionPoint: "Work-life balance and burnout",
      authenticQuestion: "Building 2 projects while training MMA - when did you realize overworking was counterproductive?"
    }
  ],

  // ============================================
  // SAAS / TECH / PRODUCT
  // ============================================
  "saas": [
    {
      theirNiche: "saas",
      yourExperience: "building_subwise",
      connectionPoint: "Direct shared experience",
      authenticQuestion: "Building SubWise at 0 users - [specific question about THEIR experience at early stage]"
    },
    {
      theirNiche: "saas",
      yourExperience: "solo_indie_hacking",
      connectionPoint: "Solo founder challenges",
      authenticQuestion: "[Ask about their specific challenge as a solo founder]"
    }
  ],

  "ai": [
    {
      theirNiche: "ai",
      yourExperience: "claude_api_integration",
      connectionPoint: "Real experience with LLM APIs",
      authenticQuestion: "Integrated Claude API for reply generation - [specific question about THEIR AI use case]"
    },
    {
      theirNiche: "ai",
      yourExperience: "x_reply_optimizer",
      connectionPoint: "AI + domain-specific rules",
      authenticQuestion: "Combined Claude with X algorithm rules (75x author reply weight). Does combining AI with domain constraints work better than pure AI?"
    }
  ],

  "no_code": [
    {
      theirNiche: "no_code",
      yourExperience: "convex_database",
      connectionPoint: "Modern backend-as-a-service",
      authenticQuestion: "Using Convex (BaaS) let me skip backend setup. Is no-code the same idea - trade control for speed?"
    }
  ],

  // ============================================
  // MARKETING / CONTENT / GROWTH
  // ============================================
  "content_creation": [
    {
      theirNiche: "content_creation",
      yourExperience: "x_algorithm_study",
      connectionPoint: "Understanding platform algorithms",
      authenticQuestion: "I studied X's algorithm to understand what gets distribution. Do you reverse-engineer platforms like this, or focus purely on quality?"
    },
    {
      theirNiche: "content_creation",
      yourExperience: "building_in_public",
      connectionPoint: "Building audience through transparency",
      authenticQuestion: "Documenting my 3 → 250 follower journey. Does building in public actually work at day 1, or only after you have traction?"
    }
  ],

  "marketing": [
    {
      theirNiche: "marketing",
      yourExperience: "strategic_x_growth",
      connectionPoint: "Data-driven growth strategies",
      authenticQuestion: "Using X algorithm weights (75x author reply) to prioritize engagement types. Is this too analytical, or smart marketing?"
    }
  ],

  // ============================================
  // PRODUCTIVITY / TIME MANAGEMENT
  // ============================================
  "productivity": [
    {
      theirNiche: "productivity",
      yourExperience: "balancing_projects",
      connectionPoint: "Managing multiple projects",
      authenticQuestion: "Building SubWise + Reply Optimizer + training MMA. Is juggling multiple projects productive, or diluted focus?"
    },
    {
      theirNiche: "productivity",
      yourExperience: "shipping_fast",
      connectionPoint: "Bias toward action",
      authenticQuestion: "Shipped Reply Optimizer in [X days] despite bugs. Does 'done > perfect' actually work long-term?"
    }
  ],

  // ============================================
  // DESIGN / UI/UX
  // ============================================
  "design": [
    {
      theirNiche: "design",
      yourExperience: "building_user_interfaces",
      connectionPoint: "Developer perspective on design",
      authenticQuestion: "As a developer building UIs, I focus on functionality first. Does that create bad design, or pragmatic products?"
    }
  ],

  // ============================================
  // E-COMMERCE / BUSINESS
  // ============================================
  "ecommerce": [
    {
      theirNiche: "ecommerce",
      yourExperience: "subscription_business_model",
      connectionPoint: "Recurring revenue and subscriptions",
      authenticQuestion: "Building a subscription tracker because I hate managing my own. Are subscriptions good business or customer trap?"
    }
  ],

  // ============================================
  // WRITING / STORYTELLING
  // ============================================
  "writing": [
    {
      theirNiche: "writing",
      yourExperience: "x_algorithm_understanding",
      connectionPoint: "Writing for algorithms vs humans",
      authenticQuestion: "Optimizing replies for X algorithm (author response weight, etc.). Does writing for algorithms kill authenticity?"
    }
  ],
};

/**
 * Find crossover angles between your authentic experiences and their niche
 */
export function findCrossoverAngles(creatorNiche: string): CrossoverAngle[] {
  // Direct match
  if (NICHE_CROSSOVERS[creatorNiche.toLowerCase()]) {
    return NICHE_CROSSOVERS[creatorNiche.toLowerCase()];
  }

  // Fuzzy match - find related niches
  const relatedNiches = Object.keys(NICHE_CROSSOVERS).filter(niche =>
    creatorNiche.toLowerCase().includes(niche) || niche.includes(creatorNiche.toLowerCase())
  );

  if (relatedNiches.length > 0) {
    return NICHE_CROSSOVERS[relatedNiches[0]];
  }

  // Fallback - generic curiosity angles
  return [
    {
      theirNiche: creatorNiche,
      yourExperience: "building_in_public",
      connectionPoint: "Learning from different fields",
      authenticQuestion: `I'm just starting (3 followers, building first SaaS). How does ${creatorNiche} thinking apply to early-stage building?`
    },
    {
      theirNiche: creatorNiche,
      yourExperience: "strategic_thinking",
      connectionPoint: "Systems and frameworks",
      authenticQuestion: `Studied X's algorithm for engagement patterns. Do you apply similar analytical thinking to ${creatorNiche}?`
    }
  ];
}

/**
 * Select the BEST crossover angle based on tweet content
 */
export function selectBestCrossover(
  angles: CrossoverAngle[],
  tweetContent: string
): CrossoverAngle {
  // Simple heuristic: match keywords in tweet to crossover connection points
  const tweetLower = tweetContent.toLowerCase();

  const scoredAngles = angles.map(angle => {
    let score = 0;

    // Check if tweet mentions connection point keywords
    const connectionWords = angle.connectionPoint.toLowerCase().split(' ');
    connectionWords.forEach(word => {
      if (word.length > 4 && tweetLower.includes(word)) {
        score += 10;
      }
    });

    // Prefer non-MMA angles for variety (unless tweet is about discipline/training)
    if (!angle.yourExperience.includes('mma') || tweetLower.includes('discipline') || tweetLower.includes('training')) {
      score += 5;
    }

    return { angle, score };
  });

  // Return highest scoring angle
  scoredAngles.sort((a, b) => b.score - a.score);
  return scoredAngles[0].angle;
}

/**
 * Generate crossover positioning for reply
 */
export function generateCrossoverPositioning(
  creatorNiche: string,
  tweetContent: string
): {
  angles: CrossoverAngle[];
  bestAngle: CrossoverAngle;
  positioning: string;
} {
  const angles = findCrossoverAngles(creatorNiche);
  const bestAngle = selectBestCrossover(angles, tweetContent);

  const positioning = `
CROSSOVER POSITIONING:
Their Niche: ${creatorNiche}
Your Angle: ${bestAngle.yourExperience.replace(/_/g, ' ')}
Connection: ${bestAngle.connectionPoint}

STRATEGY: Don't pretend to know ${creatorNiche}. Instead, bridge from YOUR authentic experience (${bestAngle.yourExperience}) to THEIR insight through the connection point (${bestAngle.connectionPoint}).

Example Question: ${bestAngle.authenticQuestion}
`.trim();

  return { angles, bestAngle, positioning };
}
