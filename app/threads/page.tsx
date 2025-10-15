"use client";

import { useState, useEffect } from "react";
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

export default function ThreadsPage() {
  const [date] = useState(() => new Date().toISOString().split('T')[0]);
  const [generating, setGenerating] = useState(false);

  // Form state - same as posts page
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
  const [challengeDay, setChallengeDay] = useState<number>(1);

  // UI state
  const [editingTweetIndex, setEditingTweetIndex] = useState<number | null>(null);
  const [editedTweetContent, setEditedTweetContent] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const { toast } = useToast();

  // Queries
  const todayInput = useQuery(api.threadGeneration.getTodayThreadInput);
  const generatedThread = useQuery(api.threadGeneration.getTodayGeneratedThread);

  // Mutations
  const saveThreadInput = useMutation(api.threadGeneration.saveThreadInput);
  const saveGeneratedThread = useMutation(api.threadGeneration.saveGeneratedThread);
  const updateThread = useMutation(api.threadGeneration.updateGeneratedThread);
  const approveThread = useMutation(api.threadGeneration.approveThread);
  const markAsPosted = useMutation(api.threadGeneration.markThreadAsPosted);
  const rejectThread = useMutation(api.threadGeneration.rejectThread);
  const deleteThread = useMutation(api.threadGeneration.deleteGeneratedThread);
  const addToThreadsContext = useMutation(api.contextManagement.addToThreadsContext);

  // Load existing input if available
  useEffect(() => {
    if (todayInput) {
      setEvents(todayInput.wins.length > 0 ? todayInput.wins : [""]);
      setInsights(todayInput.lessons.length > 0 ? todayInput.lessons : [""]);
      setStruggles(todayInput.struggles.length > 0 ? todayInput.struggles : [""]);
      setFuturePlans(todayInput.futurePlans.length > 0 ? todayInput.futurePlans : [""]);
      setMetrics({
        followers: todayInput.metrics.followers,
        subwiseUsers: todayInput.metrics.subwiseUsers,
        subwiseMRR: todayInput.metrics.subwiseMRR || 0,
        trainingMinutes: todayInput.metrics.trainingMinutes || 0,
      });
      if (todayInput.challengeDay) {
        setChallengeDay(todayInput.challengeDay);
      }
    }
  }, [todayInput]);

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

  const handleGenerateThread = async () => {
    setGenerating(true);

    try {
      // Save thread input (using wins/lessons naming for Convex compatibility)
      await saveThreadInput({
        date,
        challengeDay,
        wins: events.filter(e => e.trim()),
        lessons: insights.filter(i => i.trim()),
        struggles: struggles.filter(s => s.trim()),
        tomorrowFocus: [],
        futurePlans: futurePlans.filter(p => p.trim()),
        metrics,
      });

      // Update threads context for dynamic AI learning
      await addToThreadsContext({
        date,
        challengeDay,
        wins: events.filter(e => e.trim()),
        lessons: insights.filter(i => i.trim()),
        struggles: struggles.filter(s => s.trim()),
        tomorrowFocus: [],
        futurePlans: futurePlans.filter(p => p.trim()),
        metrics: {
          followers: metrics.followers,
          subwiseUsers: metrics.subwiseUsers,
        },
      });

      // Call API to generate thread
      const response = await fetch('/api/generate-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          challengeDay,
          wins: events.filter(e => e.trim()),
          lessons: insights.filter(i => i.trim()),
          struggles: struggles.filter(s => s.trim()),
          tomorrowFocus: [],
          futurePlans: futurePlans.filter(p => p.trim()),
          metrics,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate thread');
      }

      const data = await response.json();

      // Parse thread content into tweets (split by double line breaks or single if not found)
      let tweets = data.thread.content.split('\n\n').filter((t: string) => t.trim());
      
      // If only got 1 tweet, try splitting by single line breaks (Claude didn't follow format)
      if (tweets.length <= 1) {
        tweets = data.thread.content.split('\n').filter((t: string) => t.trim());
      }

      // Build save object, only including fields that have values
      // Map conversationTrigger to narrativeFlow for Convex schema
      const saveData: {
        date: string;
        challengeDay: number;
        tweets: string[];
        threadType: string;
        algorithmScore: number;
        scoreBreakdown: {
          hookStrength: number;
          narrativeFlow: number;
          specificity: number;
          authenticity: number;
        };
        suggestMedia: boolean;
        mediaType?: string;
        mediaSuggestions?: string[];
      } = {
        date: data.thread.date,
        challengeDay,
        tweets,
        threadType: "daily_reflection",
        algorithmScore: data.thread.algorithmScore,
        scoreBreakdown: {
          hookStrength: data.thread.scoreBreakdown.hookStrength,
          narrativeFlow: data.thread.scoreBreakdown.conversationTrigger, // Map to narrativeFlow
          specificity: data.thread.scoreBreakdown.specificity,
          authenticity: data.thread.scoreBreakdown.authenticity,
        },
        suggestMedia: data.thread.suggestMedia,
      };

      // Only add mediaType if it exists
      if (data.thread.mediaType) {
        saveData.mediaType = data.thread.mediaType;
      }

      // Only add mediaSuggestions if it exists
      if (data.thread.mediaSuggestions) {
        saveData.mediaSuggestions = [data.thread.mediaSuggestions];
      }

      // Save generated thread to Convex
      await saveGeneratedThread(saveData);

      toast({
        title: "Thread generated!",
        description: `Generated a ${tweets.length}-tweet thread for Day ${challengeDay}`,
        duration: 3000, // Auto-dismiss after 3 seconds
      });
    } catch (error) {
      console.error('Error generating thread:', error);
      toast({
        title: "Error",
        description: "Failed to generate thread. Please try again.",
        variant: "destructive",
        duration: 5000, // Error messages stay a bit longer
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyThread = async () => {
    if (!generatedThread) return;

    try {
      const threadText = generatedThread.tweets.map((tweet, i) => 
        `${i + 1}/${generatedThread.tweets.length}\n${tweet}`
      ).join('\n\n');
      
      await navigator.clipboard.writeText(threadText);
      
      toast({
        title: "Thread copied!",
        description: "Full thread copied to clipboard",
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

  const handleCopyTweet = async (tweet: string, index: number) => {
    try {
      await navigator.clipboard.writeText(tweet);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: "Tweet copied!",
        description: "Tweet copied to clipboard",
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

  const handleEditTweet = (index: number, content: string) => {
    setEditingTweetIndex(index);
    setEditedTweetContent(content);
  };

  const handleSaveEdit = async () => {
    if (!generatedThread || editingTweetIndex === null) return;

    const updatedTweets = [...generatedThread.tweets];
    updatedTweets[editingTweetIndex] = editedTweetContent;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateThread({ id: generatedThread._id as any, tweets: updatedTweets });
    setEditingTweetIndex(null);
    toast({
      title: "Tweet updated!",
      description: "Thread has been edited",
      duration: 3000, // Auto-dismiss after 3 seconds
    });
  };

  const handleApprove = async () => {
    if (!generatedThread) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await approveThread({ id: generatedThread._id as any });
    toast({
      title: "Approved!",
      description: "Thread is ready to be posted",
      duration: 3000, // Auto-dismiss after 3 seconds
    });
  };

  const handleMarkAsPosted = async () => {
    if (!generatedThread) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await markAsPosted({ id: generatedThread._id as any });
    toast({
      title: "Marked as posted!",
      description: "Thread tracked",
      duration: 3000, // Auto-dismiss after 3 seconds
    });
  };

  const handleReject = async () => {
    if (!generatedThread) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await rejectThread({ id: generatedThread._id as any });
    toast({
      title: "Rejected",
      description: "Thread will not be used",
      duration: 3000, // Auto-dismiss after 3 seconds
    });
  };

  const handleDelete = async () => {
    if (!generatedThread) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await deleteThread({ id: generatedThread._id as any });
    toast({
      title: "Deleted",
      description: "Thread removed",
      duration: 3000, // Auto-dismiss after 3 seconds
    });
  };

  const getThreadTypeColor = (type: string) => {
    switch (type) {
      case "progress_update": return "bg-blue-500";
      case "lesson_thread": return "bg-purple-500";
      case "bts": return "bg-orange-500";
      case "prediction_analysis": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getThreadTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-purple-500" />
          30-Day Challenge Thread Generator
        </h1>
        <p className="text-muted-foreground">
          Daily reflection threads for your 3 → 250 followers challenge
        </p>
      </div>

      {/* Daily Input Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</CardTitle>
          <CardDescription>
            Tell me about your day. I&apos;ll generate a compelling thread for your challenge.
          </CardDescription>
        </CardHeader>
          <CardContent className="space-y-6">
            {/* Challenge Day */}
            <div>
              <Label htmlFor="challengeDay" className="text-base font-semibold mb-3 block">Challenge Day</Label>
              <Input
                id="challengeDay"
                type="number"
                value={challengeDay}
                onChange={(e) => setChallengeDay(parseInt(e.target.value) || 1)}
                className="max-w-[200px]"
                placeholder="What day of the challenge are you on?"
              />
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
              <Label className="text-base font-semibold mb-3 block">Struggles/Failures (What was hard?)</Label>
              {struggles.map((struggle, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={struggle}
                    onChange={(e) => updateField(setStruggles, index, e.target.value)}
                    placeholder="e.g., Tired after training, Hit wall with feature implementation"
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
              onClick={handleGenerateThread}
              disabled={generating}
              className="w-full bg-purple-500 hover:bg-purple-600"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating Thread...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Day {challengeDay} Thread
                </>
              )}
            </Button>
        </CardContent>
      </Card>

      {/* Generated Thread */}
      {generatedThread && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Day {generatedThread.challengeDay} Thread</h2>
            <Button variant="outline" onClick={handleCopyThread}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Full Thread
            </Button>
          </div>

          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getThreadTypeColor(generatedThread.threadType)}>
                      {getThreadTypeLabel(generatedThread.threadType)}
                    </Badge>
                    {generatedThread.status === "posted" && (
                      <Badge className="bg-green-500">Posted</Badge>
                    )}
                    {generatedThread.status === "approved" && (
                      <Badge className="bg-blue-500">Approved</Badge>
                    )}
                    {generatedThread.status === "rejected" && (
                      <Badge className="bg-gray-500">Rejected</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-500">
                      {generatedThread.algorithmScore}/100
                    </div>
                    <p className="text-xs text-muted-foreground">Predicted Score</p>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="text-sm">
                    <p className="text-muted-foreground">Hook</p>
                    <p className="font-semibold">{generatedThread.scoreBreakdown.hookStrength}/100</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Flow</p>
                    <p className="font-semibold">{generatedThread.scoreBreakdown.narrativeFlow}/100</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Data</p>
                    <p className="font-semibold">{generatedThread.scoreBreakdown.specificity}/100</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Authentic</p>
                    <p className="font-semibold">{generatedThread.scoreBreakdown.authenticity}/100</p>
                  </div>
                </div>

                {/* Media Suggestion */}
                {generatedThread.suggestMedia && generatedThread.mediaSuggestions && (
                  <div className="text-sm text-muted-foreground bg-blue-500/10 p-3 rounded border border-blue-500/20">
                    <p className="font-semibold mb-1">💡 Media Suggestions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {generatedThread.mediaSuggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Thread Tweets */}
                <div className="space-y-3">
                  {generatedThread.tweets.map((tweet, index) => (
                    <div key={index} className="border-l-2 border-purple-500 pl-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs text-muted-foreground font-semibold">
                          Tweet {index + 1}/{generatedThread.tweets.length}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyTweet(tweet, index)}
                          >
                            {copiedIndex === index ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          {generatedThread.status !== "posted" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTweet(index, tweet)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {editingTweetIndex === index ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editedTweetContent}
                            onChange={(e) => setEditedTweetContent(e.target.value)}
                            rows={3}
                            className="font-mono text-sm"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Check className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingTweetIndex(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-muted p-3 rounded text-sm font-mono whitespace-pre-wrap">
                          {tweet}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap pt-4 border-t">
                  {generatedThread.status !== "approved" && generatedThread.status !== "posted" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApprove}
                      className="bg-blue-500/10 text-blue-500 border-blue-500/20"
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  {generatedThread.status === "approved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkAsPosted}
                      className="bg-green-500/10 text-green-500 border-green-500/20"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Mark as Posted
                    </Button>
                  )}
                  {generatedThread.status !== "posted" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReject}
                        className="hover:bg-red-500/10 hover:text-red-500"
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDelete}
                        className="hover:bg-red-500/10 hover:text-red-500"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
