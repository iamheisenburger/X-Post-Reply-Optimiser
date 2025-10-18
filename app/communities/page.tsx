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
import { Loader2, Users, RefreshCw, Copy, Check, Edit2, ThumbsUp, ThumbsDown, Send, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Default communities - Add your Twitter Community IDs here
const DEFAULT_COMMUNITIES = [
  {
    name: "Software Engineering",
    description: "Professional software engineers discussing code quality, architecture, and best practices",
    communityId: "", // Add your community ID
  },
  {
    name: "Indie Hackers",
    description: "Solo founders building and growing profitable online businesses",
    communityId: "", // Add your community ID
  },
  {
    name: "Build in Public",
    description: "Entrepreneurs sharing their journey transparently, including metrics and struggles",
    communityId: "", // Add your community ID
  },
  {
    name: "The First Thousand",
    description: "Creators growing from 0 to 1000 followers sharing tactics and strategies",
    communityId: "", // Add your community ID
  },
];

export default function CommunitiesPage() {
  const [date] = useState(() => new Date().toISOString().split('T')[0]);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Form state
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
  const communityProfiles = useQuery(api.communityProfiles.listAll);
  const todayPosts = useQuery(api.communityPosts.getToday);

  // Mutations
  const updatePost = useMutation(api.communityPosts.update);
  const approvePost = useMutation(api.communityPosts.approve);
  const markAsPosted = useMutation(api.communityPosts.markAsPosted);
  const rejectPost = useMutation(api.communityPosts.reject);
  const deletePost = useMutation(api.communityPosts.remove);

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

  const handleAnalyzeCommunity = async (community: typeof DEFAULT_COMMUNITIES[0]) => {
    if (!community.communityId) {
      toast({
        title: "Community ID missing",
        description: "Please add the Twitter Community ID for this community in the code",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setAnalyzing(community.name);

    try {
      const response = await fetch('/api/analyze-community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityName: community.name,
          communityDescription: community.description,
          communityId: community.communityId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze community');
      }

      const data = await response.json();
      console.log('✅ Community analyzed:', data);

      toast({
        title: "Community analyzed!",
        description: `Analyzed ${data.analyzedTweets} tweets from ${community.name}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('❌ Error analyzing community:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze community",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setAnalyzing(null);
    }
  };

  const handleGeneratePosts = async () => {
    setGenerating(true);

    try {
      const response = await fetch('/api/generate-community-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          events: events.filter(e => e.trim()),
          insights: insights.filter(i => i.trim()),
          struggles: struggles.filter(s => s.trim()),
          futurePlans: futurePlans.filter(p => p.trim()),
          metrics,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate posts');
      }

      const data = await response.json();
      console.log('✅ Community posts generated:', data);

      toast({
        title: "Posts generated!",
        description: `Generated ${data.generated} community posts successfully!`,
        duration: 3000,
      });
    } catch (error) {
      console.error('❌ Error generating posts:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate posts",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: "Copied!",
        description: "Post copied to clipboard",
        duration: 3000,
      });
    } catch (error) {
      console.error('Copy failed:', error);
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive",
        duration: 3000,
      });
    }
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
      duration: 3000,
    });
  };

  const handleApprove = async (postId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await approvePost({ id: postId as any });
    toast({
      title: "Approved!",
      description: "Post is ready to be posted",
      duration: 3000,
    });
  };

  const handleMarkAsPosted = async (postId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await markAsPosted({ id: postId as any });
    toast({
      title: "Marked as posted!",
      description: "Post tracked in content bank",
      duration: 3000,
    });
  };

  const handleReject = async (postId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await rejectPost({ id: postId as any });
    toast({
      title: "Rejected",
      description: "Post will not be used",
      duration: 3000,
    });
  };

  const handleDelete = async (postId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await deletePost({ id: postId as any });
    toast({
      title: "Deleted",
      description: "Post removed",
      duration: 3000,
    });
  };

  const getCommunityColor = (name: string) => {
    switch (name) {
      case "Software Engineering": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Indie Hackers": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "Build in Public": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "The First Thousand": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Users className="h-8 w-8 text-purple-500" />
          Community Posts
        </h1>
        <p className="text-muted-foreground">
          Generate native posts for your target communities to maximize engagement and followers
        </p>
      </div>

      {/* Community Profiles Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Community Voice Profiles</CardTitle>
          <CardDescription>
            Analyze communities to understand their voice, then generate posts that sound native
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_COMMUNITIES.map((community) => {
              const profile = communityProfiles?.find(p => p.communityName === community.name);
              const isAnalyzing = analyzing === community.name;

              return (
                <div key={community.name} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{community.name}</h3>
                      <p className="text-sm text-muted-foreground">{community.description}</p>
                    </div>
                    {profile && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">
                        Analyzed
                      </Badge>
                    )}
                  </div>

                  {profile && (
                    <div className="text-sm space-y-1 mb-3">
                      <p><strong>Tone:</strong> {profile.voiceProfile.toneCharacteristics.slice(0, 2).join(", ")}</p>
                      <p><strong>Length:</strong> {profile.voiceProfile.lengthPreference}</p>
                      <p><strong>Depth:</strong> {profile.voiceProfile.technicalDepth}</p>
                      <p className="text-muted-foreground">
                        Last analyzed: {new Date(profile.lastAnalyzed).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAnalyzeCommunity(community)}
                    disabled={isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {profile ? "Re-analyze" : "Analyze Community"}
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily Input Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Daily Input - {new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</CardTitle>
          <CardDescription>
            Tell me what happened. I&apos;ll generate 4 community-native posts (1 per community).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                  placeholder="e.g., Shipped new feature, Got 2 signups"
                />
                {events.length > 1 && (
                  <Button variant="outline" size="icon" onClick={() => removeField(setEvents, index)}>
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
                  placeholder="e.g., Async processing beats cron jobs"
                />
                {insights.length > 1 && (
                  <Button variant="outline" size="icon" onClick={() => removeField(setInsights, index)}>
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
                  placeholder="e.g., Hit wall with webhook integration"
                />
                {struggles.length > 1 && (
                  <Button variant="outline" size="icon" onClick={() => removeField(setStruggles, index)}>
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
            <Label className="text-base font-semibold mb-3 block">Future Plans (What are you building?)</Label>
            {futurePlans.map((plan, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={plan}
                  onChange={(e) => updateField(setFuturePlans, index, e.target.value)}
                  placeholder="e.g., Building analytics dashboard"
                />
                {futurePlans.length > 1 && (
                  <Button variant="outline" size="icon" onClick={() => removeField(setFuturePlans, index)}>
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
            disabled={generating || !communityProfiles || communityProfiles.length === 0}
            className="w-full bg-purple-500 hover:bg-purple-600"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating Community Posts...
              </>
            ) : (
              <>
                <Users className="h-5 w-5 mr-2" />
                Generate Today&apos;s Community Posts
              </>
            )}
          </Button>

          {communityProfiles && communityProfiles.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Analyze communities first to enable post generation
            </p>
          )}
        </CardContent>
      </Card>

      {/* Generated Posts */}
      {todayPosts && todayPosts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Today&apos;s Community Posts ({todayPosts.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayPosts.map((post, index) => (
              <Card key={post._id} className="border-muted">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={getCommunityColor(post.communityName)}>
                          {post.communityName}
                        </Badge>
                        <Badge variant="outline" className="text-sm">
                          {post.category}
                        </Badge>
                        {post.status === "posted" && <Badge className="bg-green-500">Posted</Badge>}
                        {post.status === "approved" && <Badge className="bg-blue-500">Approved</Badge>}
                        {post.status === "rejected" && <Badge className="bg-gray-500">Rejected</Badge>}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-purple-500">
                          {post.algorithmScore}/100
                        </div>
                        <p className="text-xs text-muted-foreground">Algo Score</p>
                        <div className="text-sm font-semibold text-blue-500 mt-1">
                          {post.communityFitScore}/100
                        </div>
                        <p className="text-xs text-muted-foreground">Community Fit</p>
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
                        💡 <strong>Suggestion:</strong> Add {post.mediaType || "a photo/video"} to boost engagement
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {editingPostId === post._id ? (
                        <>
                          <Button variant="default" size="sm" onClick={() => handleSaveEdit(post._id)}>
                            <Check className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditingPostId(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleCopy(post.content, index)}>
                            {copiedIndex === index ? (
                              <Check className="h-4 w-4 mr-1" />
                            ) : (
                              <Copy className="h-4 w-4 mr-1" />
                            )}
                            {copiedIndex === index ? "Copied" : "Copy"}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(post._id, post.content)}>
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
