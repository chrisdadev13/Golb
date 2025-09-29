"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { authClient } from "#/lib/auth-client";
import { Skeleton } from "./ui/skeleton";

export default function UserMenu() {
  const router = useRouter();

  const { data: session, isPending } = authClient.useSession();

  const user = session?.user;

  if (isPending) {
    return <Skeleton className="w-8 h-8 rounded-sm border border-gray-300" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="rounded-sm border border-gray-300">
          <AvatarImage
            src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user?.id}`}
            className="bg-white"
          />
          <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <div className="flex items-center gap-3 p-2">
          <Avatar className="size-10 rounded-sm border bg-accent">
            <AvatarImage
              src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user?.id}`}
            />
            <AvatarFallback>
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{user?.name || "User"}</span>
            <span className="w-32 truncate text-muted-foreground text-xs">
              {user?.email || ""}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center justify-between gap-2"
          onClick={() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push("/");
                },
              },
            });
          }}
        >
          Sign Out <LogOut />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
