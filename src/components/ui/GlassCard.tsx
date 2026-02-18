import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = true }: GlassCardProps) {
    return (
        <div
            className={cn(
                "glass-card p-6 transition-all duration-300 ease-out",
                hoverEffect && "hover:shadow-2xl hover:-translate-y-1 hover:bg-white/80",
                className
            )}
        >
            {children}
        </div>
    );
}
