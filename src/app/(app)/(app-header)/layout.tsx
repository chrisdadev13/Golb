import { AppHeader } from "#/components/app-header";
import { StreaksLeaderboardSidebar } from "#/components/streaks-leaderboard-sidebar";

export default function AppHeaderLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <AppHeader />
            <div className="mt-5 space-y-0 bg-white pb-12 px-58">
                <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2 space-y-0">
                        {children}
                    </div>
                    <StreaksLeaderboardSidebar />
                </div>
            </div>
        </div>
    )
}