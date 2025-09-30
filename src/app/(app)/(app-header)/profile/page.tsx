"use client";

import { useQuery } from "convex/react";
import { BookOpen, GraduationCap, Trophy, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Card, CardContent } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { api } from "../../../../../convex/_generated/api";

export default function ProfilePage() {
  const user = useQuery(api.auth.getCurrentUser);
  const flashcardStats = useQuery(api.flashcard.getUserFlashcardStats);
  const courses = useQuery(api.course.getUserCourses);

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
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                  <BookOpen className="h-6 w-6 text-blue-300" />
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
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
                  <GraduationCap className="h-6 w-6 text-green-300" />
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
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50">
                  <Zap className="h-6 w-6 text-purple-300" />
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
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50">
                  <Trophy className="h-6 w-6 text-orange-300" />
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
    </div>
  );
}