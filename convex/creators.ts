import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Store or update creator intelligence profile
export const upsert = mutation({
  args: {
    username: v.string(),
    displayName: v.string(),
    followerCount: v.number(),
    verified: v.boolean(),
    primaryNiche: v.string(),
    secondaryNiches: v.array(v.string()),
    audiencePrimaryInterests: v.array(v.string()),
    audienceIrrelevantTopics: v.array(v.string()),
    audienceLanguageStyle: v.string(),
    audienceSophisticationLevel: v.string(),
    respondsTo: v.array(v.string()),
    ignores: v.array(v.string()),
    preferredTone: v.string(),
    mmaRelevance: v.number(),
    saasRelevance: v.number(),
    disciplineTopics: v.number(),
    philosophyTopics: v.number(),
    optimalMode: v.string(),
    avoidTopics: v.array(v.string()),
    emphasizeTopics: v.array(v.string()),
    toneMatch: v.string(),
    questionStyle: v.string(),
    lastUpdated: v.number(),
    tweetAnalysisCount: v.number(),
  },
  handler: async (ctx, args) => {
    const { username } = args;
    
    // Check if profile already exists
    const existing = await ctx.db
      .query("creators")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();

    if (existing) {
      // Update existing profile
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      // Create new profile
      return await ctx.db.insert("creators", args);
    }
  },
});

// Get creator profile by username
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("creators")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
  },
});

// Get all creator profiles
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("creators").collect();
  },
});

// Delete a creator profile
export const remove = mutation({
  args: { id: v.id("creators") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

