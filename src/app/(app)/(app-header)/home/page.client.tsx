"use client";

import { useQuery } from "convex/react";
import { BookOpen, Plus, Zap } from "lucide-react";
import Link from "next/link";
import { CourseCard } from "#/components/course-card";
import { EmptyState } from "#/components/empty-state";
import { LeaderboardItem } from "#/components/leaderboard-item";
import { Card, CardContent } from "#/components/ui/card";
import { FancyButton } from "#/components/ui/fancy-button";
import { Skeleton } from "#/components/ui/skeleton";
import { api } from "../../../../../convex/_generated/api";

export function HomePageClient() {
  const courses = useQuery(api.course.getCourses);
  const leaderboardData = useQuery(api.leaderboard.getLeaderboard, { limit: 10 });
  const userRank = useQuery(api.leaderboard.getCurrentUserRank);
  const userStreak = useQuery(api.leaderboard.getUserStreak);
  const currentUser = useQuery(api.auth.getCurrentUser);

  const streakDays = userStreak?.streakDays || [];
  
  // Mark current user in leaderboard
  const leaderboard = (leaderboardData || []).map(user => ({
    ...user,
    isCurrentUser: currentUser?._id === user.id
  }));
  
  const currentUserXP = userRank?.xp || 0;

  return (
    <div className="mt-5 space-y-0 bg-white pb-12 px-58">
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-0">
          {courses == null ? (
            <Card className=" border-none shadow-none">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-black" />
                  <span className="font-medium text-black text-sm">
                    Recent Courses
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-xl bg-white p-0">
                      <Skeleton className="mb-3 h-22 w-full rounded-lg" />
                      <Skeleton className="mb-2 h-2 w-3/4" />
                      <Skeleton className="h-2 w-1/2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            courses.length > 0 && (
            <Card className=" border-none shadow-none">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-black" />
                  <span className="font-medium text-black text-sm">
                    Recent Courses
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {courses.slice(0, 3).map((course, index) => (
                    <CourseCard key={course._id} course={course} index={index} />
                  ))}
                </div>
              </CardContent>
            </Card>
            )
          )}
          <Card className="border-none shadow-none">
            <CardContent className="px-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="font-medium text-black text-sm">
                    Your Courses
                  </h2>
                </div>
                <Link href="/learn">
                  <FancyButton
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-black/30 bg-white h-7 px-2 py-2 font-medium text-black transition-all hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-1">
                      <Plus className="h-4 w-4" />
                      Create New
                    </span>
                  </FancyButton>
                </Link>
              </div>
              {courses == null ? (
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="rounded-xl bg-white p-0">
                      <Skeleton className="mb-3 h-22 w-full rounded-lg" />
                      <Skeleton className="mb-2 h-2 w-3/4" />
                      <Skeleton className="h-2 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <EmptyState type="courses" />
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {courses.map((course, index) => (
                    <CourseCard key={course._id} course={course} index={index} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6 pt-20">
          <div className="rounded-lg bg-white p-0">
            <h3 className="mb-4 font-semibold text-black">Learning Streak</h3>
              <div className="flex items-center justify-center gap-4">
                {streakDays.map((day) => (
                  <div key={day.day} className="flex flex-col items-center gap-2">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg font-medium text-sm ${
                        day.isActive
                          ? "border-2 border-orange-400 bg-orange-50 text-black"
                          : "text-black"
                      }`}
                    >
                      {day.label}
                    </div>
                    <Zap
                      size={16}
                      className={
                        day.isActive ? "text-orange-400" : "text-gray-400"
                      }
                    />
                  </div>
                ))}
              </div>
          </div>
          <Card className=" border-none shadow-none pt-3">
            <CardContent className="px-0">
              <div className="mb-4">
                <h3 className="font-semibold text-black text-sm">
                  League Standings
                </h3>
                <p className="text-gray-500 text-xs">
                  Your position in the leaderboard
                </p>
              </div>

              {currentUserXP === 0 ? (
                <EmptyState type="xp" />
              ) : (
                <>
                  <div className="space-y-3">
                    {leaderboard.map((user, index) => (
                      <LeaderboardItem key={user.id} user={user} position={index + 1} />
                    ))}
                  </div>
                  {userRank && userRank.rank > 0 && (
                    <div className="mt-4 border-gray-100 border-t pt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Your rank</span>
                        <span className="font-medium text-blue-600">
                          #{userRank.rank} of {userRank.total}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
