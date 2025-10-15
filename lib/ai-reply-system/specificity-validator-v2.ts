/**
 * SPECIFICITY & AUTHENTICITY VALIDATOR V2
 *
 * CRITICAL: NO FAKE STORIES. NO MADE-UP METRICS.
 *
 * This validator catches:
 * 1. Generic language → "I've found" (vague)
 * 2. FAKE METRICS → "At 5K MRR" (YOU DON'T HAVE THIS!)
 * 3. FAKE STORIES → "When we scaled" (NEVER HAPPENED!)
 *
 * Strategy: When you DON'T have experience → ASK GENUINE QUESTIONS
 */

export interface SpecificityIssue {
  type: 'vague_claim' | 'generic_question' | 'fake_metric' | 'fake_story' | 'fake_expertise';
  text: string;
  explanation: string;
  fix: string;
  severity: 'critical' | 'warning';
}

export interface SpecificityReport {
  passed: boolean;
  authentic: boolean; // NEW: Is this reply honest?
  score: number;
  issues: SpecificityIssue[];
  improvementInstructions: string;
}

// Catch FAKE metrics (you're at 0 users, $0 MRR!)
const FAKE_METRIC_PATTERNS = [
  {
    pattern: /\b(\d+[KkMm]?\s*(MRR|ARR|revenue))\b/gi,
    severity: 'critical' as const,
    fix: 'BE HONEST: "I\'m at $0 building SubWise - what revenue milestone felt most significant for you?"'
  },
  {
    pattern: /\b(\d{3,}\s*(users|customers|subscribers))\b/gi,
    severity: 'critical' as const,
    fix: 'BE HONEST: "I\'m at 0 users - what was your biggest challenge going 0 → first 100?"'
  },
  {
    pattern: /\b(hit|reached|scaled to|grew to)\s+\d+[KkMm]?\b/gi,
    severity: 'critical' as const,
    fix: 'BE CURIOUS: "I haven\'t hit these numbers yet - how did you approach this milestone?"'
  },
];

// Catch FAKE stories/experiences
const FAKE_STORY_PATTERNS = [
  {
    pattern: /\b(when (we|I) (scaled|grew|hit|reached|launched))\b/gi,
    severity: 'critical' as const,
    fix: 'BE HONEST: "I\'m just starting - what did you learn during that phase?"',
    exceptions: ['building', 'learning', 'starting', 'trying', 'exploring']
  },
  {
    pattern: /\b(at (my|our) (company|startup|business))\b/gi,
    severity: 'critical' as const,
    fix: 'BE HONEST: "I\'m building my first SaaS - what was your experience at this stage?"'
  },
  {
    pattern: /\b(after \d+\s+(years?|months?) of)\b/gi,
    severity: 'critical' as const,
    fix: 'BE HONEST: "I\'m early in my journey - how did your approach evolve over time?"'
  },
];

// Catch FAKE expertise claims
const FAKE_EXPERTISE_PATTERNS = [
  {
    pattern: /\b(I've found that|In my experience|I've learned that|After years)\b/gi,
    severity: 'warning' as const,
    fix: 'BE CURIOUS: "I\'m exploring this now - what did you discover about..."',
    exceptions: ['building', 'just started', 'learning']
  },
];

// Catch FAKE research/studies (NEW - catching "Analyzed 47 logs" type claims)
const FAKE_RESEARCH_PATTERNS = [
  {
    pattern: /\b(analyzed|tracked|studied|researched|tested|examined)\s+\d+/gi,
    severity: 'critical' as const,
    fix: 'BE HONEST: You haven\'t done this research! Either ask a genuine question OR reference the ONE study you did: "I studied X\'s open-source algorithm..."'
  },
  {
    pattern: /\b(across|over|from)\s+\d+\+?\s*(accounts|users|companies|builds|projects|cases|logs)/gi,
    severity: 'critical' as const,
    fix: 'BE HONEST: You haven\'t tracked multiple accounts/projects! Ask: "Have you seen this pattern in your own data?"'
  },
  {
    pattern: /\b(data shows?|research shows?|studies show|analysis reveals?)\b/gi,
    severity: 'critical' as const,
    fix: 'BE HONEST: Don\'t cite fake research! Either ask a question OR reference the ONE thing you studied: X algorithm weights'
  },
  {
    pattern: /\b\d+\.?\d*x\s*(faster|more|better|higher|lower)/gi,
    severity: 'critical' as const,
    fix: 'BE HONEST: Don\'t invent multipliers like "2.1x faster"! You don\'t have this data. Ask a genuine question instead.'
  },
];

