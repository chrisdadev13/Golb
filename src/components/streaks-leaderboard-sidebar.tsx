"use client";

import { useQuery } from "convex/react";
import { Zap } from "lucide-react";
import { EmptyState } from "#/components/empty-state";
import { LeaderboardItem } from "#/components/leaderboard-item";
import { Card, CardContent } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { api } from "../../convex/_generated/api";

export function StreaksLeaderboardSidebar() {
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
    <div className="space-y-6 pt-20">
      {/* Streak Section */}
      <div className="rounded-lg bg-white p-0">
        <h3 className="mb-4 font-semibold text-black">Learning Streak</h3>
        {userStreak === undefined ? (
          <div className="flex items-center justify-center gap-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            ))}
          </div>
        ) : (
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
        )}
      </div>

      {/* Leaderboard Section */}
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

          {leaderboardData === undefined || userRank === undefined ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-6" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="mb-1 h-3 w-24" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : currentUserXP === 0 ? (
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
  );
}
