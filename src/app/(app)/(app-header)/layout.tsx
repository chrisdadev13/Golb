import { AppHeader } from "#/components/app-header";

export default function AppHeaderLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <AppHeader />
            {children}
        </div>
    )
}