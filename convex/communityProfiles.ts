import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create or update a community profile
 */
export const upsert = mutation({
  args: {
    communityName: v.string(),
    twitterCommunityId: v.optional(v.string()),
    description: v.string(),
    voiceProfile: v.object({
      commonPhrases: v.array(v.string()),
      toneCharacteristics: v.array(v.string()),
      topicPatterns: v.array(v.string()),
      engagementTriggers: v.array(v.string()),
      lengthPreference: v.string(),
      emojiUsage: v.string(),
      technicalDepth: v.string(),
      mediaUsage: v.string(),
    }),
    topPosts: v.array(v.object({
      text: v.string(),
      likes: v.number(),
      replies: v.number(),
      date: v.string(),
      authorUsername: v.optional(v.string()),
    })),
    lastCursor: v.optional(v.string()), // Pagination cursor for next analysis
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if profile exists
    const existing = await ctx.db
      .query("communityProfiles")
      .withIndex("by_name", (q) => q.eq("communityName", args.communityName))
      .first();

    if (existing) {
      // Update existing profile
      await ctx.db.patch(existing._id, {
        twitterCommunityId: args.twitterCommunityId,
        description: args.description,
        voiceProfile: args.voiceProfile,
        topPosts: args.topPosts,
        lastCursor: args.lastCursor,
        lastAnalyzed: now,
        updatedAt: now,
      });
      console.log(`✅ Updated community profile: ${args.communityName}`);
      return existing._id;
    } else {
      // Create new profile
      const id = await ctx.db.insert("communityProfiles", {
        communityName: args.communityName,
        twitterCommunityId: args.twitterCommunityId,
        description: args.description,
        voiceProfile: args.voiceProfile,
        topPosts: args.topPosts,
        lastCursor: args.lastCursor,
        lastAnalyzed: now,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`✅ Created community profile: ${args.communityName}`);
      return id;
    }
  },
});

/**
 * Get a community profile by name
 */
export const getByName = query({
  args: {
    communityName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("communityProfiles")
      .withIndex("by_name", (q) => q.eq("communityName", args.communityName))
      .first();
  },
});

/**
 * Get all community profiles
 */
export const listAll = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("communityProfiles")
      .order("desc")
      .collect();
  },
});

/**
 * Check if a community needs re-analysis (> 7 days old)
 */
export const needsAnalysis = query({
  args: {
    communityName: v.string(),
    maxAgeDays: v.optional(v.number()), // Default 7 days
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("communityProfiles")
      .withIndex("by_name", (q) => q.eq("communityName", args.communityName))
      .first();

    if (!profile) {
      return { needs: true, reason: "No profile exists" };
    }

    const maxAge = (args.maxAgeDays || 7) * 24 * 60 * 60 * 1000; // Convert days to ms
    const age = Date.now() - profile.lastAnalyzed;

    if (age > maxAge) {
      return {
        needs: true,
        reason: `Profile is ${Math.floor(age / (24 * 60 * 60 * 1000))} days old`,
      };
    }

    return { needs: false, reason: "Profile is up to date" };
  },
});

/**
 * Delete a community profile
 */
export const remove = mutation({
  args: {
    communityName: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("communityProfiles")
      .withIndex("by_name", (q) => q.eq("communityName", args.communityName))
      .first();

    if (profile) {
      await ctx.db.delete(profile._id);
      console.log(`✅ Deleted community profile: ${args.communityName}`);
    }
  },
});
