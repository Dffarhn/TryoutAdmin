import { cn } from "@/lib/utils/cn";

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn("px-6 py-4 border-b border-gray-200", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h2 className={cn("text-xl font-bold text-gray-900", className)}>
      {children}
    </h2>
  );
}

export function CardDescription({ children, className }) {
  return (
    <p className={cn("text-sm text-gray-600 mt-1", className)}>{children}</p>
  );
}

export function CardContent({ children, className }) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

