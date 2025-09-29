import { Target, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { FancyButton } from "#/components/ui/fancy-button";

interface EmptyStateProps {
  type: "xp" | "courses" | "streak";
}

export function EmptyState({ type }: EmptyStateProps) {
  const getContent = () => {
    switch (type) {
      case "xp":
        return {
          icon: <Trophy className="h-12 w-12 text-gray-400" />,
          title: "Start Your Learning Journey",
          description: "Complete courses and earn XP to climb the leaderboard!",
          actionText: "Create Courses",
          actionHref: "/learn",
        };
      case "courses":
        return {
          icon: <Target className="h-12 w-12 text-gray-400" />,
          title: "No Courses Yet",
          description: "Create your first course to start learning!",
          actionText: "Create Course",
          actionHref: "/learn",
        };
      case "streak":
        return {
          icon: <Zap className="h-12 w-12 text-gray-400" />,
          title: "Build Your Streak",
          description: "Learn daily to build an impressive learning streak!",
          actionText: "Start Learning",
          actionHref: "/learn",
        };
      default:
        return {
          icon: <Trophy className="h-12 w-12 text-gray-400" />,
          title: "Get Started",
          description: "Begin your learning journey today!",
          actionText: "Get Started",
          actionHref: "/learn",
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center border">
      <div className="mb-4">{content.icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {content.title}
      </h3>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">
        {content.description}
      </p>
      <Link href={content.actionHref}>
        <FancyButton>
          {content.actionText}
        </FancyButton>
      </Link>
    </div>
  );
}
