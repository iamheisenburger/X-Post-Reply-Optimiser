"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

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
  };
  totalIterations: number;
  averageScore: number;
}

export default function AIReplyPage() {
  const [tweetUrl, setTweetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!tweetUrl.trim()) {
      setError("Please enter a tweet URL");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate replies";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "pure_saas": return "bg-blue-500";
      case "pure_mma": return "bg-red-500";
      case "mindset_crossover": return "bg-purple-500";
      case "technical": return "bg-green-500";
      default: return "bg-gray-500";
    }
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
            <CardTitle>Creator Analysis</CardTitle>
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
                <p className="text-sm text-muted-foreground">Selected Mode</p>
                <Badge className={getModeColor(result.selectedMode)}>
                  {result.selectedMode.replace("_", " ")}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Iterations</p>
                <p className="font-semibold">{result.totalIterations}</p>
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
                    <Badge className={getModeColor(reply.mode)} variant="outline">
                      {reply.mode.replace("_", " ")}
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
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
                  </div>

                  {/* Score Breakdown */}
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Algorithm Breakdown:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Engagement</p>
                        <p className="font-bold text-sm">{reply.breakdown.engagement.toFixed(0)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Conversation</p>
                        <p className="font-bold text-sm">{reply.breakdown.conversationDepth.toFixed(0)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Profile Click</p>
                        <p className="font-bold text-sm">{reply.breakdown.authorReputation.toFixed(0)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Recency</p>
                        <p className="font-bold text-sm">{reply.breakdown.recency.toFixed(0)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Media</p>
                        <p className="font-bold text-sm">{reply.breakdown.mediaPresence.toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Reasoning */}
                  {reply.reasoning.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
                        View Optimization Tips ({reply.reasoning.length})
                      </summary>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                        {reply.reasoning.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">Generating Intelligent Replies...</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Analyzing creator profile and optimizing for author response (75x), conversation (13.5x), and recency
                </p>
              </div>
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

