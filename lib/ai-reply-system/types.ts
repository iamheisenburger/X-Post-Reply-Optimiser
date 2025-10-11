/**
 * Core Types - Keep it simple
 */

export interface TweetData {
  id: string;
  text: string;
  createdAt: string;
  conversationId: string;
  author: {
    id: string;
    username: string;
    name: string;
    description: string;
    followers_count: number;
  };
  hasMedia?: boolean;
  isThread?: boolean;
  likeCount?: number;
  replyCount?: number;
  retweetCount?: number;
}

export interface UserProfile {
  handle: string;
  displayName: string;
  bio: string;
}

export interface CreatorIntelligence {
  username: string;
  displayName: string;
  followerCount: number;
  verified: boolean;
  primaryNiche: "saas" | "mma" | "tech" | "finance" | "mindset" | "other";
  secondaryNiches: string[];
  metrics: {
    followers: number;
    engagementRate: number;
  };
  audience: {
    demographics: {
      primaryInterests: string[];
      irrelevantTopics: string[];
      languageStyle: string;
      sophisticationLevel: string;
    };
    engagementPatterns: {
      respondsTo: string[];
      ignores: string[];
      preferredTone: string;
    };
  };
  contentPatterns: {
    topics: string[];
    postTypes: {
      insights: number;
      questions: number;
      announcements: number;
      personal: number;
    };
    toneProfile: {
      serious: number;
      humorous: number;
      technical: number;
      philosophical: number;
    };
  };
  crossoverPotential: {
    mmaRelevance: 0 | 1 | 2 | 3 | 4 | 5;
    saasRelevance: 0 | 1 | 2 | 3 | 4 | 5;
    disciplineTopics: 0 | 1 | 2 | 3 | 4 | 5;
    philosophyTopics: 0 | 1 | 2 | 3 | 4 | 5;
  };
  optimalReplyStrategy: {
    mode: "pure_saas" | "pure_mma" | "mindset_crossover" | "technical" | "storytelling";
    avoidTopics: string[];
    emphasizeTopics: string[];
    toneMatch: string;
    questionStyle: string;
  };
  lastUpdated: number;
  tweetAnalysisCount: number;
}

export interface GeneratedReply {
  text: string;
  score: number; // Overall engagement score 0-100
  mode: string; // Reply mode/strategy used
  iteration: number; // Number of iterations (always 1 now)
  engagement: {
    authorRespondProb: number;
    likesProb: number;
    repliesProb: number;
  };
}

export interface OptimizationResult {
  replies: GeneratedReply[];
  averageIterations: number;
  totalIterations: number;
}

