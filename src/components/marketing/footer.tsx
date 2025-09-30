"use client"

import { MotionDiv } from '#/components/motion/animated-div'
import { AnimatedTitle } from '#/components/motion/animated-title'

export function Footer() {
  return (
    <footer className="space-y-4 bg-black mx-55 pb-4 ">
      <MotionDiv
        initial={{ y: '10%', scale: 0.95, opacity: 0 }}
        whileInView={{ y: '0%', scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        viewport={{ once: true }}
        className="relative mx-auto flex h-80 flex-col justify-between overflow-hidden rounded-4xl bg-primary-depth/90 text-background dark:bg-card sm:h-96 lg:h-[26rem]"
      >
        <div className="flex-grow select-none overflow-hidden">
          <AnimatedTitle className="md:absolute md:-bottom-1/4 md:left-0 md:translate-x-0">
            <p className="pr-6 font-display text-[min(37vw,300px)] -tracking-widest dark:text-card-foreground">
              Suma
            </p>
          </AnimatedTitle>
        </div>
      </MotionDiv>
    </footer>
  )
}