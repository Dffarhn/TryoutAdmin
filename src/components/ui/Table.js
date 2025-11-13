import { cn } from "@/lib/utils/cn";

export function Table({ children, className }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse", className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }) {
  return (
    <thead className={cn("bg-gray-50", className)}>
      <tr>{children}</tr>
    </thead>
  );
}

export function TableHead({ children, className }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableBody({ children, className }) {
  return <tbody className={cn("bg-white divide-y divide-gray-200", className)}>{children}</tbody>;
}

export function TableRow({ children, className }) {
  return <tr className={cn("hover:bg-gray-50", className)}>{children}</tr>;
}

export function TableCell({ children, className }) {
  return (
    <td className={cn("px-4 py-3 text-sm text-gray-900", className)}>
      {children}
    </td>
  );
}

