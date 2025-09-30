"use client";

import { useMutation, useQuery } from "convex/react";
import { BookOpen, GraduationCap, Trophy, Zap, Bell, Mail, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Card, CardContent } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { Switch } from "#/components/ui/switch";
import { Label } from "#/components/ui/label";
import { api } from "../../../../../convex/_generated/api";

export default function ProfilePage() {
  const user = useQuery(api.auth.getCurrentUser);
  const flashcardStats = useQuery(api.flashcard.getUserFlashcardStats);
  const courses = useQuery(api.course.getUserCourses);
  const settings = useQuery(api.userSettings.getUserSettings);
  const updateSettings = useMutation(api.userSettings.updateUserSettings);

  if (!user) {
    return (
      <div className="mt-10 space-y-6">
        <Card className="border-none shadow-none">
          <CardContent className="px-6 py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Skeleton className="h-32 w-32 rounded-sm" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  // Calculate stats
  const totalCourses = courses?.length || 0;
  const completedCourses = courses?.filter(c => c.progress?.isCompleted).length || 0;
  const totalFlashcards = flashcardStats?.totalCards || 0;
  const accuracy = flashcardStats?.accuracy || 0;

  return (
    <div className="mt-10 space-y-0">
      {/* Profile Header */}
      <Card className="border-none shadow-none">
        <CardContent className="px-6 py-0">
          <div className="flex flex-col items-center space-y-6">
            <Avatar className="h-32 w-32 rounded-sm border-4 border-gray-200">
              <AvatarImage 
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user._id}`}
                className="bg-white"
                alt={user.name || "User"} 
              />
              <AvatarFallback className="text-3xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="text-center space-y-1">
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card className="border-none shadow-none">
        <CardContent className="px-6 py-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Total Courses */}
            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                  <BookOpen className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totalCourses}</div>
                  <div className="text-sm text-gray-600">Total Courses</div>
                </div>
              </div>
            </div>

            {/* Completed Courses */}
            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                  <GraduationCap className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{completedCourses}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>
            </div>

            {/* Flashcards Studied */}
            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                  <Zap className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totalFlashcards}</div>
                  <div className="text-sm text-gray-600">Cards Studied</div>
                </div>
              </div>
            </div>

            {/* Accuracy */}
            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                  <Trophy className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{accuracy}%</div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="border-none shadow-none mt-6">
        <CardContent className="px-6 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
          
          <div className="space-y-6">
            {/* Course Ready Notification */}
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Bell className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="course-notify" className="text-sm font-medium text-gray-900">
                    Course Ready Notifications
                  </Label>
                  <p className="text-sm text-gray-500">
                    Get notified when your course generation is complete
                  </p>
                </div>
              </div>
              <Switch
                id="course-notify"
                checked={settings?.notifyWhenCourseIsReady ?? true}
                onCheckedChange={(checked) => {
                  updateSettings({
                    notifyWhenCourseIsReady: checked,
                    notifyWhenFlashcardSetIsReady: settings?.notifyWhenFlashcardSetIsReady ?? true,
                    sendDailyProblems: settings?.sendDailyProblems ?? true,
                  });
                }}
              />
            </div>

            {/* Flashcard Ready Notification */}
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Mail className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="flashcard-notify" className="text-sm font-medium text-gray-900">
                    Flashcard Ready Notifications
                  </Label>
                  <p className="text-sm text-gray-500">
                    Get notified when your flashcard set is ready to study
                  </p>
                </div>
              </div>
              <Switch
                id="flashcard-notify"
                checked={settings?.notifyWhenFlashcardSetIsReady ?? true}
                onCheckedChange={(checked) => {
                  updateSettings({
                    notifyWhenCourseIsReady: settings?.notifyWhenCourseIsReady ?? true,
                    notifyWhenFlashcardSetIsReady: checked,
                    sendDailyProblems: settings?.sendDailyProblems ?? true,
                  });
                }}
              />
            </div>

            {/* Daily Problems */}
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Calendar className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="daily-problems" className="text-sm font-medium text-gray-900">
                    Daily Problems
                  </Label>
                  <p className="text-sm text-gray-500">
                    Receive daily practice problems to keep learning
                  </p>
                </div>
              </div>
              <Switch
                id="daily-problems"
                checked={settings?.sendDailyProblems ?? true}
                onCheckedChange={(checked) => {
                  updateSettings({
                    notifyWhenCourseIsReady: settings?.notifyWhenCourseIsReady ?? true,
                    notifyWhenFlashcardSetIsReady: settings?.notifyWhenFlashcardSetIsReady ?? true,
                    sendDailyProblems: checked,
                  });
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}