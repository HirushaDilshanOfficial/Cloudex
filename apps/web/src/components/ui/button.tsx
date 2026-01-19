import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', isLoading, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95";

        const variants = {
            primary: "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25 focus:ring-primary",
            secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
            outline: "border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 focus:ring-gray-200",
            ghost: "hover:bg-gray-100 text-gray-700 hover:text-gray-900 focus:ring-gray-200",
            destructive: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/25 focus:ring-red-600",
        };

        const sizes = {
            sm: "h-9 px-3 text-xs",
            md: "h-11 px-4 py-2 text-sm",
            lg: "h-14 px-8 text-base",
            icon: "h-10 w-10",
        };

        const variantStyles = variants[variant];
        const sizeStyles = sizes[size];

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
                disabled={isLoading || disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
