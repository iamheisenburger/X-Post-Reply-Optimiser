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

  // Form state
  const [wins, setWins] = useState<string[]>([""]);
  const [lessons, setLessons] = useState<string[]>([""]);
  const [struggles, setStruggles] = useState<string[]>([""]);
  const [tomorrowFocus, setTomorrowFocus] = useState<string[]>([""]);
  const [futurePlans, setFuturePlans] = useState<string[]>([""]);
  const [metrics, setMetrics] = useState({
    followers: 3,
    subwiseUsers: 0,
    subwiseMRR: 0,
    trainingMinutes: 0,
  });
  const [challengeDay, setChallengeDay] = useState(1);
  const [challengeStartDate, setChallengeStartDate] = useState<string>("");

  // UI state
  const [editingTweetIndex, setEditingTweetIndex] = useState<number | null>(null);
  const [editedTweetContent, setEditedTweetContent] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const { toast } = useToast();

  // Queries
  const todayInput = useQuery(api.threadGeneration.getTodayThreadInput);
  const generatedThread = useQuery(api.threadGeneration.getTodayGeneratedThread);
  const savedChallengeStartDate = useQuery(api.threadGeneration.getChallengeStartDate);

  // Mutations
  const saveThreadInput = useMutation(api.threadGeneration.saveThreadInput);
  const saveGeneratedThread = useMutation(api.threadGeneration.saveGeneratedThread);
  const updateThread = useMutation(api.threadGeneration.updateGeneratedThread);
  const approveThread = useMutation(api.threadGeneration.approveThread);
  const markAsPosted = useMutation(api.threadGeneration.markThreadAsPosted);
  const rejectThread = useMutation(api.threadGeneration.rejectThread);
  const deleteThread = useMutation(api.threadGeneration.deleteGeneratedThread);
  const setChallengeStart = useMutation(api.threadGeneration.setChallengeStartDate);

  // Calculate challenge day from start date
  useEffect(() => {
    if (savedChallengeStartDate) {
      setChallengeStartDate(savedChallengeStartDate);
      const start = new Date(savedChallengeStartDate);
      const today = new Date(date);
      const daysDiff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setChallengeDay(Math.max(1, daysDiff));
    }
  }, [savedChallengeStartDate, date]);

  // Load existing input if available
  useEffect(() => {
    if (todayInput) {
      setWins(todayInput.wins.length > 0 ? todayInput.wins : [""]);
      setLessons(todayInput.lessons.length > 0 ? todayInput.lessons : [""]);
      setStruggles(todayInput.struggles.length > 0 ? todayInput.struggles : [""]);
      setTomorrowFocus(todayInput.tomorrowFocus.length > 0 ? todayInput.tomorrowFocus : [""]);
      setFuturePlans(todayInput.futurePlans.length > 0 ? todayInput.futurePlans : [""]);
      setMetrics({
        followers: todayInput.metrics.followers,
        subwiseUsers: todayInput.metrics.subwiseUsers,
        subwiseMRR: todayInput.metrics.subwiseMRR || 0,
        trainingMinutes: todayInput.metrics.trainingMinutes || 0,
      });
      setChallengeDay(todayInput.challengeDay);
    }
  }, [todayInput]);

  const handleSetChallengeStartDate = async () => {
    if (!challengeStartDate) {
      toast({
        title: "Error",
        description: "Please enter a start date",
        variant: "destructive",
      });
      return;
    }

    try {
      await setChallengeStart({ startDate: challengeStartDate });
      toast({
        title: "Challenge start date set!",
        description: `Your challenge started on ${challengeStartDate}`,
      });
    } catch (error) {
      console.error('Error setting start date:', error);
      toast({
        title: "Error",
        description: "Failed to set start date",
        variant: "destructive",
      });
    }
  };

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
    if (!savedChallengeStartDate) {
      toast({
        title: "Set challenge start date first",
        description: "Please set your challenge start date before generating threads",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      // Save thread input
      await saveThreadInput({
        date,
        challengeDay,
        wins: wins.filter(w => w.trim()),
        lessons: lessons.filter(l => l.trim()),
        struggles: struggles.filter(s => s.trim()),
        tomorrowFocus: tomorrowFocus.filter(t => t.trim()),
        futurePlans: futurePlans.filter(p => p.trim()),
        metrics,
      });

      // Call API to generate thread
      const response = await fetch('/api/generate-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          challengeDay,
          wins: wins.filter(w => w.trim()),
          lessons: lessons.filter(l => l.trim()),
          struggles: struggles.filter(s => s.trim()),
          tomorrowFocus: tomorrowFocus.filter(t => t.trim()),
          futurePlans: futurePlans.filter(p => p.trim()),
          metrics,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate thread');
      }

      const data = await response.json();

      // Parse thread content into tweets (split by double line breaks)
      const tweets = data.thread.content.split('\n\n').filter((t: string) => t.trim());

      // Save generated thread to Convex
      await saveGeneratedThread({
        date: data.thread.date,
        challengeDay,
        tweets,
        threadType: "daily_reflection",
        algorithmScore: data.thread.algorithmScore,
        scoreBreakdown: data.thread.scoreBreakdown,
        suggestMedia: data.thread.suggestMedia,
        mediaType: data.thread.mediaType || undefined,
        mediaSuggestions: data.thread.mediaSuggestions ? [data.thread.mediaSuggestions] : undefined,
      });

      toast({
        title: "Thread generated!",
        description: `Generated a ${tweets.length}-tweet thread for Day ${challengeDay}`,
      });
    } catch (error) {
      console.error('Error generating thread:', error);
      toast({
        title: "Error",
        description: "Failed to generate thread. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyThread = async () => {
    if (!generatedThread) return;

    const threadText = generatedThread.tweets.map((tweet, i) => `${i + 1}/${generatedThread.tweets.length}\n${tweet}`).join('\n\n');
    await navigator.clipboard.writeText(threadText);
    toast({
      title: "Thread copied!",
      description: "Full thread copied to clipboard",
    });
  };

  const handleCopyTweet = async (tweet: string, index: number) => {
    await navigator.clipboard.writeText(tweet);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Tweet copied!",
      description: "Tweet copied to clipboard",
    });
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
    });
  };

  const handleApprove = async () => {
    if (!generatedThread) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await approveThread({ id: generatedThread._id as any });
    toast({
      title: "Approved!",
      description: "Thread is ready to be posted",
    });
  };

  const handleMarkAsPosted = async () => {
    if (!generatedThread) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await markAsPosted({ id: generatedThread._id as any });
    toast({
      title: "Marked as posted!",
      description: "Thread tracked",
    });
  };

  const handleReject = async () => {
    if (!generatedThread) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await rejectThread({ id: generatedThread._id as any });
    toast({
      title: "Rejected",
      description: "Thread will not be used",
    });
  };

  const handleDelete = async () => {
    if (!generatedThread) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await deleteThread({ id: generatedThread._id as any });
    toast({
      title: "Deleted",
      description: "Thread removed",
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

      {/* Challenge Setup */}
      {!savedChallengeStartDate && (
        <Card className="mb-8 border-purple-500">
          <CardHeader>
            <CardTitle>Set Challenge Start Date</CardTitle>
            <CardDescription>
              When did you start your 30-day challenge? This will help track your progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={challengeStartDate}
                  onChange={(e) => setChallengeStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleSetChallengeStartDate} className="bg-purple-500 hover:bg-purple-600">
                Set Start Date
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Input Form */}
      {savedChallengeStartDate && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Day {challengeDay} - {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</CardTitle>
            <CardDescription>
              Tell me about your day. I&apos;ll generate a compelling thread for your challenge.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Metrics */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Current Metrics (Day {challengeDay})</Label>
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

            {/* Wins */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Today&apos;s Wins (What went well?)</Label>
              {wins.map((win, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={win}
                    onChange={(e) => updateField(setWins, index, e.target.value)}
                    placeholder="e.g., Got 5 new followers, Finished analytics dashboard"
                  />
                  {wins.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeField(setWins, index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addField(setWins)} className="mt-2">
                + Add Win
              </Button>
            </div>

            {/* Lessons */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Lessons Learned (What did you discover?)</Label>
              {lessons.map((lesson, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={lesson}
                    onChange={(e) => updateField(setLessons, index, e.target.value)}
                    placeholder="e.g., Consistency beats intensity, Early replies drive engagement"
                  />
                  {lessons.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeField(setLessons, index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addField(setLessons)} className="mt-2">
                + Add Lesson
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

            {/* Tomorrow's Focus */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Tomorrow&apos;s Focus (What are you working on next?)</Label>
              {tomorrowFocus.map((focus, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={focus}
                    onChange={(e) => updateField(setTomorrowFocus, index, e.target.value)}
                    placeholder="e.g., Ship user dashboard, Train 90 min BJJ"
                  />
                  {tomorrowFocus.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeField(setTomorrowFocus, index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addField(setTomorrowFocus)} className="mt-2">
                + Add Focus
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
      )}

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
