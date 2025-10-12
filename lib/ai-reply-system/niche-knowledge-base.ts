/**
 * NICHE KNOWLEDGE BASE
 *
 * Authentic questions you can ask in ANY niche - no personal story required
 * These are UNIVERSAL questions that work across topics
 */

export interface NicheQuestion {
  question: string;
  type: "curiosity" | "devils_advocate" | "practical" | "edge_case" | "synthesis" | "comparative";
  tags: string[];
}

export const UNIVERSAL_QUESTIONS: NicheQuestion[] = [
  // Meta-cognitive questions (work for any insight)
  { question: "What made you realize this vs the conventional approach?", type: "curiosity", tags: ["insight", "realization"] },
  { question: "How long did it take you to figure this out?", type: "curiosity", tags: ["learning", "journey"] },
  { question: "What's the counterargument you hear most often?", type: "devils_advocate", tags: ["debate", "pushback"] },
  { question: "Where does this break down? What's the edge case?", type: "edge_case", tags: ["limitation", "boundary"] },
  { question: "Is this universally true, or context-dependent?", type: "devils_advocate", tags: ["scope", "nuance"] },

  // Process/methodology questions
  { question: "What's step 1 for someone starting from zero?", type: "practical", tags: ["beginner", "actionable"] },
  { question: "How would you apply this to [specific scenario]?", type: "practical", tags: ["application", "concrete"] },
  { question: "What's the most common mistake people make applying this?", type: "curiosity", tags: ["pitfalls", "errors"] },
  { question: "Does this work at small scale, or only after you have traction?", type: "edge_case", tags: ["scale", "stage"] },

  // Comparative/synthesis questions
  { question: "How does this compare to [alternative approach]?", type: "synthesis", tags: ["comparison", "alternatives"] },
  { question: "This reminds me of [concept] - what's the connection?", type: "synthesis", tags: ["patterns", "frameworks"] },
  { question: "Is this a new insight, or a reframing of [existing idea]?", type: "synthesis", tags: ["novelty", "perspective"] },

  // Challenge/tension questions
  { question: "But doesn't that contradict [common belief]?", type: "devils_advocate", tags: ["contradiction", "challenge"] },
  { question: "What if you're wrong? What would that look like?", type: "devils_advocate", tags: ["falsifiability", "risk"] },
  { question: "Isn't this just survivor bias?", type: "devils_advocate", tags: ["bias", "validity"] },
];

