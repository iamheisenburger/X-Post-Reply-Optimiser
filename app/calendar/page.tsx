"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  // Get daily stats for the current month
  const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    .toISOString().split('T')[0];
  const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    .toISOString().split('T')[0];

  const monthStats = useQuery(api.sentReplies.getDailyStatsRange, {
    startDate,
    endDate,
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0-6 (Sunday-Saturday)

    return { daysInMonth, startDayOfWeek, year, month };
  };

  const { daysInMonth, startDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const today = new Date();

    // Don't allow going beyond current month
    if (nextMonth.getFullYear() < today.getFullYear() ||
        (nextMonth.getFullYear() === today.getFullYear() && nextMonth.getMonth() <= today.getMonth())) {
      setCurrentMonth(nextMonth);
    }
  };

  const getReplyCountForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const stat = monthStats?.find(s => s.date === dateStr);
    return stat?.repliesSent || 0;
  };

  const getColorForCount = (count: number) => {
    if (count === 0) return "bg-muted text-muted-foreground";
    if (count <= 2) return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30";
    if (count <= 5) return "bg-green-500/40 text-green-800 dark:text-green-300 border-green-500/50";
    return "bg-green-500/60 text-green-900 dark:text-green-200 border-green-500/70";
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const totalReplies = monthStats?.reduce((sum, stat) => sum + stat.repliesSent, 0) || 0;
  const daysActive = monthStats?.filter(stat => stat.repliesSent > 0).length || 0;
  const avgPerDay = daysActive > 0 ? (totalReplies / daysActive).toFixed(1) : 0;
  const mostActiveDay = monthStats?.reduce((max, stat) =>
    stat.repliesSent > (max?.repliesSent || 0) ? stat : max,
    monthStats[0]
  );

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Create array of all days including leading empty days
  const calendarDays = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null); // Empty cell
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() &&
                         currentMonth.getFullYear() === new Date().getFullYear();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <CalendarIcon className="h-8 w-8 text-purple-500" />
          Reply Calendar
        </h1>
        <p className="text-muted-foreground">
          Monthly overview of your reply activity
        </p>
      </div>

      {/* Month Navigator */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h2 className="text-2xl font-bold">{monthName}</h2>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day names header */}
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const replyCount = getReplyCountForDate(day);
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const today = new Date().toISOString().split('T')[0];
              const isToday = dateStr === today;
              const isFuture = new Date(dateStr) > new Date(today);

              return (
                <Link
                  key={day}
                  href={isFuture ? '#' : `/activity?date=${dateStr}`}
                  className={`
                    aspect-square rounded-lg border-2 p-2 flex flex-col items-center justify-center
                    transition-all hover:scale-105
                    ${isFuture ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                    ${isToday ? 'ring-2 ring-purple-500' : ''}
                    ${getColorForCount(replyCount)}
                  `}
                >
                  <div className="text-lg font-bold">{day}</div>
                  {replyCount > 0 && (
                    <div className="text-xs font-semibold mt-1">
                      {replyCount}r
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted" />
              <span className="text-muted-foreground">0</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/20" />
              <span className="text-muted-foreground">1-2</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/40" />
              <span className="text-muted-foreground">3-5</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/60" />
              <span className="text-muted-foreground">6+</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Stats for {monthName}</CardTitle>
          <CardDescription>Summary of your reply activity this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Replies</p>
              <p className="text-2xl font-bold text-purple-500">{totalReplies}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Days Active</p>
              <p className="text-2xl font-bold text-blue-500">{daysActive}/{daysInMonth}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Average per Day</p>
              <p className="text-2xl font-bold text-green-500">{avgPerDay}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Most Active Day</p>
              <p className="text-2xl font-bold text-orange-500">
                {mostActiveDay ? mostActiveDay.repliesSent : 0}
              </p>
              {mostActiveDay && mostActiveDay.repliesSent > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(mostActiveDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
