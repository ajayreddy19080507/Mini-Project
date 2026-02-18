import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", isLoading, children, disabled, ...props }, ref) => {
        const variants = {
            primary: "bg-black text-white hover:bg-gray-800 shadow-md hover:shadow-lg border-transparent",
            secondary: "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm",
            outline: "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50",
            ghost: "bg-transparent text-gray-600 hover:bg-gray-100/50 hover:text-gray-900",
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-50 outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
                    variants[variant],
                    className
                )}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button };
