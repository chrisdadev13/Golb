import { Loader, Play, X } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import type { Doc } from "../../convex/_generated/dataModel";

interface CourseCardProps {
  course: Doc<"courses">;
  index: number;
}

export function CourseCard({ course, index }: CourseCardProps) {
  return (
    <Link key={course._id} href={`/course/${course._id}`}>
      <div className="cursor-pointer rounded-lg border bg-white transition-all hover:shadow-md relative">
        {/* New badge for the most recent course */}
        {index === 0 && (
          <div className="absolute -top-3 -right-1 z-10">
            <Badge variant="outline" className="bg-white">
              New
            </Badge>
          </div>
        )}
        <div
          className={`relative w-full h-10 rounded-t-lg ${
            course.status === "ready"
              ? "bg-gray-100"
              : course.status === "generating"
                ? "bg-yellow-100"
                : "bg-red-100"
          }`}
        >
          <div className="absolute top-2 left-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                course.status === "ready"
                  ? "bg-transparent"
                  : course.status === "generating"
                    ? "bg-yellow-600"
                    : "bg-red-600"
              }`}
            >
              {course.status === "ready" ? (
                <div className="flex px-2 py-1 w-12 cursor-pointer items-center justify-center rounded-lg border-[#333] border-b-4 bg-[#4C4C4C] hover:bg-[#5C5C5C] active:border-b-0">
                  <Play className="h-2 w-2 text-white" fill="#fff" />
                </div>
              ) : course.status === "generating" ? (
                <Loader className="w-4 h-4 text-white animate-spin" />
              ) : (
                <X className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
            {course.title}
          </h3>
          <div className="flex items-center justify-between">
            <Avatar className="size-4 rounded-full border border-gray-300">
              <AvatarImage
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${course.userId}`}
                className="bg-white"
              />
              <AvatarFallback className="text-xs">
                {course.title.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs text-gray-500">
              {new Date(course._creationTime).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
