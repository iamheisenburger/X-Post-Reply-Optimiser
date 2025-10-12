/**
 * SPECIFICITY VALIDATOR
 *
 * This is the MISSING PIECE in your system!
 *
 * Problem: OpenAI generates replies that PASS structure checks but FAIL substance checks
 * - "I've found that X works" ❌ (generic, vague)
 * - "At 5K MRR we tested X for 3 weeks, saw Y result" ✅ (concrete, specific)
 *
 * This validator catches generic language BEFORE it reaches quality gates
 * and provides CONCRETE examples to force specificity.
 */

export interface SpecificityIssue {
  type: 'vague_claim' | 'generic_question' | 'no_numbers' | 'no_timeframe' | 'no_scenario' | 'template_language';
  text: string;
  explanation: string;
  fix: string;
}

export interface SpecificityReport {
  passed: boolean;
  score: number; // 0-100
  issues: SpecificityIssue[];
  concreteElements: {
    hasNumbers: boolean;
    hasTimeframe: boolean;
    hasScenario: boolean;
    hasActionVerbs: boolean;
  };
  improvementInstructions: string;
}

const VAGUE_PATTERNS = [
  /\b(I've found|I've noticed|I've seen|I think|I believe|In my experience)\b/gi,
  /\b(can really|actually|definitely|totally|absolutely)\b/gi,
  /\b(speed(s)? things up|make(s)? things better|help(s)? a lot|work(s)? well)\b/gi,
  /\b(great point|good idea|interesting|fascinating|amazing)\b/gi,
];

const GENERIC_QUESTION_PATTERNS = [
  /What (do you think|are your thoughts|would you say)\?/gi,
  /How do you (handle|deal with|approach) this\?/gi,
  /What metrics do you (use|track)\?/gi,
];

const CONCRETE_INDICATORS = {
  numbers: /\b(\d+[KkMm]?\s*(MRR|ARR|users|%|x|times|weeks|months|days)|\d+%|\d+x)\b/gi,
  timeframes: /\b(last (week|month|quarter|year)|over \d+ (weeks|months)|in \d+ (days|weeks)|at \d+K MRR)\b/gi,
  scenarios: /\b(at \d+K MRR|when (we|I) (built|launched|tested|implemented)|in (production|development))\b/gi,
  actionVerbs: /\b(tested|implemented|measured|built|launched|reduced|increased|automated|analyzed|deployed)\b/gi,
};

const TEMPLATE_PHRASES = [
  /\[.*?\]/g, // Brackets like [METRIC] or [ACTION]
  /\b(something|things|stuff|ways|methods|approaches)\b/gi,
];

/**
 * Validate reply for specificity - catches generic language early
 */
export function validateSpecificity(reply: string, iteration: number = 1): SpecificityReport {
  const issues: SpecificityIssue[] = [];

  // Check for vague claims
  VAGUE_PATTERNS.forEach(pattern => {
    const matches = reply.match(pattern);
    if (matches) {
      matches.forEach(match => {
        issues.push({
          type: 'vague_claim',
          text: match,
          explanation: `"${match}" is too vague - when/where/what specifically?`,
          fix: 'Replace with concrete context like "At 5K MRR" or "Last month when we tested X"'
        });
      });
    }
  });

  // Check for generic questions
  GENERIC_QUESTION_PATTERNS.forEach(pattern => {
    const matches = reply.match(pattern);
    if (matches) {
      matches.forEach(match => {
        issues.push({
          type: 'generic_question',
          text: match,
          explanation: `"${match}" is too broad - anyone could ask this`,
          fix: 'Ask specific to their situation: "What safety nets did you add?" or "How did you handle X in your stack?"'
        });
      });
    }
  });

  // Check for template language
  TEMPLATE_PHRASES.forEach(pattern => {
    const matches = reply.match(pattern);
    if (matches) {
      matches.forEach(match => {
        issues.push({
          type: 'template_language',
          text: match,
          explanation: `"${match}" reads like a template - be specific`,
          fix: 'Replace with exact details: "deployment reviews" not "things", "3x faster" not "improvements"'
        });
      });
    }
  });

  // Check for concrete elements
  const hasNumbers = CONCRETE_INDICATORS.numbers.test(reply);
  const hasTimeframe = CONCRETE_INDICATORS.timeframes.test(reply);
  const hasScenario = CONCRETE_INDICATORS.scenarios.test(reply);
  const hasActionVerbs = CONCRETE_INDICATORS.actionVerbs.test(reply);

  // Count missing concrete elements
  if (!hasNumbers) {
    issues.push({
      type: 'no_numbers',
      text: '[entire reply]',
      explanation: 'No specific numbers/metrics found',
      fix: 'Add: "5K MRR", "3x faster", "40% reduction", "2 weeks", etc.'
    });
  }

  if (!hasTimeframe) {
    issues.push({
      type: 'no_timeframe',
      text: '[entire reply]',
      explanation: 'No timeframe mentioned',
      fix: 'Add: "last month", "over 3 weeks", "at 5K MRR", "in Q4", etc.'
    });
  }

  if (!hasScenario) {
    issues.push({
      type: 'no_scenario',
      text: '[entire reply]',
      explanation: 'No concrete scenario described',
      fix: 'Add: "When we built X", "At [Company]", "During our launch", etc.'
    });
  }

  // Calculate score
  const concreteElementCount = [hasNumbers, hasTimeframe, hasScenario, hasActionVerbs].filter(Boolean).length;
  const issueCount = issues.length;

  // Score formula:
  // - Start at 100
  // - -20 for each missing concrete element (need at least 2 of 4)
  // - -10 for each vague/generic issue
  let score = 100;
  score -= (4 - concreteElementCount) * 20;
  score -= Math.min(issueCount, 5) * 10;
  score = Math.max(0, score);

  // Pass if: score >= 60 OR has at least 2 concrete elements
  const passed = score >= 60 || concreteElementCount >= 2;

  // Build improvement instructions
  let improvementInstructions = '';

  if (!passed) {
    improvementInstructions = buildImprovementInstructions(issues, {
      hasNumbers,
      hasTimeframe,
      hasScenario,
      hasActionVerbs,
    }, iteration);
  }

  return {
    passed,
    score,
    issues,
    concreteElements: {
      hasNumbers,
      hasTimeframe,
      hasScenario,
      hasActionVerbs,
    },
    improvementInstructions,
  };
}

function buildImprovementInstructions(
  issues: SpecificityIssue[],
  elements: { hasNumbers: boolean; hasTimeframe: boolean; hasScenario: boolean; hasActionVerbs: boolean },
  iteration: number
): string {
  const instructions: string[] = [];

  instructions.push(`🚨 SPECIFICITY FAILURE (Iteration ${iteration})\n`);

  // Show what's missing
  const missing: string[] = [];
  if (!elements.hasNumbers) missing.push('numbers/metrics (e.g., "5K MRR", "3x faster", "40%")');
  if (!elements.hasTimeframe) missing.push('timeframe (e.g., "last month", "over 3 weeks")');
  if (!elements.hasScenario) missing.push('concrete scenario (e.g., "When we built X", "At [Company]")');
  if (!elements.hasActionVerbs) missing.push('action verbs (e.g., "tested", "implemented", "measured")');

  if (missing.length > 0) {
    instructions.push(`❌ MISSING CONCRETE ELEMENTS:`);
    missing.forEach(m => instructions.push(`   • ${m}`));
    instructions.push('');
  }

  // Show specific issues found
  if (issues.length > 0) {
    instructions.push(`❌ ISSUES FOUND:`);
    const uniqueIssues = issues.slice(0, 5); // Top 5
    uniqueIssues.forEach(issue => {
      instructions.push(`   • ${issue.explanation}`);
      instructions.push(`     Fix: ${issue.fix}`);
    });
    instructions.push('');
  }

  // Provide CONCRETE example (this is the key!)
  instructions.push(`✅ CONCRETE EXAMPLE (93/100 score):`);
  instructions.push(`   "Your point about cutting AI approval steps resonates. At 5K MRR we`);
  instructions.push(`   automated deployment reviews, saw 3x faster deploys but added automated`);
  instructions.push(`   testing gates to catch issues. What safety nets did you add?"`);
  instructions.push('');
  instructions.push(`   Why this works:`);
  instructions.push(`   ✓ Specific context: "At 5K MRR" (not "I've found")`);
  instructions.push(`   ✓ Concrete scenario: "automated deployment reviews" (not "approval steps")`);
  instructions.push(`   ✓ Measurable result: "3x faster" (not "speeds up")`);
  instructions.push(`   ✓ Specific solution: "automated testing gates" (not "quality controls")`);
  instructions.push(`   ✓ Contextual question: "What safety nets" (not "What metrics")`);
  instructions.push('');

  instructions.push(`⚠️  CRITICAL REQUIREMENTS:`);
  instructions.push(`   Reply MUST include at least 2 of:`);
  instructions.push(`   1. Specific numbers (5K MRR, 3x, 40%, 2 weeks)`);
  instructions.push(`   2. Timeframe (last month, over 3 weeks, at 5K MRR)`);
  instructions.push(`   3. Concrete scenario (when we built X, at [Company], during launch)`);
  instructions.push(`   4. Action verbs (tested, implemented, measured, reduced)`);
  instructions.push('');
  instructions.push(`REGENERATE with CONCRETE details. No more "I've found" or "can really" - be SPECIFIC!`);

  return instructions.join('\n');
}

/**
 * Quick check - does this reply pass minimum specificity threshold?
 */
export function passesSpecificityThreshold(reply: string): boolean {
  const report = validateSpecificity(reply);
  return report.passed;
}

/**
 * Get specificity score only (0-100)
 */
export function getSpecificityScore(reply: string): number {
  const report = validateSpecificity(reply);
  return report.score;
}
