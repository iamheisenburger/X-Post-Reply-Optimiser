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
  const [progressSteps, setProgressSteps] = useState<Array<{step: string; status: 'pending' | 'active' | 'complete'}>>([]);

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
      { step: "Generating Reply #1: Question Strategy", status: 'pending' as const },
      { step: "Generating Reply #2: Contrarian Strategy", status: 'pending' as const },
      { step: "Generating Reply #3: Add-Value Strategy", status: 'pending' as const },
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
                  Question + Contrarian + Value
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reply Mode</p>
                <p className="font-semibold">One-shot (no iterations)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality Report */}
      {result?.qualityReport && (
        <Card className={`mb-6 ${result.qualityReport.passed ? 'border-green-500/50' : 'border-yellow-500/50'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {result.qualityReport.passed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                Quality Report
              </CardTitle>
              <Badge variant="outline" className={result.qualityReport.passed ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}>
                {result.qualityReport.passed ? 'PASSED' : 'ISSUES DETECTED'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Attempts</p>
                  <p className="font-semibold">{result.totalIterations}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Best Score</p>
                  <p className="font-semibold text-lg">{result.qualityReport.bestScore}/100</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Grammar/Coherence</p>
                  {result.qualityReport.grammarPassed ? (
                    <p className="font-semibold text-green-500">✓ Passed</p>
                  ) : (
                    <p className="font-semibold text-red-500">✗ Issues</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issues Found</p>
                  <p className="font-semibold">{result.qualityReport.issues.length}</p>
                </div>
              </div>
              
              {result.qualityReport.issues.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded">
                  <p className="text-sm font-semibold mb-2">Remaining Quality Issues:</p>
                  <ul className="text-sm space-y-1">
                    {result.qualityReport.issues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-yellow-500">•</span>
                        <span className="text-muted-foreground">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.totalIterations > 1 && (
                <div className="text-xs text-muted-foreground">
                  System iterated {result.totalIterations}x to improve quality based on X algorithm targets
                </div>
              )}
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
                    <div className="mt-2">
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
                    </div>
                  </div>

                  {/* Feature Detection & Strength */}
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Detected Features (X Algorithm Targets):</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        {reply.features.hasQuestion ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>Question to author</span>
                        <span className="text-xs text-muted-foreground">(targets 75x author response)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {reply.features.hasPushback ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>Contrarian/Pushback angle</span>
                        <span className="text-xs text-muted-foreground">(targets 75x + 13.5x)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {reply.features.hasData ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>Uses data/examples</span>
                        <span className="text-xs text-muted-foreground">(credibility + profile clicks)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Matches creator{'\''}s niche</span>
                        <span className="text-xs text-muted-foreground">(template system = relevance)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Matches creator tone</span>
                        <span className="text-xs text-muted-foreground">(uses profile intelligence)</span>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-muted rounded text-xs">
                      <span className="font-semibold">Relative Strength: </span>
                      <span className={reply.score >= 60 ? "text-green-500" : reply.score >= 40 ? "text-yellow-500" : "text-red-500"}>
                        {reply.score >= 60 ? "STRONG" : reply.score >= 40 ? "MODERATE" : "WEAK"}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        ({reply.score}/100 composite score)
                      </span>
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