export const NICHE_SPECIFIC_QUESTIONS: Record<string, NicheQuestion[]> = {
  // ============================================
  // MINDSET / PHILOSOPHY / PERSONAL DEVELOPMENT
  // ============================================
  mindset: [
    { question: "Does positive thinking work before you have evidence it will?", type: "devils_advocate", tags: ["optimism", "evidence"] },
    { question: "Can discipline become toxic when it ignores burnout signals?", type: "devils_advocate", tags: ["discipline", "balance"] },
    { question: "Is motivation overrated compared to systems?", type: "devils_advocate", tags: ["motivation", "systems"] },
    { question: "How do you maintain hope when there's no validation yet?", type: "curiosity", tags: ["hope", "early_stage"] },
    { question: "What's the difference between resilience and stubbornness?", type: "curiosity", tags: ["resilience", "persistence"] },
    { question: "Does mental toughness from physical training actually transfer to other domains?", type: "edge_case", tags: ["transfer", "training"] },
    { question: "Is 'growth mindset' measurable, or just feel-good language?", type: "devils_advocate", tags: ["growth", "measurement"] },
    { question: "Can you have too much self-awareness? When does it become paralysis?", type: "edge_case", tags: ["awareness", "action"] },
  ],

  philosophy: [
    { question: "Does understanding the 'rules of the game' kill the art?", type: "devils_advocate", tags: ["systems", "creativity"] },
    { question: "Is there value in reverse-engineering systems, or does it create cynicism?", type: "devils_advocate", tags: ["analysis", "meaning"] },
    { question: "Can pragmatism and idealism coexist, or do you have to choose?", type: "curiosity", tags: ["balance", "worldview"] },
    { question: "Is immediate feedback (like in combat) better for learning than delayed feedback (like in building)?", type: "comparative", tags: ["feedback", "learning"] },
  ],

  positivity: [
    { question: "Is ignoring current reality to stay positive healthy optimism or delusion?", type: "devils_advocate", tags: ["optimism", "reality"] },
    { question: "At what point does 'staying positive' become toxic positivity?", type: "edge_case", tags: ["positivity", "authenticity"] },
  ],

  // ============================================
  // BUSINESS / ENTREPRENEURSHIP
  // ============================================
  saas: [
    { question: "Does 0 → 1 user require different skills than 100 → 1000?", type: "curiosity", tags: ["scaling", "skills"] },
    { question: "Is building in public smart marketing or just noise?", type: "devils_advocate", tags: ["transparency", "marketing"] },
    { question: "Do bootstrapped companies build better products than funded ones?", type: "devils_advocate", tags: ["funding", "quality"] },
    { question: "At what user count does 'manual onboarding' become unsustainable?", type: "practical", tags: ["operations", "scale"] },
    { question: "Is subscription fatigue a real problem or just lazy budgeting?", type: "devils_advocate", tags: ["subscriptions", "ux"] },
  ],

  indie_hacking: [
    { question: "Does building tools for yourself create better products or blind spots?", type: "devils_advocate", tags: ["dogfooding", "bias"] },
    { question: "Is solo founding liberating or just slower growth?", type: "devils_advocate", tags: ["solo", "cofounder"] },
    { question: "Does bootstrapping force creativity or just limit potential?", type: "devils_advocate", tags: ["bootstrapping", "resources"] },
  ],

  startup: [
    { question: "Is product-market fit binary or a spectrum?", type: "curiosity", tags: ["pmf", "metrics"] },
    { question: "Can you have too much user feedback early on?", type: "edge_case", tags: ["feedback", "vision"] },
  ],

  // ============================================
  // MARKETING / GROWTH / CONTENT
  // ============================================
  marketing: [
    { question: "Is optimizing for algorithms too analytical, or smart marketing?", type: "devils_advocate", tags: ["algorithms", "authenticity"] },
    { question: "Does understanding platform mechanics kill creativity?", type: "devils_advocate", tags: ["mechanics", "art"] },
    { question: "Can you reverse-engineer virality, or is it always luck?", type: "curiosity", tags: ["virality", "systems"] },
  ],

  content_creation: [
    { question: "Does writing for algorithms kill authenticity, or just add distribution?", type: "devils_advocate", tags: ["seo", "voice"] },
    { question: "Is consistency overrated? What if quality requires gaps?", type: "devils_advocate", tags: ["consistency", "quality"] },
    { question: "Does studying successful creators help or create copycats?", type: "devils_advocate", tags: ["learning", "originality"] },
  ],

  building_in_public: [
    { question: "Does transparency actually work at day 1, or only after traction?", type: "edge_case", tags: ["timing", "traction"] },
    { question: "Is documenting the journey valuable, or distraction from building?", type: "devils_advocate", tags: ["focus", "marketing"] },
  ],

  // ============================================
  // FINANCE / INVESTING
  // ============================================
  finance: [
    { question: "Is personal finance more about behavior or math?", type: "curiosity", tags: ["psychology", "systems"] },
    { question: "Do financial models work in chaos, or only in stable markets?", type: "edge_case", tags: ["models", "reality"] },
    { question: "Is budgeting empowering or just anxiety-inducing accounting?", type: "devils_advocate", tags: ["budgeting", "mindset"] },
  ],

  investing: [
    { question: "Is data-driven investing better than intuition, or just different risk?", type: "devils_advocate", tags: ["data", "intuition"] },
    { question: "Can retail investors compete with institutional analytics?", type: "curiosity", tags: ["access", "edge"] },
    { question: "Is diversification wisdom or admission you don't understand anything deeply?", type: "devils_advocate", tags: ["diversification", "conviction"] },
  ],

  // ============================================
  // TECH / DEVELOPMENT
  // ============================================
  tech: [
    { question: "Does learning fundamentals matter, or just ship fast and iterate?", type: "devils_advocate", tags: ["fundamentals", "shipping"] },
    { question: "Is technical debt inevitable, or sign of poor planning?", type: "curiosity", tags: ["debt", "architecture"] },
  ],

  ai: [
    { question: "Does combining AI with domain constraints work better than pure AI?", type: "curiosity", tags: ["constraints", "performance"] },
    { question: "Is prompt engineering a real skill or just trial and error?", type: "devils_advocate", tags: ["prompting", "craft"] },
    { question: "Can AI be creative, or just remix existing patterns?", type: "devils_advocate", tags: ["creativity", "originality"] },
  ],

  no_code: [
    { question: "Is no-code the same idea as BaaS - trading control for speed?", type: "synthesis", tags: ["tradeoffs", "tools"] },
    { question: "At what complexity does no-code become more work than code?", type: "edge_case", tags: ["scale", "limits"] },
  ],

  // ============================================
  // PRODUCTIVITY / SYSTEMS
  // ============================================
  productivity: [
    { question: "Is juggling multiple projects productive or diluted focus?", type: "devils_advocate", tags: ["focus", "breadth"] },
    { question: "Does 'done > perfect' actually work long-term, or create technical debt?", type: "edge_case", tags: ["shipping", "quality"] },
    { question: "Can you be too systematic? When do frameworks become cages?", type: "edge_case", tags: ["systems", "flexibility"] },
  ],

  time_management: [
    { question: "Is time management about doing more, or doing less strategically?", type: "curiosity", tags: ["strategy", "essentialism"] },
    { question: "Does multitasking work for anyone, or is it always an illusion?", type: "devils_advocate", tags: ["multitasking", "attention"] },
  ],

  // ============================================
  // DESIGN / CREATIVITY
  // ============================================
  design: [
    { question: "Does function-first design create bad aesthetics, or pragmatic products?", type: "devils_advocate", tags: ["function", "form"] },
    { question: "Can design be too minimal? When does simplicity become confusing?", type: "edge_case", tags: ["minimalism", "ux"] },
    { question: "Is beautiful UI a competitive advantage, or just table stakes now?", type: "curiosity", tags: ["aesthetics", "competition"] },
  ],

  // ============================================
  // HEALTH / FITNESS
  // ============================================
  fitness: [
    { question: "Does consistency matter more than intensity, or is that just for beginners?", type: "edge_case", tags: ["consistency", "intensity"] },
    { question: "Is progressive overload universal, or does it break down somewhere?", type: "edge_case", tags: ["training", "adaptation"] },
  ],

  health: [
    { question: "When does optimization become obsession? What's the threshold?", type: "edge_case", tags: ["optimization", "balance"] },
    { question: "Is tracking everything empowering or anxiety-inducing?", type: "devils_advocate", tags: ["quantified_self", "mental_health"] },
  ],
};

