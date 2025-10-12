import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get personal context (for reply generation)
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const context = await ctx.db
      .query("personalContext")
      .filter((q) => q.eq(q.field("key"), "main_context"))
      .first();

    return context;
  },
});

/**
 * Initialize personal context with defaults
 */
export const initialize = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already exists
    const existing = await ctx.db
      .query("personalContext")
      .filter((q) => q.eq(q.field("key"), "main_context"))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create default context
    const contextId = await ctx.db.insert("personalContext", {
      key: "main_context",
      // Current metrics
      currentFollowers: 3,
      currentSubWiseUsers: 0,
      currentSubWiseMRR: 0,
      currentReplyOptimizerUsers: 0,
      // Goals
      followerGoal: 250,
      followerGoalDeadline: "30 days",
      subWiseUserGoal: 50,
      // Stage
      stage: "starting_out",
      journeyStartDate: "2025-01-12", // Today's date
      daysIntoJourney: 1,
      // Projects
      projects: [
        {
          name: "SubWise",
          description: "Subscription tracker for managing recurring payments",
          stage: "building",
          users: 0,
          mrr: 0,
        },
        {
          name: "X Reply Optimizer",
          description: "Algorithm-optimized X reply generator",
          stage: "building",
          users: 0,
          mrr: 0,
        },
      ],
      // Experiences
      experiences: [
        {
          topic: "starting_from_scratch",
          experience: "At 3 followers trying to hit 250 in 30 days",
          context: "Beginning of X growth journey",
          verified: true,
        },
        {
          topic: "building_subwise",
          experience: "Building SubWise (subscription tracker) as first SaaS",
          context: "Early stage development, no users yet",
          verified: true,
        },
        {
          topic: "x_algorithm_study",
          experience: "Studied X's open-source algorithm to understand 75x author reply weight",
          context: "Built reply optimizer based on real algorithm weights",
          verified: true,
        },
        {
          topic: "mma_training",
          experience: "Training MMA for discipline and mental toughness",
          context: "Practitioner level, passionate about philosophy of combat sports",
          verified: true,
        },
        {
          topic: "building_in_public",
          experience: "Learning to build in public through 30-day challenge",
          context: "First time documenting journey publicly",
          verified: true,
        },
      ],
      // Interests
      interests: ["mma", "saas", "tech", "philosophy", "indie_hacking", "building_in_public"],
      skillLevel: {
        mma: "practitioner",
        saas: "beginner",
        coding: "intermediate",
        marketing: "beginner",
      },
      // Avoid claims
      avoidClaims: [
        "hitting_10k_mrr",
        "scaling_to_1000_users",
        "exit_stories",
        "years_of_saas_experience",
        "advanced_mma_techniques",
        "managing_teams",
        "fundraising",
      ],
      // Metadata
      lastUpdated: Date.now(),
      updatedBy: "system",
    });

    return contextId;
  },
});

/**
 * Update personal context (manual updates from UI)
 */
export const update = mutation({
  args: {
    currentFollowers: v.optional(v.number()),
    currentSubWiseUsers: v.optional(v.number()),
    currentSubWiseMRR: v.optional(v.number()),
    currentReplyOptimizerUsers: v.optional(v.number()),
    daysIntoJourney: v.optional(v.number()),
    stage: v.optional(v.string()),
    projects: v.optional(v.array(v.object({
      name: v.string(),
      description: v.string(),
      stage: v.string(),
      users: v.number(),
      mrr: v.number(),
    }))),
    experiences: v.optional(v.array(v.object({
      topic: v.string(),
      experience: v.string(),
      context: v.string(),
      verified: v.boolean(),
    }))),
  },
  handler: async (ctx, args) => {
    const context = await ctx.db
      .query("personalContext")
      .filter((q) => q.eq(q.field("key"), "main_context"))
      .first();

    if (!context) {
      throw new Error("Personal context not initialized. Call initialize() first.");
    }

    // Build update object with only provided fields
    const updates: any = {
      lastUpdated: Date.now(),
      updatedBy: "user",
    };

    if (args.currentFollowers !== undefined) updates.currentFollowers = args.currentFollowers;
    if (args.currentSubWiseUsers !== undefined) updates.currentSubWiseUsers = args.currentSubWiseUsers;
    if (args.currentSubWiseMRR !== undefined) updates.currentSubWiseMRR = args.currentSubWiseMRR;
    if (args.currentReplyOptimizerUsers !== undefined) updates.currentReplyOptimizerUsers = args.currentReplyOptimizerUsers;
    if (args.daysIntoJourney !== undefined) updates.daysIntoJourney = args.daysIntoJourney;
    if (args.stage !== undefined) updates.stage = args.stage;
    if (args.projects !== undefined) updates.projects = args.projects;
    if (args.experiences !== undefined) updates.experiences = args.experiences;

    await ctx.db.patch(context._id, updates);

    return context._id;
  },
});

/**
 * Add a new experience to personal context
 */
export const addExperience = mutation({
  args: {
    topic: v.string(),
    experience: v.string(),
    context: v.string(),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    const context = await ctx.db
      .query("personalContext")
      .filter((q) => q.eq(q.field("key"), "main_context"))
      .first();

    if (!context) {
      throw new Error("Personal context not initialized");
    }

    const updatedExperiences = [...context.experiences, args];

    await ctx.db.patch(context._id, {
      experiences: updatedExperiences,
      lastUpdated: Date.now(),
      updatedBy: "user",
    });

    return context._id;
  },
});
