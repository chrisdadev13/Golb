"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import type { Variants } from "framer-motion";
import Image from "next/image";
import NextLink from "next/link";
import { useState } from "react";
import { MotionDiv } from "#/components/motion/animated-div";
import {
  AnimatedList,
  AnimatedListItem,
} from "#/components/motion/animated-list";
import { AnimatedTitle } from "#/components/motion/animated-title";
import { Button } from "#/components/ui/button";
import { Icons } from "../icons";
import SignInForm from "../sign-in";
import SignUpForm from "../sign-up";
import { FancyButton } from "../ui/fancy-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";


const list = {
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.08,
      delayChildren: 0.5,
    },
  },
  hidden: { opacity: 0 },
} satisfies Variants;

const item = {
  visible: { opacity: 1, transition: { duration: 0.45 } },
  hidden: { opacity: 0 },
} satisfies Variants;

export function Hero() {
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <section className="relative overflow-hidden px-4 pt-32 lg:pt-58">
      <AnimatedTitle className="flex flex-col items-center justify-center">
        <h2 className="flex w-full max-w-[770.71px] flex-col justify-center px-2 text-center font-normal font-serif text-[#37322F] text-[24px] xs:text-[28px] leading-[1.1] sm:px-2 sm:text-[36px] sm:leading-[1.15] md:px-0 md:text-[42px] md:leading-[1.2] lg:w-[788.71px] lg:text-[70px] lg:leading-24">
          The best way to
          <br />
          Learn anything
        </h2>

        <p className="flex w-full max-w-[506.08px] flex-col justify-center px-2 text-center font-medium font-sans text-[rgba(55,50,47,0.80)] text-sm leading-[1.4] sm:px-4 sm:text-lg sm:leading-[1.45] md:px-0 md:text-xl md:leading-[1.5] lg:w-[506.08px] lg:text-lg lg:leading-7">
          Create interactive, effective and fun courses.
          <br className="hidden sm:block" />
          Use AI to master anything in 2 weeks
        </p>
      </AnimatedTitle>
      <div className="mx-auto my-8 min-h-40 max-w-80">
        <Unauthenticated>
          <Dialog>
            <AnimatedList variants={list} className="flex flex-col gap-3">
              <AnimatedListItem variants={item}>
                <DialogTrigger asChild>
                  <FancyButton
                    variant="default"
                    size="lg"
                    className="w-full"
                    onClick={() => setShowSignUp(true)}
                  >
                    <span className="truncate">Get started</span>
                  </FancyButton>
                </DialogTrigger>
              </AnimatedListItem>
              <AnimatedListItem variants={item}>
                <DialogTrigger asChild>
                  <FancyButton
                    size="lg"
                    className="w-full bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] text-outline-foreground"
                    variant="outline"
                    onClick={() => setShowSignUp(false)}
                  >
                    <span className="truncate">I already have an account</span>
                  </FancyButton>
                </DialogTrigger>
              </AnimatedListItem>
            </AnimatedList>
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
        <Authenticated>
          <MotionDiv
            initial="hidden"
            whileInView="visible"
            variants={item}
            transition={{ delay: 0.5 }}
          >
            <Button variant="default" size="lg" className="w-full" asChild>
              <NextLink href="/home" className="truncate">
                Continue Learning
              </NextLink>
            </Button>
          </MotionDiv>
        </Authenticated>
      </div>

      <div className="absolute -right-[2%] top-1/3 -z-1 sm:right-[10%] md:top-2/3">
        <MotionDiv
          initial="hidden"
          whileInView="visible"
          variants={item}
          transition={{ delay: 1.4 }}
        >
          <div className="size-20 rotate-12 rounded-lg bg-gradient-to-bl from-highlight/70  to-transparent p-2 text-background sm:size-24 lg:size-32 opacity-60">
            <Icons.Diagram />
          </div>
        </MotionDiv>
      </div>
      <div className="absolute -left-[8%] top-[13%] -z-1 sm:left-[10%]">
        <MotionDiv
          initial="hidden"
          whileInView="visible"
          variants={item}
          transition={{ delay: 0.8 }}
        >
          <div className="opacity-60">
            <Icons.Rank />
          </div>
        </MotionDiv>
      </div>
      <div className="absolute right-[10%] top-[13%] -z-1">
        <MotionDiv
          initial="hidden"
          whileInView="visible"
          variants={item}
          transition={{ delay: 1 }}
        >
          <div className="size-20 -rotate-12 rounded-lg bg-gradient-to-br from-highlight/70  to-transparent p-2 text-background sm:size-24 lg:size-32 opacity-60">
            <Icons.OkIcon />
          </div>
        </MotionDiv>
      </div>
      <div className="absolute bottom-[10%] left-[10%] -z-1">
        <MotionDiv
          initial="hidden"
          whileInView="visible"
          variants={item}
          transition={{ delay: 1.2 }}
        >
          <div className="size-20 -rotate-12 rounded-lg bg-gradient-to-br from-highlight/70  to-transparent p-2 text-background sm:size-24 lg:size-32 opacity-60">
            <Icons.Rocket />
          </div>
        </MotionDiv>
      </div>
    </section>
  );
}
