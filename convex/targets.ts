import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new VIP target
export const create = mutation({
  args: {
    username: v.string(),
    displayName: v.string(),
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    tags: v.array(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const targetId = await ctx.db.insert("targets", {
      ...args,
      tags: args.tags || [],
    });
    return targetId;
  },
});

// Get all VIP targets
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("targets").collect();
  },
});

// Get a single target by ID
export const get = query({
  args: { id: v.id("targets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update a target
export const update = mutation({
  args: {
    id: v.id("targets"),
    username: v.optional(v.string()),
    displayName: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"))),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    lastEngaged: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete a target
export const remove = mutation({
  args: { id: v.id("targets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