/**
 * Get relevant questions for a niche
 */
export function getQuestionsForNiche(niche: string): NicheQuestion[] {
  const nicheLower = niche.toLowerCase();

  // Try exact match
  if (NICHE_SPECIFIC_QUESTIONS[nicheLower]) {
    return [...UNIVERSAL_QUESTIONS, ...NICHE_SPECIFIC_QUESTIONS[nicheLower]];
  }

  // Try fuzzy match
  const matchedNiche = Object.keys(NICHE_SPECIFIC_QUESTIONS).find(key =>
    nicheLower.includes(key) || key.includes(nicheLower)
  );

  if (matchedNiche) {
    return [...UNIVERSAL_QUESTIONS, ...NICHE_SPECIFIC_QUESTIONS[matchedNiche]];
  }

  // Fallback to universal questions only
  return UNIVERSAL_QUESTIONS;
}

/**
 * Select best questions based on tweet content
 */
export function selectRelevantQuestions(
  niche: string,
  tweetText: string,
  count: number = 5
): NicheQuestion[] {
  const questions = getQuestionsForNiche(niche);
  const tweetLower = tweetText.toLowerCase();

  // Score each question by relevance
  const scored = questions.map(q => {
    let score = 0;

    // Match tags to tweet content
    q.tags.forEach(tag => {
      if (tweetLower.includes(tag.replace(/_/g, ' '))) {
        score += 10;
      }
    });

    // Boost universal questions slightly (always relevant)
    if (UNIVERSAL_QUESTIONS.includes(q)) {
      score += 5;
    }

    return { question: q, score };
  });

  // Return top N questions
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(s => s.question);
}
