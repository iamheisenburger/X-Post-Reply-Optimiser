import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Save or update thread input (30-day challenge daily reflection)
 */
export const saveThreadInput = mutation({
  args: {
    date: v.string(), // YYYY-MM-DD
    challengeDay: v.number(),
    wins: v.array(v.string()),
    lessons: v.array(v.string()),
    struggles: v.array(v.string()),
    tomorrowFocus: v.array(v.string()),
    futurePlans: v.array(v.string()),
    metrics: v.object({
      followers: v.number(),
      subwiseUsers: v.number(),
      subwiseMRR: v.optional(v.number()),
      trainingMinutes: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if input already exists for this date
    const existing = await ctx.db
      .query("threadInput")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        challengeDay: args.challengeDay,
        wins: args.wins,
        lessons: args.lessons,
        struggles: args.struggles,
        tomorrowFocus: args.tomorrowFocus,
        futurePlans: args.futurePlans,
        metrics: args.metrics,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new
      const id = await ctx.db.insert("threadInput", {
        date: args.date,
        challengeDay: args.challengeDay,
        wins: args.wins,
        lessons: args.lessons,
        struggles: args.struggles,
        tomorrowFocus: args.tomorrowFocus,
        futurePlans: args.futurePlans,
        metrics: args.metrics,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    }
  },
});

/**
 * Get thread input for a specific date
 */
export const getThreadInput = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const input = await ctx.db
      .query("threadInput")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    return input;
  },
});

/**
 * Get today's thread input
 */
export const getTodayThreadInput = query({
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];

    const input = await ctx.db
      .query("threadInput")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    return input;
  },
});

/**
 * Save generated thread (from AI)
 */
export const saveGeneratedThread = mutation({
  args: {
    date: v.string(),
    challengeDay: v.number(),
    tweets: v.array(v.string()),
    threadType: v.string(),
    algorithmScore: v.number(),
    scoreBreakdown: v.object({
      hookStrength: v.number(),
      narrativeFlow: v.number(),
      specificity: v.number(),
      authenticity: v.number(),
    }),
    suggestMedia: v.boolean(),
    mediaType: v.optional(v.string()),
    mediaSuggestions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const id = await ctx.db.insert("generatedThreads", {
      ...args,
      status: "generated",
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

/**
 * Get generated thread for a specific date
 */
export const getGeneratedThreadByDate = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db
      .query("generatedThreads")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .order("desc")
      .first();

    return thread;
  },
});

/**
 * Get today's generated thread
 */
export const getTodayGeneratedThread = query({
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];

    const thread = await ctx.db
      .query("generatedThreads")
      .withIndex("by_date", (q) => q.eq("date", today))
      .order("desc")
      .first();

    return thread;
  },
});

/**
 * Update a generated thread (edit)
 */
export const updateGeneratedThread = mutation({
  args: {
    id: v.id("generatedThreads"),
    tweets: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      tweets: args.tweets,
      status: "edited",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Approve a thread (ready to be posted)
 */
export const approveThread = mutation({
  args: {
    id: v.id("generatedThreads"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "approved",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mark a thread as posted (actually posted to X)
 */
export const markThreadAsPosted = mutation({
  args: {
    id: v.id("generatedThreads"),
    threadUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: "posted",
      postedAt: now,
      threadUrl: args.threadUrl,
      updatedAt: now,
    });
  },
});

/**
 * Reject a thread (user doesn't want to use it)
 */
export const rejectThread = mutation({
  args: {
    id: v.id("generatedThreads"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "rejected",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a generated thread
 */
export const deleteGeneratedThread = mutation({
  args: {
    id: v.id("generatedThreads"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/**
 * Get all threads for the challenge (for review/history)
 */
export const getAllChallengeThreads = query({
  handler: async (ctx) => {
    const threads = await ctx.db
      .query("generatedThreads")
      .withIndex("by_challenge_day")
      .order("desc")
      .collect();

    return threads;
  },
});

/**
 * Get challenge start date from personal context
 */
export const getChallengeStartDate = query({
  handler: async (ctx) => {
    const context = await ctx.db
      .query("personalContext")
      .withIndex("by_key", (q) => q.eq("key", "main_context"))
      .first();

    return context?.challengeStartDate || null;
  },
});

/**
 * Set challenge start date
 */
export const setChallengeStartDate = mutation({
  args: {
    startDate: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const context = await ctx.db
      .query("personalContext")
      .withIndex("by_key", (q) => q.eq("key", "main_context"))
      .first();

    if (context) {
      await ctx.db.patch(context._id, {
        challengeStartDate: args.startDate,
        lastUpdated: Date.now(),
      });
    } else {
      // Create new context if it doesn't exist
      await ctx.db.insert("personalContext", {
        key: "main_context",
        currentFollowers: 3,
        currentSubWiseUsers: 0,
        currentSubWiseMRR: 0,
        currentReplyOptimizerUsers: 0,
        followerGoal: 250,
        followerGoalDeadline: "30 days",
        subWiseUserGoal: 100,
        stage: "starting_out",
        journeyStartDate: args.startDate,
        daysIntoJourney: 1,
        challengeStartDate: args.startDate,
        projects: [],
        experiences: [],
        interests: ["mma", "saas", "tech", "philosophy"],
        skillLevel: {
          mma: "practitioner",
          saas: "building",
          coding: "intermediate",
          marketing: "learning",
        },
        avoidClaims: ["expert", "guru", "coach"],
        lastUpdated: Date.now(),
      });
    }
  },
});
