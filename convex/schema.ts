import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // VIP Target Accounts (50 accounts to engage with)
  targets: defineTable({
    username: v.string(),
    displayName: v.string(),
    userId: v.optional(v.string()),
    followerCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
    bio: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    lastEngaged: v.optional(v.number()), // timestamp
    engagementRate: v.optional(v.number()), // calculated metric
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    tags: v.array(v.string()), // e.g., ["mma", "saas", "tech"]
    notes: v.optional(v.string()),
  })
    .index("by_username", ["username"])
    .index("by_priority", ["priority"]),

  // Your Posts/Replies (tracking what you've created and posted)
  posts: defineTable({
    content: v.string(),
    type: v.union(v.literal("reply"), v.literal("post"), v.literal("thread")),
    targetUsername: v.optional(v.string()), // if it's a reply
    targetTweetId: v.optional(v.string()),
    algorithmScore: v.number(), // 0-100 score based on X algorithm
    scoreBreakdown: v.object({
      engagement: v.number(),
      recency: v.number(),
      mediaPresence: v.number(),
      conversationDepth: v.number(),
      authorReputation: v.number(),
    }),
    status: v.union(
      v.literal("draft"),
      v.literal("optimized"),
      v.literal("posted")
    ),
    postedAt: v.optional(v.number()), // timestamp when actually posted
    performance: v.optional(
      v.object({
        views: v.number(),
        likes: v.number(),
        retweets: v.number(),
        replies: v.number(),
        bookmarks: v.number(),
        profileClicks: v.number(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_target", ["targetUsername"])
    .index("by_created", ["createdAt"]),

  // Content Templates (proven patterns that work)
  templates: defineTable({
    name: v.string(),
    content: v.string(),
    type: v.union(v.literal("reply"), v.literal("post"), v.literal("thread")),
    tags: v.array(v.string()),
    usageCount: v.number(),
    lastUsedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  // Analytics (tracking overall performance)
  analytics: defineTable({
    date: v.string(), // YYYY-MM-DD
    followersGained: v.number(),
    subwiseUsersGained: v.number(),
    totalPosts: v.number(),
    totalReplies: v.number(),
    totalEngagement: v.number(), // sum of likes, retweets, replies
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_date", ["date"]),

  // X Algorithm Rules (for reference and dynamic scoring)
  algorithmRules: defineTable({
    name: v.string(), // e.g., "reply_weight"
    value: v.number(),
    description: v.optional(v.string()),
    category: v.optional(v.string()), // e.g., "engagement", "recency"
  }).index("by_name", ["name"]),

  // Creator Intelligence Profiles (for VIP targets)
  creators: defineTable({
    username: v.string(),
    displayName: v.string(),
    followerCount: v.number(),
    verified: v.boolean(),
    primaryNiche: v.string(), // saas, mma, tech, etc.
    secondaryNiches: v.array(v.string()),
    // Audience demographics
    audiencePrimaryInterests: v.array(v.string()),
    audienceIrrelevantTopics: v.array(v.string()),
    audienceLanguageStyle: v.string(),
    audienceSophisticationLevel: v.string(),
    // Engagement patterns
    respondsTo: v.array(v.string()),
    ignores: v.array(v.string()),
    preferredTone: v.string(),
    // Crossover potential (0-5 scale)
    mmaRelevance: v.number(),
    saasRelevance: v.number(),
    disciplineTopics: v.number(),
    philosophyTopics: v.number(),
    // Strategy
    optimalMode: v.string(),
    avoidTopics: v.array(v.string()),
    emphasizeTopics: v.array(v.string()),
    toneMatch: v.string(),
    questionStyle: v.string(),
    // Metadata
    lastUpdated: v.number(),
    tweetAnalysisCount: v.number(),
  }).index("by_username", ["username"]),

  // Personal Context (dynamic, updateable information about YOU)
  personalContext: defineTable({
    key: v.string(), // unique identifier, e.g., "main_context"
    // Current metrics (updated daily/weekly)
    currentFollowers: v.number(),
    currentSubWiseUsers: v.number(),
    currentSubWiseMRR: v.number(),
    currentReplyOptimizerUsers: v.number(),
    // Goals
    followerGoal: v.number(),
    followerGoalDeadline: v.string(), // e.g., "30 days from start"
    subWiseUserGoal: v.number(),
    // Stage/Status
    stage: v.string(), // "starting_out", "early_growth", "gaining_traction", "established"
    journeyStartDate: v.string(), // YYYY-MM-DD
    daysIntoJourney: v.number(),
    // Projects
    projects: v.array(v.object({
      name: v.string(),
      description: v.string(),
      stage: v.string(), // "building", "launched", "growing", "paused"
      users: v.number(),
      mrr: v.number(),
    })),
    // Experiences (what you can authentically talk about)
    experiences: v.array(v.object({
      topic: v.string(),
      experience: v.string(),
      context: v.string(),
      verified: v.boolean(),
    })),
    // Background/Interests
    interests: v.array(v.string()), // ["mma", "saas", "tech", "philosophy", etc.]
    skillLevel: v.object({
      mma: v.string(), // "beginner", "practitioner", "experienced", "expert"
      saas: v.string(),
      coding: v.string(),
      marketing: v.string(),
    }),
    // What you CANNOT claim (to prevent fake expertise)
    avoidClaims: v.array(v.string()),
    // Metadata
    lastUpdated: v.number(),
    updatedBy: v.optional(v.string()), // "user" or "system"
  }).index("by_key", ["key"]),
});

