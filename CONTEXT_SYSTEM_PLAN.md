# Dynamic Context System Architecture

## Problem
- Hardcoded metrics (3 followers, 0 users) become outdated
- No learning from daily inputs
- Replies/posts/threads don't know your current journey status
- Claude token limits require smart context management

## Solution: 2 Dynamic Context Systems

### 1. Core Personal Context (Shared)
**Storage:** `convex/personalContext` (already exists)
**Content:**
```typescript
{
  // Profile (from Twitter - set once, rarely updated)
  handle: "@iamheisenburger",
  bio: "...",
  
  // Projects (manually updated as they evolve)
  projects: {
    subwise: {
      description: "Subscription tracker",
      stage: "building" | "launched" | "scaling",
      currentUsers: number,
      currentMRR: number,
      launched: boolean
    },
    xReplyOptimizer: { ... }
  },
  
  // Challenge (manually set)
  challenge: {
    name: "30-day growth challenge",
    startDate: "2025-10-15",
    startFollowers: 3,
    goalFollowers: 250,
    currentDay: number (calculated),
    currentFollowers: number (updated manually/via API)
  },
  
  // Background (set once)
  background: {
    mma: { level: "practitioner", passion: "discipline" },
    saas: { level: "aspiring_founder" },
    tech: { skills: ["Next.js", "Convex", "AI APIs"] }
  }
}
```

**Update Frequency:** Weekly or when major milestones hit

---

### 2. Posts Context (General Building/Learning)
**Storage:** `convex/postsContext` (new table)
**Content:** Accumulated learnings from daily post inputs

```typescript
{
  // Recent detailed (last 7 days)
  recentActivity: [
    {
      date: "2025-10-15",
      day: 1,
      events: ["Built post generator", "Fixed Convex bugs"],
      insights: ["Claude Sonnet 4.5 is way better", "Deployment is hard"],
      struggles: ["Token limits", "Type errors"],
      futurePlans: ["Add analytics", "Launch landing page"],
      metrics: { followers: 7, subwiseUsers: 0, subwiseMRR: 0 }
    },
    // ... 6 more days
  ],
  
  // Summarized older (8-30 days) - weekly summaries
  weeklySummaries: [
    {
      weekOf: "2025-10-08",
      majorWins: ["Launched X Reply Optimizer", "First SubWise prototype"],
      keyLearnings: ["Building in public is hard", "Consistency > perfection"],
      averageMetrics: { followers: 5, users: 0 }
    }
  ],
  
  // Ancient (30+ days) - monthly summaries
  monthlySummaries: [
    {
      monthOf: "2025-09",
      overview: "Started coding journey, learned Next.js, began SubWise"
    }
  ]
}
```

**Update:** Every time user submits daily input on Posts page
**Token Budget:** ~1500 tokens (recent detailed, older compressed)

---

### 3. Threads Context (30-Day Challenge Specific)
**Storage:** `convex/threadsContext` (new table)
**Content:** Accumulated challenge progress

```typescript
{
  // Recent detailed (last 7 days)
  recentDays: [
    {
      date: "2025-10-15",
      challengeDay: 1,
      events: ["Set up systems", "Injured thumb in MMA"],
      insights: ["Preparation != procrastination", "MMA discipline → coding"],
      struggles: ["Context switching", "Brain fragmented"],
      futurePlans: ["Ship analytics dashboard", "First content push"],
      metrics: { 
        followers: 7,
        posts: 0,
        replies: 0,
        engagement: 0
      }
    }
  ],
  
  // Weekly challenge summaries
  weeklySummaries: [
    {
      weekNum: 1,
      dayRange: "1-7",
      followerGrowth: "7 → 15",
      majorMilestones: ["Launched optimizer", "First viral reply"],
      lessonsLearned: ["Hook matters more than length"],
      strugglesOvercome: ["Consistency", "Impostor syndrome"]
    }
  ],
  
  // Challenge stats
  challengeStats: {
    startFollowers: 3,
    currentFollowers: 7,
    goalFollowers: 250,
    bestPost: { content: "...", engagement: 50 },
    bestReply: { content: "...", authorReplied: true }
  }
}
```

**Update:** Every time user submits daily input on Threads page
**Token Budget:** ~1000 tokens (challenge-focused)

---

## Context Building Functions

### For Replies (uses Core + Recent Activity)
```typescript
function buildReplyContext() {
  const core = await getPersonalContext();
  const recentPosts = await getRecentPostsContext(7); // last 7 days
  
  return `
YOUR CURRENT STATUS:
- Challenge: Day ${core.challenge.currentDay}/30 (${core.challenge.currentFollowers} followers, goal 250)
- Building: ${core.projects.subwise.stage} SubWise (${core.projects.subwise.currentUsers} users, $${core.projects.subwise.currentMRR} MRR)
- Background: MMA practitioner, aspiring SaaS founder

RECENT JOURNEY (Last 7 Days):
${recentPosts.map(day => `
Day ${day.day}: ${day.events.join(", ")}
Learned: ${day.insights.join(", ")}
`).join("\n")}

