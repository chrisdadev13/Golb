"use client";

import { Authenticated, useQuery } from "convex/react";
import { Trophy, Flame } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "#/components/user-menu";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";

export function AppHeader() {
  const pathname = usePathname();

  const userRank = useQuery(api.leaderboard.getCurrentUserRank);
  const userStreak = useQuery(api.leaderboard.getUserStreak);
  
  return (
    <header className="flex w-full items-center justify-between bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-8">
        <div className="flex items-center justify-start">
          <h1 className="flex flex-col justify-center font-medium text-[#2F3037] text-sm leading-5 sm:text-base md:text-lg lg:text-xl font-serif cursor-pointer">
            Suma
          </h1>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/home">
            <Button 
              variant="link" 
              size="sm"
              className={pathname === "/home" ? "text-blue-600 font-semibold underline" : "text-gray-600 hover:text-gray-900"}
            >
              Courses
            </Button>
          </Link>
          <Link href="/flashcards">
            <Button 
              variant="link" 
              size="sm"
              className={pathname.startsWith("/flashcards") ? "text-blue-600 font-semibold underline" : "text-gray-600 hover:text-gray-900"}
            >
              Flashcards
            </Button>
          </Link>
          <Link href="/profile">
            <Button 
              variant="link" 
              size="sm"
              className={pathname.startsWith("/profile") ? "text-blue-600 font-semibold underline" : "text-gray-600 hover:text-gray-900"}
            >
              Profile
            </Button>
          </Link> 
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Authenticated>
          <Button
            className="flex items-center gap-1 px-3 py-1"
            variant="outline"
          >
            <Trophy size={14} className="text-yellow-500" />
            <span className="font-medium text-black">
              {userRank ? `#${userRank.rank}` : "—"}
            </span>
          </Button>
          <Button
            className="flex items-center gap-1 px-3 py-1"
            variant="outline"
          >
            <Flame size={14} className="text-orange-500" />
            <span className="font-medium text-black">
              {userStreak ? userStreak.currentStreak : 0}
            </span>
          </Button>

          </Authenticated>
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
