"use client";

import { Key, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "#/components/user-menu";
import { Button } from "./ui/button";

export function AppHeader() {
  const pathname = usePathname();
  
  return (
    <header className="flex w-full items-center justify-between bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-8">
        <div className="flex items-center justify-start">
          <h1 className="flex flex-col justify-center font-medium text-[#2F3037] text-sm leading-5 sm:text-base md:text-lg lg:text-xl font-serif cursor-pointer">
            Golb
          </h1>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/">
            <Button 
              variant="link" 
              size="sm"
              className={pathname === "/home" ? "text-blue-600 font-semibold underline" : "text-gray-600 hover:text-gray-900"}
            >
              Home
            </Button>
          </Link>
          {/* <Link href="/learn">
            <Button 
              variant="link" 
              size="sm"
              className={pathname.startsWith("/learn") ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-gray-900"}
            >
              Learn
            </Button>
          </Link>
*/}
          <Link href="/profile">
            <Button 
              variant="link" 
              size="sm"
              className={pathname.startsWith("/profile") ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-gray-900"}
            >
              Profile
            </Button>
          </Link> 
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            className="flex items-center gap-1 px-3 py-1"
            variant="outline"
          >
            <span className="font-medium text-black">2</span>
            <Key size={14} className="text-yellow-500" />
          </Button>
          <Button
            className="flex items-center gap-1 px-3 py-1"
            variant="outline"
          >
            <span className="font-medium text-black">1</span>
            <Zap size={14} className="text-gray-400" />
          </Button>
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
