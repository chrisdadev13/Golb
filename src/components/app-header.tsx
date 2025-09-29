import { Key, Zap } from "lucide-react";
import UserMenu from "#/components/user-menu";
import { Button } from "./ui/button";

export function AppHeader() {
    return (
        <header className="flex w-full items-center justify-between bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-8">
                <div className="flex items-center justify-start">
                    <h1 className="flex flex-col justify-center font-medium text-[#2F3037] text-sm leading-5 sm:text-base md:text-lg lg:text-xl font-serif">
                        Golb
                    </h1>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <Button className="flex items-center gap-1 px-3 py-1" variant="outline">
                        <span className="font-medium text-black">2</span>
                        <Key size={14} className="text-yellow-500" />
                    </Button>
                    <Button className="flex items-center gap-1 px-3 py-1" variant="outline">
                        <span className="font-medium text-black">1</span>
                        <Zap size={14} className="text-gray-400" />
                    </Button>
                </div>
                <UserMenu />
            </div>
        </header>
    );
}