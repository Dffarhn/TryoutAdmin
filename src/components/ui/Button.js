import { cn } from "@/lib/utils/cn";

export function Button({
  children,
  variant = "primary",
  className,
  disabled,
  type = "button",
  ...props
}) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
    secondary: "bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:bg-blue-100",
    danger: "bg-red-50 text-red-700 hover:bg-red-100 disabled:bg-red-100",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "px-3 py-2.5 rounded-lg font-semibold text-sm transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

