"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateAlgorithmScore } from "@/lib/x-algorithm";

export default function Home() {
  const [content, setContent] = useState("");
  const [isReply, setIsReply] = useState(false);
  const [hasMedia, setHasMedia] = useState(false);
  const [analysis, setAnalysis] = useState<ReturnType<typeof calculateAlgorithmScore> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const createPost = useMutation(api.posts.create);

  const handleAnalyze = () => {
    const result = calculateAlgorithmScore(
      content,
      "viral_reach",
      hasMedia,
      isReply,
      false
    );
    setAnalysis(result);
  };

  const handleSave = async () => {
    if (!analysis) return;
    setIsSaving(true);
    try {
      await createPost({
        content,
        type: isReply ? "reply" : "post",
        algorithmScore: analysis.score,
        scoreBreakdown: analysis.breakdown,
        status: "draft",
      });
      alert("Saved to your drafts!");
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Optimizer</CardTitle>
            <p className="text-sm text-muted-foreground">
              Write your post or reply below and get real-time scoring based on X&apos;s algorithm
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="content">Your Content</Label>
              <Textarea
                id="content"
                placeholder="Write your post or reply here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px] mt-2"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isReply}
                  onChange={(e) => setIsReply(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">This is a reply</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasMedia}
                  onChange={(e) => setHasMedia(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Includes media (image/video)</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAnalyze} disabled={!content.trim()}>
                Analyze Content
              </Button>
              {analysis && (
                <Button
                  onClick={handleSave}
                  variant="outline"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Draft"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {analysis && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Algorithm Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getScoreColor(analysis.score)}`}>
                    {analysis.score}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Out of 100 (Based on X&apos;s Heavy Ranker Model)
                  </p>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Engagement Potential</span>
                    <Badge>{analysis.breakdown.engagement.toFixed(1)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Recency</span>
                    <Badge>{analysis.breakdown.recency.toFixed(1)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Media Presence</span>
                    <Badge>{analysis.breakdown.mediaPresence.toFixed(1)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Conversation Depth</span>
                    <Badge>{analysis.breakdown.conversationDepth.toFixed(1)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Author Reputation</span>
                    <Badge>{analysis.breakdown.authorReputation.toFixed(1)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {analysis.suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span className="text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
