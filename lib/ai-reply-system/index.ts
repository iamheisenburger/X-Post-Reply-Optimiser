// Main AI Reply System - Orchestrates all components

export { generateOptimizedReplies } from "./optimization-engine";
export { buildCreatorIntelligence, extractTweetId } from "./creator-intelligence";
export { selectOptimalMode } from "./mode-selector";
export type {
  ReplyMode,
  CreatorIntelligence,
  TweetData,
  UserProfile,
  ScoredReply,
  OptimizationResult,
  FullContext
} from "./types";

// User profile constant (from your requirements)
export const MADMANHAKIM_PROFILE = {
  handle: "madmanhakim",
  currentFollowers: 3,
  targetFollowers: 250,
  niche: "MMA + SaaS",
  subNiche: "MMA analysis and SaaS building",
  voice: "Bridge combat sports discipline with startup execution",
  goal: "Grow from 3 to 250 followers in 30 days, drive SubWise signups (0→50 users)",
  strategy: "High-value replies to VIP list of 50 accounts",
  expertise: "Fighter mindset applied to startups, MMA technical analysis, SaaS building",
  currentProject: "SubWise (subscription management SaaS)"
};




