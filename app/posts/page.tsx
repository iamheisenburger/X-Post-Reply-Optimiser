"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Copy, Check, Send, X, Edit2, ThumbsUp, ThumbsDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PostsPage() {
  const [date] = useState(() => new Date().toISOString().split('T')[0]);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [challengeDay, setChallengeDay] = useState(1);
  const [events, setEvents] = useState<string[]>([""]);
  const [insights, setInsights] = useState<string[]>([""]);
  const [struggles, setStruggles] = useState<string[]>([""]);
  const [futurePlans, setFuturePlans] = useState<string[]>([""]);
  const [metrics, setMetrics] = useState({
    followers: 3,
    subwiseUsers: 0,
    subwiseMRR: 0,
    trainingMinutes: 0,
  });

  // UI state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const { toast } = useToast();

  // Queries
  const todayInput = useQuery(api.postGeneration.getTodayInput);
  const generatedPosts = useQuery(api.postGeneration.getTodayGeneratedPosts);

  // Mutations
  const saveDailyInput = useMutation(api.postGeneration.saveDailyInput);
  const saveGeneratedPosts = useMutation(api.postGeneration.saveGeneratedPosts);
  const updatePost = useMutation(api.postGeneration.updateGeneratedPost);
  const approvePost = useMutation(api.postGeneration.approvePost);
  const markAsPosted = useMutation(api.postGeneration.markPostAsPosted);
  const rejectPost = useMutation(api.postGeneration.rejectPost);
  const deletePost = useMutation(api.postGeneration.deleteGeneratedPost);

  // Load existing input if available
  useState(() => {
    if (todayInput) {
      setEvents(todayInput.events.length > 0 ? todayInput.events : [""]);
      setInsights(todayInput.insights.length > 0 ? todayInput.insights : [""]);
      setStruggles(todayInput.struggles.length > 0 ? todayInput.struggles : [""]);
      setFuturePlans(todayInput.futurePlans && todayInput.futurePlans.length > 0 ? todayInput.futurePlans : [""]);
      setMetrics({
        followers: todayInput.metrics.followers,
        subwiseUsers: todayInput.metrics.subwiseUsers,
        subwiseMRR: todayInput.metrics.subwiseMRR || 0,
        trainingMinutes: todayInput.metrics.trainingMinutes || 0,
      });
    }
  });

  const addField = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, ""]);
  };

  const updateField = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter(prev => {
      const newArray = [...prev];
      newArray[index] = value;
      return newArray;
    });
  };

  const removeField = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleGeneratePosts = async () => {
    setGenerating(true);

    try {
      // Step 1: Save daily input to Convex
      await saveDailyInput({
        date,
        events: events.filter(e => e.trim()),
        insights: insights.filter(i => i.trim()),
        struggles: struggles.filter(s => s.trim()),
        futurePlans: futurePlans.filter(p => p.trim()),
        metrics,
      });

      // Step 2: Call Claude API to generate posts
      const response = await fetch('/api/generate-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          challengeDay,
          events: events.filter(e => e.trim()),
          insights: insights.filter(i => i.trim()),
          struggles: struggles.filter(s => s.trim()),
          futurePlans: futurePlans.filter(p => p.trim()),
          metrics,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.details || 'Failed to generate posts');
      }

      const data = await response.json();
      console.log('✅ Claude generated posts:', data.posts);

      // Step 3: Clean posts - CRITICAL: Remove undefined fields for Convex
      const cleanedPosts = data.posts.map((post: {
        date: string;
        content: string;
        category: string;
        postType: string;
        algorithmScore: number;
        scoreBreakdown: {
          hookStrength: number;
          conversationTrigger: number;
          specificity: number;
          authenticity: number;
        };
        suggestMedia: boolean;
        mediaType?: string;
      }) => {
        // Build object with only defined fields
        const cleaned: {
          date: string;
          content: string;
          category: string;
          postType: string;
          algorithmScore: number;
          scoreBreakdown: {
            hookStrength: number;
            conversationTrigger: number;
            specificity: number;
            authenticity: number;
          };
          suggestMedia: boolean;
          mediaType?: string;
        } = {
          date: post.date,
          content: post.content,
          category: post.category,
          postType: post.postType,
          algorithmScore: post.algorithmScore,
          scoreBreakdown: post.scoreBreakdown,
          suggestMedia: post.suggestMedia,
        };
        
        // Only add mediaType if it's not undefined/null
        if (post.mediaType !== undefined && post.mediaType !== null) {
          cleaned.mediaType = post.mediaType;
        }
        
        return cleaned;
      });

      console.log('✅ Cleaned posts for Convex:', cleanedPosts);

      // Step 4: Save to Convex
      await saveGeneratedPosts({ posts: cleanedPosts });
      console.log('✅ Saved to Convex successfully!');

      toast({
        title: "Posts generated!",
        description: `Generated ${data.posts.length} posts successfully!`,
      });
    } catch (error) {
      console.error('❌ Error generating posts:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copied!",
      description: "Post copied to clipboard",
    });
  };

  const handleEdit = (postId: string, content: string) => {
    setEditingPostId(postId);
    setEditedContent(content);
  };

  const handleSaveEdit = async (postId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updatePost({ id: postId as any, content: editedContent });
    setEditingPostId(null);
    toast({
      title: "Updated!",
      description: "Post has been edited",
    });
  };

  const handleApprove = async (postId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await approvePost({ id: postId as any });
    toast({
      title: "Approved!",
      description: "Post is ready to be posted",
    });
  };

  const handleMarkAsPosted = async (postId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await markAsPosted({ id: postId as any });
    toast({
      title: "Marked as posted!",
      description: "Post tracked in content bank",
    });
  };

  const handleReject = async (postId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await rejectPost({ id: postId as any });
    toast({
      title: "Rejected",
      description: "Post will not be used",
    });
  };

  const handleDelete = async (postId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await deletePost({ id: postId as any });
    toast({
      title: "Deleted",
      description: "Post removed",
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "mma": return "bg-red-500";
      case "subwise": return "bg-blue-500";
      case "xgrowth": return "bg-purple-500";
      case "philosophy": return "bg-cyan-500";
      default: return "bg-gray-500";
    }
  };

  const getTypeLabel = (postType: string) => {
    return postType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-purple-500" />
          AI Post Generator
        </h1>
        <p className="text-muted-foreground">
          Generate 5 posts/day for your 30-day challenge (0 → 250 followers)
        </p>
      </div>

      {/* Daily Input Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Daily Input - {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</CardTitle>
          <CardDescription>
            Tell me what happened yesterday. I&apos;ll generate 5 optimized posts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Challenge Day */}
          <div>
            <Label htmlFor="challengeDay" className="text-base font-semibold">Challenge Day</Label>
            <Input
              id="challengeDay"
              type="number"
              min="1"
              max="30"
              value={challengeDay}
              onChange={(e) => setChallengeDay(parseInt(e.target.value) || 1)}
              className="mt-2 max-w-xs"
              placeholder="e.g., 1, 5, 15"
            />
            <p className="text-sm text-muted-foreground mt-1">What day of the 30-day challenge are you on?</p>
          </div>

          {/* Metrics */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Current Metrics</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="followers" className="text-sm">X Followers</Label>
                <Input
                  id="followers"
                  type="number"
                  value={metrics.followers}
                  onChange={(e) => setMetrics({ ...metrics, followers: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="subwiseUsers" className="text-sm">SubWise Users</Label>
                <Input
                  id="subwiseUsers"
                  type="number"
                  value={metrics.subwiseUsers}
                  onChange={(e) => setMetrics({ ...metrics, subwiseUsers: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="subwiseMRR" className="text-sm">SubWise MRR ($)</Label>
                <Input
                  id="subwiseMRR"
                  type="number"
                  value={metrics.subwiseMRR}
                  onChange={(e) => setMetrics({ ...metrics, subwiseMRR: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="training" className="text-sm">Training (min)</Label>
                <Input
                  id="training"
                  type="number"
                  value={metrics.trainingMinutes}
                  onChange={(e) => setMetrics({ ...metrics, trainingMinutes: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Events */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Events (What happened?)</Label>
            {events.map((event, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={event}
                  onChange={(e) => updateField(setEvents, index, e.target.value)}
                  placeholder="e.g., Trained 90 min BJJ, Got 2 new SubWise signups"
                />
                {events.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeField(setEvents, index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addField(setEvents)} className="mt-2">
              + Add Event
            </Button>
          </div>

          {/* Insights */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Insights (What did you learn?)</Label>
            {insights.map((insight, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={insight}
                  onChange={(e) => updateField(setInsights, index, e.target.value)}
                  placeholder="e.g., Realized async processing > cron jobs, Consistency beats intensity"
                />
                {insights.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeField(setInsights, index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addField(setInsights)} className="mt-2">
              + Add Insight
            </Button>
          </div>

          {/* Struggles */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Struggles (What was hard?)</Label>
            {struggles.map((struggle, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={struggle}
                  onChange={(e) => updateField(setStruggles, index, e.target.value)}
                  placeholder="e.g., Hit wall with webhook integration, Tired after training"
                />
                {struggles.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeField(setStruggles, index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addField(setStruggles)} className="mt-2">
              + Add Struggle
            </Button>
          </div>

          {/* Future Plans */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Future Plans (What are you building/planning?)</Label>
            {futurePlans.map((plan, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={plan}
                  onChange={(e) => updateField(setFuturePlans, index, e.target.value)}
                  placeholder="e.g., Building analytics dashboard, Planning to add email notifications"
                />
                {futurePlans.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeField(setFuturePlans, index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addField(setFuturePlans)} className="mt-2">
              + Add Plan
            </Button>
          </div>

          <Button
            onClick={handleGeneratePosts}
            disabled={generating}
            className="w-full bg-purple-500 hover:bg-purple-600"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating 5 Posts...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Today&apos;s 5 Posts
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Posts */}
      {generatedPosts && generatedPosts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Today&apos;s Posts ({generatedPosts.length})</h2>
          <div className="space-y-4">
            {generatedPosts.map((post, index) => (
              <Card key={post._id} className="border-muted">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(post.category)}>
                          {post.category.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {getTypeLabel(post.postType)}
                        </Badge>
                        {post.status === "posted" && (
                          <Badge className="bg-green-500">Posted</Badge>
                        )}
                        {post.status === "approved" && (
                          <Badge className="bg-blue-500">Approved</Badge>
                        )}
                        {post.status === "rejected" && (
                          <Badge className="bg-gray-500">Rejected</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-500">
                          {post.algorithmScore}/100
                        </div>
                        <p className="text-xs text-muted-foreground">Predicted Score</p>
                      </div>
                    </div>

                    {/* Content */}
                    {editingPostId === post._id ? (
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={6}
                        className="font-mono text-sm"
                      />
                    ) : (
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm font-mono whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>
                    )}

                    {/* Media Suggestion */}
                    {post.suggestMedia && (
                      <div className="text-sm text-muted-foreground bg-blue-500/10 p-3 rounded border border-blue-500/20">
                        💡 <strong>Suggestion:</strong> Add {post.mediaType || "a photo/video"} to boost engagement by 2x
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {editingPostId === post._id ? (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleSaveEdit(post._id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingPostId(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(post.content, index)}
                          >
                            {copiedIndex === index ? (
                              <Check className="h-4 w-4 mr-1" />
                            ) : (
                              <Copy className="h-4 w-4 mr-1" />
                            )}
                            {copiedIndex === index ? "Copied" : "Copy"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(post._id, post.content)}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {post.status !== "approved" && post.status !== "posted" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(post._id)}
                              className="bg-blue-500/10 text-blue-500 border-blue-500/20"
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          {post.status === "approved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsPosted(post._id)}
                              className="bg-green-500/10 text-green-500 border-green-500/20"
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Mark as Posted
                            </Button>
                          )}
                          {post.status !== "posted" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(post._id)}
                                className="hover:bg-red-500/10 hover:text-red-500"
                              >
                                <ThumbsDown className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(post._id)}
                                className="hover:bg-red-500/10 hover:text-red-500"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