// Catch VAGUE language (these are warnings, not critical)
const VAGUE_PATTERNS = [
  {
    pattern: /\b(can really|actually|definitely|totally|absolutely)\b/gi,
    severity: 'warning' as const,
    fix: 'Be more specific with your observation or question'
  },
  {
    pattern: /\b(speed(s)? things up|make(s)? things better|help(s)? a lot)\b/gi,
    severity: 'warning' as const,
    fix: 'Use measurable terms if asking: "how much faster" or "by what margin"'
  },
];

/**
 * Validate reply for authenticity + specificity
 */
export function validateAuthenticSpecificity(reply: string, iteration: number = 1): SpecificityReport {
  const issues: SpecificityIssue[] = [];

  // CRITICAL: Check for FAKE metrics
  FAKE_METRIC_PATTERNS.forEach(({ pattern, severity, fix }) => {
    const matches = reply.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Exception: "0 users", "3 followers", "$0 MRR" are TRUE
        const isTrueMetric = /\b(0|3)\s*(users?|followers?)\b/gi.test(match) || /\$0/gi.test(match);
        if (!isTrueMetric) {
          issues.push({
            type: 'fake_metric',
            text: match,
            explanation: `🚨 FAKE METRIC: "${match}" - You DON'T have this!`,
            fix,
            severity
          });
        }
      });
    }
  });

  // CRITICAL: Check for FAKE stories
  FAKE_STORY_PATTERNS.forEach(({ pattern, severity, fix, exceptions }) => {
    const matches = reply.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Exception: "when I started", "when I'm building" are TRUE
        const isAuthentic = exceptions?.some(ex => match.toLowerCase().includes(ex));
        if (!isAuthentic) {
          issues.push({
            type: 'fake_story',
            text: match,
            explanation: `🚨 FAKE STORY: "${match}" - This never happened to you!`,
            fix,
            severity
          });
        }
      });
    }
  });

  // CRITICAL: Check for FAKE research/studies
  FAKE_RESEARCH_PATTERNS.forEach(({ pattern, severity, fix }) => {
    const matches = reply.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Exception: "studied X algorithm" or "studied the open-source" (actually did this!)
        const isRealStudy = /studied.*x.*algorithm|studied.*open.*source/gi.test(reply);
        if (!isRealStudy) {
          issues.push({
            type: 'fake_metric',
            text: match,
            explanation: `🚨 FAKE RESEARCH: "${match}" - You haven't done this analysis!`,
            fix,
            severity
          });
        }
      });
    }
  });

  // WARNING: Check for FAKE expertise claims
  FAKE_EXPERTISE_PATTERNS.forEach(({ pattern, severity, fix, exceptions }) => {
    const matches = reply.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const isAuthentic = exceptions?.some(ex => match.toLowerCase().includes(ex));
        if (!isAuthentic) {
          issues.push({
            type: 'fake_expertise',
            text: match,
            explanation: `⚠️  FAKE EXPERTISE: "${match}" - You're a beginner, not an expert!`,
            fix,
            severity
          });
        }
      });
    }
  });

  // WARNING: Check for vague language
  VAGUE_PATTERNS.forEach(({ pattern, severity, fix }) => {
    const matches = reply.match(pattern);
    if (matches) {
      matches.forEach(match => {
        issues.push({
          type: 'vague_claim',
          text: match,
          explanation: `Vague language: "${match}"`,
          fix,
          severity
        });
      });
    }
  });

  // Check authenticity: FAIL if any critical issues
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const authentic = criticalIssues.length === 0;

  // Calculate score
  let score = 100;
  score -= criticalIssues.length * 40; // -40 for each fake metric/story (SEVERE!)
  score -= issues.filter(i => i.severity === 'warning').length * 10;
  score = Math.max(0, score);

  // Pass only if authentic AND reasonable score
  const passed = authentic && score >= 60;

  // Build improvement instructions
  const improvementInstructions = !passed
    ? buildAuthenticImprovementInstructions(issues, iteration)
    : '';

  return {
    passed,
    authentic,
    score,
    issues,
    improvementInstructions,
  };
}

