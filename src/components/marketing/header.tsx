"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { FancyButton } from "#/components/ui/fancy-button";
import { Skeleton } from "#/components/ui/skeleton";
import UserMenu from "#/components/user-menu";
import SignInForm from "../sign-in";
import SignUpForm from "../sign-up";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

function Logo() {
  return (
    <div className="flex items-center justify-start">
      <h1 className="flex flex-col justify-center font-medium font-sans text-[#2F3037] text-sm leading-5 sm:text-base md:text-lg lg:text-xl">
        Suma
      </h1>
    </div>
  );
}

export function Header() {
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <header className="absolute top-0 left-0 z-20 flex h-12 w-full items-center justify-center px-6 sm:h-14 sm:px-8 md:h-16 md:px-12 lg:h-[84px] lg:px-0">
      <nav className="relative z-30 flex h-10 w-full items-center justify-between overflow-hidden rounded-[50px] bg-transparent px-3 py-1.5 pr-2 backdrop-blur-sm sm:h-11 sm:max-w-[calc(100%-48px)] sm:px-4 sm:py-2 sm:pr-3 md:h-12 md:max-w-[calc(100%-64px)] md:px-4 lg:w-[900px] lg:max-w-[900px]">
        <div className="flex items-center justify-center">
          <Logo />
        </div>
        <div className="flex h-6 items-start justify-start gap-2 sm:h-7 sm:gap-3 md:h-8">
          <Authenticated>
            <div className="flex items-center justify-center gap-2">
              <Link href="/home">
                <Button variant="outline" size="sm">
                  Home
                </Button>
              </Link>
              <UserMenu />
            </div>
          </Authenticated>
          <Unauthenticated>
            <Dialog>
              <DialogTrigger asChild>
                <FancyButton
                  variant="outline"
                  className="flex items-center justify-center overflow-hidden bg-white px-2 py-1 shadow-[0px_1px_2px_rgba(55,50,47,0.12)] sm:px-3 sm:py-[6px] md:px-[14px]"
                >
                  <span className="flex flex-col justify-center font-medium font-sans text-[#37322F] text-xs leading-5 md:text-[13px]">
                    Log in
                  </span>
                </FancyButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader className="flex flex-col items-center justify-center">
                  <DialogTitle>{""}</DialogTitle>
                  <Image
                    src="/flying.png"
                    alt="Lets Go"
                    width={150}
                    height={150}
                  />
                </DialogHeader>
                {showSignUp ? (
                  <SignUpForm onSwitchToSignIn={() => setShowSignUp(false)} />
                ) : (
                  <SignInForm onSwitchToSignUp={() => setShowSignUp(true)} />
                )}
              </DialogContent>
            </Dialog>
          </Unauthenticated>
          <AuthLoading>
            <div className="flex items-center justify-center gap-2">
              <Skeleton className="h-8 w-[64px] rounded-md bg-gray-200" />
              <Skeleton className="h-8 w-8 rounded-md bg-gray-200" />
            </div>
          </AuthLoading>
        </div>
      </nav>
    </header>
  );
}
