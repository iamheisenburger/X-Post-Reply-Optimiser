import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
    // NEW FIELDS for reply tracking
    strategy: v.optional(v.string()), // pure_curiosity, devils_advocate, etc.
    tweetUrl: v.optional(v.string()), // original tweet URL
    tweetAuthor: v.optional(v.string()), // @username
    tweetContent: v.optional(v.string()), // original tweet text
    generatedAt: v.optional(v.number()), // timestamp when generated
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
    .index("by_created", ["createdAt"])
    .index("by_posted_date", ["postedAt"]),

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

  // Daily Reply Stats (fast aggregation for activity tracking)
  dailyStats: defineTable({
    date: v.string(), // YYYY-MM-DD
    repliesSent: v.number(),
    repliesGenerated: v.number(),
    avgScore: v.number(),
    topStrategy: v.optional(v.string()), // most used strategy that day
    creators: v.array(v.object({
      username: v.string(),
      count: v.number(),
    })),
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

  // Daily Input for Post Generation (what happened today)
  dailyInput: defineTable({
    date: v.string(), // YYYY-MM-DD
    events: v.array(v.string()), // ["Trained 90 min BJJ", "Got 2 new SubWise signups"]
    insights: v.array(v.string()), // ["Realized async > cron", "Consistency beats intensity"]
    struggles: v.array(v.string()), // ["Hit wall with X feature", "Tired after training"]
    metrics: v.object({
      followers: v.number(),
      subwiseUsers: v.number(),
      subwiseMRR: v.optional(v.number()),
      trainingMinutes: v.optional(v.number()),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_date", ["date"]),

  // Generated Posts (AI-created posts for the day)
  generatedPosts: defineTable({
    date: v.string(), // YYYY-MM-DD
    content: v.string(),
    category: v.string(), // "mma", "subwise", "xgrowth", "philosophy"
    postType: v.string(), // "progress", "contrarian", "lesson", "thread_starter", "bts"
    algorithmScore: v.number(), // 0-100 predicted engagement
    scoreBreakdown: v.object({
      hookStrength: v.number(), // First 10 words quality
      conversationTrigger: v.number(), // Ends with question/controversial take?
      specificity: v.number(), // Has numbers/data?
      authenticity: v.number(), // Personal experience/genuine?
    }),
    suggestMedia: v.boolean(), // Should add photo/video?
    mediaType: v.optional(v.string()), // "training_photo", "screenshot", "chart"
    status: v.union(
      v.literal("generated"), // AI created
      v.literal("edited"), // User modified
      v.literal("approved"), // Ready to post
      v.literal("posted"), // Actually posted to X
      v.literal("rejected") // User discarded
    ),
    postedAt: v.optional(v.number()),
    tweetUrl: v.optional(v.string()),
    performance: v.optional(v.object({
      views: v.number(),
      likes: v.number(),
      retweets: v.number(),
      replies: v.number(),
      bookmarks: v.number(),
      profileClicks: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_status", ["status"])
    .index("by_category", ["category"]),

  // Content Bank (tracks what's been posted to prevent repetition)
  contentBank: defineTable({
    content: v.string(), // The actual post text
    contentHash: v.string(), // Hash for duplicate detection
    topics: v.array(v.string()), // ["bjj", "subwise", "discipline"]
    postedAt: v.number(),
    performance: v.object({
      likes: v.number(),
      retweets: v.number(),
      replies: v.number(),
    }),
    createdAt: v.number(),
  })
    .index("by_hash", ["contentHash"])
    .index("by_posted", ["postedAt"]),

  // Post Templates (algorithm-optimized formats)
  postTemplates: defineTable({
    name: v.string(), // "Progress Update", "Contrarian Take"
    category: v.string(), // "mma", "subwise", "xgrowth", "philosophy"
    template: v.string(), // Template with {variables}
    exampleVariables: v.object({
      required: v.array(v.string()), // ["metric", "insight"]
      optional: v.array(v.string()), // ["photo_suggestion"]
    }),
    algorithmFeatures: v.array(v.string()), // ["hasData", "hasQuestion", "hasPersonal"]
    successRate: v.number(), // 0-100 based on historical performance
    lastUsed: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_name", ["name"]),
});

