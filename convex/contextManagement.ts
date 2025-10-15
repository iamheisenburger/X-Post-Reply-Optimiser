import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Initialize posts context with base profile info
 */
export const initializePostsContext = mutation({
  args: {
    bio: v.string(),
    currentGoals: v.array(v.string()),
    interests: v.array(v.string()),
    projects: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("postsContext")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .first();

    const contextData = {
      key: "main",
      baseProfile: {
        bio: args.bio,
        currentGoals: args.currentGoals,
        interests: args.interests,
        projects: args.projects,
      },
      recentInputs: [],
      lastUpdated: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, contextData);
      return existing._id;
    } else {
      return await ctx.db.insert("postsContext", contextData);
    }
  },
});

/**
 * Add daily input to posts context (auto-manages rolling window)
 */
export const addToPostsContext = mutation({
  args: {
    date: v.string(),
    events: v.array(v.string()),
    insights: v.array(v.string()),
    struggles: v.array(v.string()),
    futurePlans: v.array(v.string()),
    metrics: v.object({
      followers: v.number(),
      subwiseUsers: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const context = await ctx.db
      .query("postsContext")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .first();

    if (!context) {
      // Initialize if doesn't exist
      await ctx.db.insert("postsContext", {
        key: "main",
        baseProfile: {
          bio: "Aspiring pro MMA fighter building @usesubwise (subscription tracker) to 100 paid users. Documenting everything publicly.",
          currentGoals: ["3 → 250 followers in 30 days", "Build SubWise to 100 users"],
          interests: ["MMA", "SaaS", "Tech", "Philosophy"],
          projects: ["SubWise", "X Reply Optimizer"],
        },
        recentInputs: [{
          date: args.date,
          events: args.events,
          insights: args.insights,
          struggles: args.struggles,
          futurePlans: args.futurePlans,
          metrics: args.metrics,
        }],
        lastUpdated: Date.now(),
      });
      return;
    }

    // Add new input and keep only last 7 days
    const newInputs = [
      ...context.recentInputs,
      {
        date: args.date,
        events: args.events,
        insights: args.insights,
        struggles: args.struggles,
        futurePlans: args.futurePlans,
        metrics: args.metrics,
      }
    ].slice(-7); // Keep only last 7 days

    await ctx.db.patch(context._id, {
      recentInputs: newInputs,
      lastUpdated: Date.now(),
    });
  },
});

/**
 * Get posts context for AI generation
 */
export const getPostsContext = query({
  handler: async (ctx) => {
    const context = await ctx.db
      .query("postsContext")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .first();

    return context || null;
  },
});

/**
 * Initialize threads context with challenge info
 */
export const initializeThreadsContext = mutation({
  args: {
    startDate: v.string(),
    goal: v.string(),
    currentDay: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("threadsContext")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .first();

    const contextData = {
      key: "main",
      challengeInfo: {
        startDate: args.startDate,
        goal: args.goal,
        currentDay: args.currentDay,
      },
      recentReflections: [],
      keyMilestones: [],
      lastUpdated: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...contextData,
        keyMilestones: existing.keyMilestones, // Preserve milestones
      });
      return existing._id;
    } else {
      return await ctx.db.insert("threadsContext", contextData);
    }
  },
});

/**
 * Add daily reflection to threads context (auto-manages rolling window)
 */
export const addToThreadsContext = mutation({
  args: {
    date: v.string(),
    challengeDay: v.number(),
    wins: v.array(v.string()),
    lessons: v.array(v.string()),
    struggles: v.array(v.string()),
    tomorrowFocus: v.array(v.string()),
    futurePlans: v.array(v.string()),
    metrics: v.object({
      followers: v.number(),
      subwiseUsers: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const context = await ctx.db
      .query("threadsContext")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .first();

    if (!context) {
      // Initialize if doesn't exist
      await ctx.db.insert("threadsContext", {
        key: "main",
        challengeInfo: {
          startDate: args.date,
          goal: "3 → 250 followers in 30 days",
          currentDay: args.challengeDay,
        },
        recentReflections: [{
          date: args.date,
          challengeDay: args.challengeDay,
          wins: args.wins,
          lessons: args.lessons,
          struggles: args.struggles,
          tomorrowFocus: args.tomorrowFocus,
          futurePlans: args.futurePlans,
          metrics: args.metrics,
        }],
        keyMilestones: [],
        lastUpdated: Date.now(),
      });
      return;
    }

    // Add new reflection and keep only last 7 days
    const newReflections = [
      ...context.recentReflections,
      {
        date: args.date,
        challengeDay: args.challengeDay,
        wins: args.wins,
        lessons: args.lessons,
        struggles: args.struggles,
        tomorrowFocus: args.tomorrowFocus,
        futurePlans: args.futurePlans,
        metrics: args.metrics,
      }
    ].slice(-7); // Keep only last 7 days

    await ctx.db.patch(context._id, {
      challengeInfo: {
        ...context.challengeInfo,
        currentDay: args.challengeDay,
      },
      recentReflections: newReflections,
      lastUpdated: Date.now(),
    });
  },
});

/**
 * Get threads context for AI generation
 */
export const getThreadsContext = query({
  handler: async (ctx) => {
    const context = await ctx.db
      .query("threadsContext")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .first();

    return context || null;
  },
});

/**
 * Add milestone to threads context (for significant achievements)
 */
export const addMilestone = mutation({
  args: {
    day: v.number(),
    description: v.string(),
    impact: v.string(),
  },
  handler: async (ctx, args) => {
    const context = await ctx.db
      .query("threadsContext")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .first();

    if (!context) return;

    const newMilestones = [
      ...context.keyMilestones,
      {
        day: args.day,
        description: args.description,
        impact: args.impact,
      }
    ].slice(-10); // Keep only last 10 milestones

    await ctx.db.patch(context._id, {
      keyMilestones: newMilestones,
      lastUpdated: Date.now(),
    });
  },
});