function buildAuthenticImprovementInstructions(
  issues: SpecificityIssue[],
  iteration: number
): string {
  const instructions: string[] = [];

  instructions.push(`🚨 AUTHENTICITY/SPECIFICITY FAILURE (Iteration ${iteration})\n`);

  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const warningIssues = issues.filter(i => i.severity === 'warning');

  // Show critical issues first
  if (criticalIssues.length > 0) {
    instructions.push(`❌ CRITICAL - FAKE CONTENT DETECTED:`);
    criticalIssues.forEach(issue => {
      instructions.push(`   • ${issue.explanation}`);
      instructions.push(`     Fix: ${issue.fix}`);
    });
    instructions.push('');
  }

  // Show warnings
  if (warningIssues.length > 0 && warningIssues.length <= 3) {
    instructions.push(`⚠️  WARNINGS:`);
    warningIssues.forEach(issue => {
      instructions.push(`   • ${issue.explanation}`);
    });
    instructions.push('');
  }

  // Provide AUTHENTIC examples
  instructions.push(`✅ AUTHENTIC EXAMPLES (use these strategies):\n`);

  instructions.push(`Strategy 1: GENUINE CURIOSITY (best for topics you don't have experience in)`);
  instructions.push(`   "Your point about scaling to 10K users resonates. I'm at 0 users building`);
  instructions.push(`   SubWise - what was your biggest challenge going 0 → first 100?"`);
  instructions.push(``);
  instructions.push(`   Why this works:`);
  instructions.push(`   ✓ HONEST about your stage ("0 users")`);
  instructions.push(`   ✓ SPECIFIC question ("0 → first 100")`);
  instructions.push(`   ✓ Shows you understand their journey`);
  instructions.push(``);

  instructions.push(`Strategy 2: GENUINE LEARNING (for topics you're exploring)`);
  instructions.push(`   "Your AI automation approach is interesting. I'm building a reply tool`);
  instructions.push(`   with Claude for my 30-day growth challenge - how do you balance speed vs quality?"`);
  instructions.push(``);
  instructions.push(`   Why this works:`);
  instructions.push(`   ✓ HONEST about what you're building`);
  instructions.push(`   ✓ SPECIFIC context ("reply tool", "30-day challenge")`);
  instructions.push(`   ✓ Asks about their specific approach`);
  instructions.push(``);

  instructions.push(`Strategy 3: GENUINE STRUGGLE (for shared challenges)`);
  instructions.push(`   "The discipline part hits home. I train MMA and try to apply that`);
  instructions.push(`   consistency to building SubWise daily - do you find physical training helps?"`);
  instructions.push(``);
  instructions.push(`   Why this works:`);
  instructions.push(`   ✓ HONEST about your practice (MMA training, building SubWise)`);
  instructions.push(`   ✓ SPECIFIC connection (discipline, consistency)`);
  instructions.push(`   ✓ Genuine question about their experience`);
  instructions.push(``);

  instructions.push(`⚠️  CRITICAL RULE:`);
  instructions.push(`   NEVER claim:`);
  instructions.push(`   ❌ Any MRR/revenue (you're at $0)`);
  instructions.push(`   ❌ User counts above 0 (you have 0 users)`);
  instructions.push(`   ❌ Years of experience (you're just starting)`);
  instructions.push(`   ❌ Scaling stories (you haven't scaled anything yet)`);
  instructions.push(``);
  instructions.push(`   INSTEAD:`);
  instructions.push(`   ✅ Ask from beginner perspective`);
  instructions.push(`   ✅ Share what you're currently building/learning`);
  instructions.push(`   ✅ Be curious about their journey`);
  instructions.push(`   ✅ Reference your actual stage (3 followers, 0 users, building SubWise)`);
  instructions.push(``);
  instructions.push(`REGENERATE with AUTHENTIC content. NO FAKE STORIES!`);

  return instructions.join('\n');
}

/**
 * Quick authentic check
 */
export function isAuthenticReply(reply: string): boolean {
  const report = validateAuthenticSpecificity(reply);
  return report.authentic;
}
