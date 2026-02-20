import { cn } from "@/lib/utils";
import { ReactNode, HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = true, ...props }: GlassCardProps) {
    return (
        <div
            {...props}
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
