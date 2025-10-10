// Core types for the AI Reply System

export type ReplyMode = 
  | "pure_saas"           // Only SaaS insights, zero MMA
  | "pure_mma"            // Only MMA analysis, minimal SaaS
  | "mindset_crossover"   // Bridge discipline concepts (rare, needs receptive audience)
  | "technical"           // Pure technical/tactical insights
  | "storytelling";       // Personal experience

export interface CreatorIntelligence {
  username: string;
  displayName: string;
  followerCount: number;
  verified: boolean;
  
  // Niche Analysis
  primaryNiche: "saas" | "mma" | "tech" | "finance" | "mindset" | "other";
  secondaryNiches: string[];
  
  // Audience Analysis
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
  
  // Content Analysis
  contentPatterns: {
    topics: Array<{
      topic: string;
      frequency: number;
      engagement: number;
    }>;
    
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
  
  // Crossover Receptiveness
  crossoverPotential: {
    mmaRelevance: 0 | 1 | 2 | 3 | 4 | 5;
    saasRelevance: 0 | 1 | 2 | 3 | 4 | 5;
    disciplineTopics: 0 | 1 | 2 | 3 | 4 | 5;
    philosophyTopics: 0 | 1 | 2 | 3 | 4 | 5;
  };
  
  // Optimal Strategy
  optimalReplyStrategy: {
    mode: ReplyMode;
    avoidTopics: string[];
    emphasizeTopics: string[];
    toneMatch: string;
    questionStyle: string;
  };
  
  // Metadata
  lastUpdated: number;
  tweetAnalysisCount: number;
}

export interface TweetData {
  id: string;
  text: string;
  author: {
    id: string;
    username: string;
    name: string;
    description: string;
    followers_count: number;
  };
  hasMedia: boolean;
  isThread: boolean;
  conversationId: string;
  createdAt: string;
}

export interface UserProfile {
  handle: string;
  currentFollowers: number;
  targetFollowers: number;
  niche: string;
  subNiche: string;
  voice: string;
  goal: string;
  strategy: string;
  expertise: string;
  currentProject: string;
}

export interface FullContext {
  userProfile: UserProfile;
  creator: CreatorIntelligence;
  post: TweetData;
  mode: ReplyMode;
  algorithmWeights: Record<string, number>;
}

export interface ScoredReply {
  text: string;
  score: number;
  breakdown: {
    engagement: number;
    recency: number;
    mediaPresence: number;
    conversationDepth: number;
    authorReputation: number;
  };
  mode: ReplyMode;
  iteration: number;
  reasoning: string[];
}

export interface ModeValidation {
  passed: boolean;
  reason?: string;
}

export interface OptimizationResult {
  replies: ScoredReply[];
  selectedMode: ReplyMode;
  creatorProfile: CreatorIntelligence;
  totalIterations: number;
  averageScore: number;
}

