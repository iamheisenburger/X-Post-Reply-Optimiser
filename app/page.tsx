"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, CheckCircle2, AlertCircle, Sparkles, Send } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";

interface ScoredReply {
  text: string;
  score: number;
  breakdown: {
    engagement: number;
    recency: number;
    mediaPresence: number;
    conversationDepth: number;
    authorReputation: number;
  };
  mode: string;
  iteration: number;
  reasoning: string[];
  features: {
    hasQuestion: boolean;
    hasPushback: boolean;
    hasData: boolean;
    authorReplyProb: number;
  };
}

interface OptimizationResult {
  replies: ScoredReply[];
  selectedMode: string;
  creatorProfile: {
    username: string;
    displayName: string;
    primaryNiche: string;
    mmaRelevance: number;
    saasRelevance: number;
    profileSource?: 'cached' | 'analyzed';
  };
  totalIterations: number;
  averageScore: number;
  qualityReport?: {
    passed: boolean;
    bestScore: number;
    issues: string[];
    attemptNumber: number;
    grammarPassed: boolean;
  };
}

export default function AIReplyPage() {
  const [tweetUrl, setTweetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [sentReplies, setSentReplies] = useState<Set<number>>(new Set());
  const [progressSteps, setProgressSteps] = useState<Array<{step: string; status: 'pending' | 'active' | 'complete'}>>([]);
  const [tweetContent, setTweetContent] = useState<string>("");

  const markAsSent = useMutation(api.sentReplies.markAsSent);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!tweetUrl.trim()) {
      setError("Please enter a tweet URL");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    
    // Initialize progress steps
    const steps = [
      { step: "Extracting tweet ID from URL", status: 'active' as const },
      { step: "Fetching tweet data from X", status: 'pending' as const },
      { step: "Checking for cached creator profile", status: 'pending' as const },
      { step: "Analyzing creator's niche and tone", status: 'pending' as const },
      { step: "Selecting optimal reply strategies", status: 'pending' as const },
      { step: "Generating 3 dynamic replies", status: 'pending' as const },
      { step: "Analyzing reply features & scoring", status: 'pending' as const },
    ];
    setProgressSteps(steps);

    try {
      // Simulate step progression (in reality, API would send these)
      const updateStep = (index: number) => {
        setProgressSteps(prev => prev.map((s, i) => ({
          ...s,
          status: i < index ? 'complete' : i === index ? 'active' : 'pending'
        })));
      };

      // Start fetching
      setTimeout(() => updateStep(1), 300);
      setTimeout(() => updateStep(2), 800);
      setTimeout(() => updateStep(3), 1500);
      setTimeout(() => updateStep(4), 3000);
      setTimeout(() => updateStep(5), 6000);
      setTimeout(() => updateStep(6), 9000);
      setTimeout(() => updateStep(7), 12000);

      const response = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweetUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate replies");
      }

      const data = await response.json();
      setResult(data);
      setTweetContent(data.tweetContent || ""); // Store tweet content for later
      setSentReplies(new Set()); // Reset sent replies

      // Mark all complete
      setProgressSteps(prev => prev.map(s => ({ ...s, status: 'complete' })));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate replies";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    const cleanText = decodeURIComponent(text);
    await navigator.clipboard.writeText(cleanText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleMarkAsSent = async (reply: ScoredReply, index: number) => {
    if (!result) return;

    try {
      await markAsSent({
        content: reply.text,
        strategy: reply.mode,
        algorithmScore: reply.score || 0,
        scoreBreakdown: reply.breakdown,
        tweetUrl: tweetUrl,
        tweetAuthor: result.creatorProfile.username,
        tweetContent: tweetContent,
        targetUsername: result.creatorProfile.username,
        targetTweetId: tweetUrl.split('/status/')[1]?.split('?')[0],
      });

      setSentReplies(prev => new Set(prev).add(index));

      toast({
        title: "Reply tracked!",
        description: "Added to today's activity. View it on the Activity page.",
        duration: 3000, // Auto-dismiss after 3 seconds
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to track reply. Please try again.",
        variant: "destructive",
        duration: 5000, // Error messages stay a bit longer
      });
      console.error("Failed to mark as sent:", error);
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "pure_curiosity": return "bg-blue-500";
      case "devils_advocate": return "bg-red-500";
      case "expand_idea": return "bg-purple-500";
      case "provide_evidence": return "bg-green-500";
      case "personal_crossover": return "bg-orange-500";
      case "synthesize": return "bg-cyan-500";
      case "practical_application": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const formatStrategyName = (strategy: string) => {
    return strategy.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return "text-green-500";
    if (score >= 90) return "text-blue-500";
    if (score >= 85) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-purple-500" />
          AI Reply Generator
        </h1>
        <p className="text-muted-foreground">
          Paste a tweet URL and get 3 algorithm-optimized replies tuned to X{'\''}s ranking signals
        </p>
      </div>

      {/* Input Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tweet URL</CardTitle>
          <CardDescription>
            Paste the URL of the tweet you want to reply to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="tweetUrl" className="sr-only">
                Tweet URL
              </Label>
              <Input
                id="tweetUrl"
                placeholder="https://x.com/username/status/1234567890"
                value={tweetUrl}
                onChange={(e) => setTweetUrl(e.target.value)}
                disabled={loading}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>
            <Button onClick={handleGenerate} disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Replies"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-500">Error</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Creator Profile Summary */}
      {result && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Creator Analysis</CardTitle>
              {result.creatorProfile.profileSource === 'cached' ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  ✓ Using Saved Profile
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                  ⚠️ Generic Analysis
                </Badge>
              )}
            </div>
            {result.creatorProfile.profileSource !== 'cached' && (
              <p className="text-xs text-muted-foreground mt-2">
                Add @{result.creatorProfile.username} to Profiles page for better context-aware replies
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Creator</p>
                <p className="font-semibold">@{result.creatorProfile.username}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Primary Niche</p>
                <p className="font-semibold capitalize">{result.creatorProfile.primaryNiche}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Strategy Mix</p>
                <Badge className="bg-purple-500">
                  Dynamic Selection
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Generation Method</p>
                <p className="font-semibold">Claude (Intelligent)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Generated Replies */}
      {result && result.replies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Generated Replies</h2>
          {([...result.replies].sort((a, b) => b.score - a.score)).map((reply, index) => (
            <Card key={index} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Reply #{index + 1}
                    <span className={`ml-3 text-2xl font-bold ${getScoreColor(reply.score)}`}>
                      {reply.score}/100
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getModeColor(reply.mode)}>
                      {formatStrategyName(reply.mode)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Reply Text */}
                  <div className="relative">
                    <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                      {reply.text}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(reply.text, index)}
                      >
                        {copiedIndex === index ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                      {sentReplies.has(index) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="bg-green-500/10 text-green-500 border-green-500/20"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Sent
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleMarkAsSent(reply, index)}
                          className="bg-purple-500 hover:bg-purple-600"
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Mark as Sent
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Engagement Indicators - Clean & Simple */}
                  <div className="flex flex-wrap gap-2">
                    {reply.features.hasQuestion && (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        ✓ Question (75x author weight)
                      </Badge>
                    )}
                    {reply.features.hasPushback && (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                        ✓ Contrarian (13.5x conversation)
                      </Badge>
                    )}
                    {reply.features.hasData && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        ✓ Data/Examples
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loading State with Progress */}
      {loading && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Your Request</CardTitle>
            <CardDescription>Watch the system work in real-time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {progressSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {step.status === 'complete' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  )}
                  {step.status === 'active' && (
                    <Loader2 className="h-5 w-5 animate-spin text-purple-500 flex-shrink-0" />
                  )}
                  {step.status === 'pending' && (
                    <div className="h-5 w-5 rounded-full border-2 border-muted flex-shrink-0" />
                  )}
                  <span className={`text-sm ${step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {step.step}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !result && !error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
              <Sparkles className="h-16 w-16 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Ready to Generate</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Paste a tweet URL above to get 3 algorithm-optimized replies with intelligent creator profiling and mode selection
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

