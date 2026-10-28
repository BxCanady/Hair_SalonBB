import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "default" | "sm";
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-pink-600 text-white hover:bg-pink-700",
  secondary: "border border-pink-600 bg-white text-pink-600 hover:bg-pink-50",
  ghost: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  danger: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
};

const sizes = {
  default: "px-5 py-2.5",
  sm: "px-3 py-1.5 text-sm",
};

export default function Button({
  children,
  variant = "primary",
  size = "default",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-md font-medium transition-all duration-300 [transition-timing-function:cubic-bezier(0.175,0.885,0.32,1.275)] active:-translate-y-1 active:scale-x-90 active:scale-y-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
