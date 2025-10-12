"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ActivityPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  });

  const todayStats = useQuery(api.sentReplies.getTodayStats);
  const sentReplies = useQuery(api.sentReplies.getSentRepliesByDate, {
    date: selectedDate,
  });
  const deleteReply = useMutation(api.sentReplies.deleteReply);
  const { toast } = useToast();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: number | undefined) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const goToPreviousDay = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Don't allow going to future dates
    const today = new Date();
    if (tomorrow <= today) {
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const isCurrentDateReached = new Date(selectedDate + 'T00:00:00') >= new Date(new Date().toISOString().split('T')[0]);

  const formatStrategyName = (strategy: string | undefined) => {
    if (!strategy) return 'Unknown';
    return strategy.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getModeColor = (mode: string | undefined) => {
    if (!mode) return "bg-gray-500";
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

  const handleDeleteReply = async (replyId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await deleteReply({ id: replyId as any });
      toast({
        title: "Reply deleted",
        description: "The reply has been removed from your activity.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete reply. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get stats for selected date (use todayStats if it's today, otherwise calculate from replies)
  const displayStats = isToday && todayStats ? todayStats : {
    repliesSent: sentReplies?.length || 0,
    avgScore: sentReplies && sentReplies.length > 0
      ? Math.round(sentReplies.reduce((sum, r) => sum + r.algorithmScore, 0) / sentReplies.length)
      : 0,
    creators: sentReplies
      ? Array.from(new Map(sentReplies.map(r => [r.targetUsername, r])).values())
          .map(r => ({ username: r.targetUsername || 'unknown', count: 1 }))
      : [],
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-purple-500" />
          Daily Activity
        </h1>
        <p className="text-muted-foreground">
          Track your reply activity and see what you&apos;ve sent
        </p>
      </div>

      {/* Date Navigator */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-xl font-bold">{formatDate(selectedDate)}</h2>
              </div>
              {!isToday && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={goToToday}
                  className="text-xs"
                >
                  Jump to Today
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNextDay}
              disabled={isCurrentDateReached}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Replies Sent</CardDescription>
            <CardTitle className="text-3xl font-bold text-purple-500">
              {displayStats.repliesSent}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Score</CardDescription>
            <CardTitle className="text-3xl font-bold text-blue-500">
              {displayStats.avgScore}/100
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Creators Engaged</CardDescription>
            <CardTitle className="text-3xl font-bold text-green-500">
              {displayStats.creators.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Sent Replies List */}
      <Card>
        <CardHeader>
          <CardTitle>Sent Replies ({sentReplies?.length || 0})</CardTitle>
          <CardDescription>
            Replies you marked as sent on this date
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sentReplies ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : sentReplies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No replies sent on this date</p>
              <p className="text-sm">
                {isToday
                  ? "Generate and mark replies as sent to track them here"
                  : "Try selecting a different date"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sentReplies.map((reply) => (
                <Card key={reply._id} className="border-muted">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">@{reply.targetUsername}</span>
                            <Badge className={getModeColor(reply.strategy)}>
                              {formatStrategyName(reply.strategy)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Sent at {formatTime(reply.postedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-purple-500">
                              {reply.algorithmScore}/100
                            </div>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteReply(reply._id)}
                            className="hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Reply Text */}
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm font-mono whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </div>

                      {/* Original Tweet */}
                      {reply.tweetContent && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View original tweet
                          </summary>
                          <div className="mt-2 p-3 bg-muted/50 rounded border-l-2 border-muted-foreground/20">
                            <p className="text-sm">{reply.tweetContent}</p>
                            {reply.tweetUrl && (
                              <a
                                href={reply.tweetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-purple-500 hover:underline mt-2 inline-block"
                              >
                                View on X →
                              </a>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
