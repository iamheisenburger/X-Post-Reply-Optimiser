/**
 * AI Reply System - Simple & Working
 */

export { buildCreatorIntelligence, extractTweetId } from "./creator-intelligence";
export { generateOptimizedReplies } from "./optimization-engine";
export type { 
  CreatorIntelligence, 
  TweetData, 
  UserProfile, 
  GeneratedReply,
  OptimizationResult 
} from "./types";

// User profile
export const MADMANHAKIM_PROFILE = {
  handle: "madmanhakim",
  displayName: "Hakim",
  bio: "Building SubWise (subscription tracker) & Reply Optimizer. SaaS + MMA mindset.",
};

