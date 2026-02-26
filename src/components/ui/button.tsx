import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success"
    size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"

        // Manual variant classes instead of CVA for simplicity
        const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"

        const variants: Record<string, string> = {
            default: "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]",
            destructive: "bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-[0_4px_14px_0_rgba(220,38,38,0.39)]",
            outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
            secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
            ghost: "hover:bg-slate-100 hover:text-slate-900",
            link: "text-[#2563EB] underline-offset-4 hover:underline",
            success: "bg-[#16A34A] text-white hover:bg-[#15803D] shadow-[0_4px_14px_0_rgba(22,163,74,0.39)]",
        }

        const sizes: Record<string, string> = {
            default: "h-12 px-6 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-14 rounded-xl px-8 text-base",
            icon: "h-10 w-10",
        }

        const variantClass = variants[variant] || variants.default;
        const sizeClass = sizes[size] || sizes.default;

        return (
            <Comp
                className={cn(baseClasses, variantClass, sizeClass, className)}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