WHAT YOU CAN AUTHENTICALLY TALK ABOUT:
✅ Starting from near-zero (${core.challenge.currentFollowers} followers)
✅ Building first SaaS (SubWise at ${core.projects.subwise.currentUsers} users)
✅ MMA training for discipline
✅ Learning to build in public
✅ Recent struggles: ${recentPosts[0]?.struggles.join(", ")}
✅ Next plans: ${recentPosts[0]?.futurePlans.join(", ")}

WHAT YOU CANNOT CLAIM:
❌ Any MRR above $${core.projects.subwise.currentMRR}
❌ User counts above ${core.projects.subwise.currentUsers}
❌ Years of experience
❌ Fake research or data analysis
`;
}
```

### For Posts (uses Core + Posts Context)
```typescript
function buildPostsContext() {
  const core = await getPersonalContext();
  const postsContext = await getPostsContext();
  
  return `
PERSONAL CONTEXT:
- Current: Day ${core.challenge.currentDay} of ${core.challenge.name}
- Followers: ${core.challenge.startFollowers} → ${core.challenge.currentFollowers} (goal ${core.challenge.goalFollowers})
- Projects: SubWise (${core.projects.subwise.currentUsers} users, $${core.projects.subwise.currentMRR} MRR)

RECENT ACTIVITY (Last 7 Days):
${postsContext.recentActivity.map(day => `
${day.date}: ${day.events.join(", ")}
`).join("\n")}

RECENT LEARNINGS:
${postsContext.recentActivity.flatMap(d => d.insights).slice(0, 10).join("\n- ")}

CURRENT STRUGGLES:
${postsContext.recentActivity[0]?.struggles.join(", ")}

WHAT'S NEXT:
${postsContext.recentActivity[0]?.futurePlans.join(", ")}
`;
}
```

### For Threads (uses Core + Threads Context)
```typescript
function buildThreadsContext() {
  const core = await getPersonalContext();
  const threadsContext = await getThreadsContext();
  
  return `
30-DAY CHALLENGE CONTEXT:
Day ${core.challenge.currentDay}/30
Started: ${core.challenge.startFollowers} followers
Current: ${core.challenge.currentFollowers} followers
Goal: ${core.challenge.goalFollowers} followers

RECENT DAYS:
${threadsContext.recentDays.map(day => `
Day ${day.challengeDay}: ${day.events.join(" • ")}
`).join("\n")}

CHALLENGE ARC:
Week 1: ${threadsContext.weeklySummaries[0]?.majorMilestones.join(", ")}
Lessons: ${threadsContext.weeklySummaries[0]?.lessonsLearned.join(", ")}

TODAY'S CONTEXT:
${threadsContext.recentDays[0]?.events.join("\n")}
`;
}
```

---

## Token Management Strategy

### Recent (Last 7 days): FULL DETAIL
- Keep all events, insights, struggles, plans
- ~200 tokens per day = ~1400 tokens

### Older (8-30 days): WEEKLY SUMMARIES
- Major wins only
- Key learnings only
- ~150 tokens per week = ~450 tokens

### Ancient (30+ days): MONTHLY SUMMARIES
- High-level overview
- ~100 tokens per month = ~200 tokens

**Total Budget per Context: ~2000 tokens**
**Leaves plenty room for:** Prompts (1000), Replies/Posts (2000), Buffer (1000)

---

## Implementation Plan

### Phase 1: Schema & Storage
1. Add `postsContext` and `threadsContext` tables to `convex/schema.ts`
2. Create mutation functions to update contexts
3. Create query functions to retrieve contexts

### Phase 2: Context Management
1. Create `convex/contextManagement.ts` with:
   - `updatePostsContext(dailyInput)` - adds new day, summarizes if needed
   - `updateThreadsContext(dailyInput)` - adds new day, summarizes if needed
   - `getRecentPostsContext(days)` - retrieves recent activity
   - `getRecentThreadsContext(days)` - retrieves recent days
   - `summarizeOldContext()` - runs weekly to compress old data

### Phase 3: Integration
1. Update `app/posts/page.tsx` - call `updatePostsContext` on submit
2. Update `app/threads/page.tsx` - call `updateThreadsContext` on submit
3. Update `lib/ai-reply-system/personal-knowledge-base.ts` - use `buildReplyContext()`
4. Update `app/api/generate-posts/route.ts` - use `buildPostsContext()`
5. Update `app/api/generate-thread/route.ts` - use `buildThreadsContext()`

### Phase 4: Manual Updates
1. Add UI to manually update core context (projects, metrics)
2. Add "Settings" page for updating personal info
3. Optional: Twitter API integration to auto-update followers

---

## Benefits

1. **Always Current:** Context updates daily from your inputs
2. **Authentic Replies:** AI knows your REAL current status, not hardcoded bullshit
3. **Better Posts:** AI references your ACTUAL recent learnings
4. **Better Threads:** AI weaves your REAL challenge journey
5. **Token Efficient:** Recent detailed, old compressed
6. **No Fake Stats:** AI only uses YOUR real data

---

## Next Steps

1. Review this plan - does it match your vision?
2. Implement Phase 1 (schema + storage)
3. Implement Phase 2 (context functions)
4. Implement Phase 3 (integration)
5. Test with real daily inputs

