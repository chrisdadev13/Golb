"use client";

import { BookOpen, Plus, Zap } from "lucide-react";
import Link from "next/link";
import { CourseCard } from "#/components/course-card";
import { EmptyState } from "#/components/empty-state";
import { LeaderboardItem } from "#/components/leaderboard-item";
import { Card, CardContent } from "#/components/ui/card";
import { FancyButton } from "#/components/ui/fancy-button";

export default function HomePage() {
  const courses = [
    {
      _id: "1",
      title: "Advanced React Patterns",
      description:
        "Master advanced React patterns including hooks, context, and performance optimization techniques.",
      status: "ready",
      _creationTime: new Date().toISOString(),
    },
    {
      _id: "2",
      title: "Machine Learning Fundamentals",
      description:
        "Learn the basics of machine learning, from linear regression to neural networks.",
      status: "generating",
      _creationTime: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      _id: "3",
      title: "Data Structures & Algorithms",
      description:
        "Comprehensive guide to data structures and algorithms for technical interviews.",
      status: "ready",
      _creationTime: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      _id: "4",
      title: "System Design Principles",
      description:
        "Learn how to design scalable systems and distributed architectures.",
      status: "failed",
      _creationTime: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      _id: "5",
      title: "Python for Data Science",
      description:
        "Complete Python course covering pandas, numpy, matplotlib, and scikit-learn.",
      status: "ready",
      _creationTime: new Date(Date.now() - 345600000).toISOString(),
    },
  ];

  const sortedCourses = [...courses].sort((a, b) => {
    const statusPriority = { ready: 0, generating: 1, failed: 2 };
    const statusDiff =
      statusPriority[a.status as keyof typeof statusPriority] -
      statusPriority[b.status as keyof typeof statusPriority];
    if (statusDiff !== 0) return statusDiff;
    return (
      new Date(b._creationTime).getTime() - new Date(a._creationTime).getTime()
    );
  });

  const streakDays = [
    { label: "T", day: "Tuesday", isActive: true },
    { label: "W", day: "Wednesday", isActive: false },
    { label: "Th", day: "Thursday", isActive: false },
    { label: "F", day: "Friday", isActive: false },
    { label: "S", day: "Saturday", isActive: false },
  ];

  const leaderboard = [
    {
      id: 1,
      name: "Alex Chen",
      avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=alex",
      score: 2450,
      isCurrentUser: false,
    },
    {
      id: 2,
      name: "Sarah Kim",
      avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=sarah",
      score: 2380,
      isCurrentUser: false,
    },
    {
      id: 3,
      name: "Moksh",
      avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=moksh",
      score: 0, // Changed to 0 to demonstrate empty state
      isCurrentUser: true,
    },
    {
      id: 4,
      name: "David Park",
      avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=david",
      score: 1980,
      isCurrentUser: false,
    },
    {
      id: 5,
      name: "Emma Wilson",
      avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=emma",
      score: 1820,
      isCurrentUser: false,
    },
  ];

  // Find current user's XP
  const currentUser = leaderboard.find(user => user.isCurrentUser);
  const currentUserXP = currentUser?.score || 0;

  return (
    <div className="mt-5 space-y-0 bg-white pb-12 px-58">
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-0">
          {sortedCourses.length > 0 && (
            <Card className=" border-none shadow-none">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-black" />
                  <span className="font-medium text-black text-sm">
                    Recent Courses
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {sortedCourses.slice(0, 3).map((course, index) => (
                    <CourseCard key={course._id} course={course} index={index} />
                  ))}
                </div>
              </CardContent>
            </Card>
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
              {sortedCourses.length === 0 ? (
                <EmptyState type="courses" />
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {sortedCourses.map((course, index) => (
                    <CourseCard key={course._id} course={course} index={index} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 pt-20">
          {/* Learning Streak */}
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

          {/* League Standings */}
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
                  <div className="mt-4 border-gray-100 border-t pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Your rank</span>
                      <span className="font-medium text-blue-600">#3 of 5</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
