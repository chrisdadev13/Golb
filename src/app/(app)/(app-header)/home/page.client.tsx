"use client";

import { useQuery } from "convex/react";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { CourseCard } from "#/components/course-card";
import { EmptyState } from "#/components/empty-state";
import { Card, CardContent } from "#/components/ui/card";
import { FancyButton } from "#/components/ui/fancy-button";
import { Skeleton } from "#/components/ui/skeleton";
import { api } from "../../../../../convex/_generated/api";

export function HomePageClient() {
  const courses = useQuery(api.course.getCourses);

  return (
    <>
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
    </>
  );
}
