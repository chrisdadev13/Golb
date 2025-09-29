import { Award, Medal, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";

interface LeaderboardItemProps {
  user: {
    id: number;
    name: string;
    avatar: string;
    score: number;
    isCurrentUser: boolean;
  };
  position: number;
}

export function LeaderboardItem({ user, position }: LeaderboardItemProps) {
  const getRankIcon = (pos: number) => {
    switch (pos) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return (
          <span className="font-medium text-gray-500 text-sm">#{pos}</span>
        );
    }
  };

  return (
    <div
      key={user.id}
      className={`flex items-center gap-3 rounded-lg p-2 ${
        user.isCurrentUser
          ? "border border-green-200 bg-green-50"
          : ""
      }`}
    >
      <div className="flex w-6 flex-shrink-0 items-center justify-center">
        {getRankIcon(position)}
      </div>
      <Avatar className="size-8 rounded-lg border border-gray-300">
        <AvatarImage src={user.avatar} className="bg-white" />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span
            className={`truncate font-medium text-sm ${
              user.isCurrentUser ? "text-black" : "text-black"
            }`}
          >
            {user.name}
          </span>
          <span className="font-medium text-gray-500 text-xs">
            {user.score.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
