"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTryout } from "@/hooks/useTryouts";
import { useCategory } from "@/hooks/useCategories";
import { usePackage } from "@/hooks/usePackages";
import { useSubChapter } from "@/hooks/useSubChapters";

const routeLabels = {
  dashboard: "Dashboard",
  tryouts: "Tryouts",
  categories: "Kategori",
  packages: "Paket",
  new: "Baru",
  edit: "Edit",
  questions: "Soal",
  "sub-chapters": "Sub-Bab",
  assign: "Tugaskan",
};

// Helper function to check if string is UUID
function isUUID(str) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Helper function to get valid route for a segment
function getValidRoute(segments, index) {
  const segment = segments[index];
  const isLast = index === segments.length - 1;
  
  if (isLast) {
    return null; // Last segment is current page, no link
  }

  // Build path up to this segment
  let path = "/admin";
  for (let i = 0; i <= index; i++) {
    path += `/${segments[i]}`;
  }

  // Special handling for routes that don't exist
  if (segment === "sub-chapters") {
    // sub-chapters route doesn't exist, link to tryout edit instead
    const tryoutIndex = segments.findIndex((s) => s === "tryouts");
    if (tryoutIndex >= 0 && tryoutIndex + 1 < segments.length) {
      const tryoutId = segments[tryoutIndex + 1];
      return `/admin/tryouts/${tryoutId}/edit`;
    }
    return null;
  }

  // For UUID segments, determine the correct route
  if (isUUID(segment)) {
    const prevSegment = index > 0 ? segments[index - 1] : null;
    
    if (prevSegment === "tryouts") {
      // Tryout ID - link to edit page
      return `/admin/tryouts/${segment}/edit`;
    } else if (prevSegment === "sub-chapters") {
      // Sub-chapter ID - link to tryout edit page (no detail page exists)
      const tryoutIndex = segments.findIndex((s) => s === "tryouts");
      if (tryoutIndex >= 0 && tryoutIndex + 1 < segments.length) {
        const tryoutId = segments[tryoutIndex + 1];
        return `/admin/tryouts/${tryoutId}/edit`;
      }
      return null;
    } else if (prevSegment === "categories") {
      // Category ID - link to edit page
      return `/admin/categories/${segment}/edit`;
    } else if (prevSegment === "packages") {
      // Package ID - check if next segment is "edit", if not link to detail page
      const nextSegment = index < segments.length - 1 ? segments[index + 1] : null;
      if (nextSegment === "edit") {
        // Already on edit page, link to detail
        return `/admin/packages/${segment}`;
      } else {
        // On detail page or other, link to detail page
        return `/admin/packages/${segment}`;
      }
    } else if (prevSegment === "questions") {
      // Question ID - link to edit page
      const tryoutIndex = segments.findIndex((s) => s === "tryouts");
      if (tryoutIndex >= 0 && tryoutIndex + 1 < segments.length) {
        const tryoutId = segments[tryoutIndex + 1];
        return `/admin/tryouts/${tryoutId}/questions/${segment}/edit`;
      }
      return null;
    }
  }

  // For regular segments, check if route exists
  // Most routes exist, so return the path
  return path;
}

// Component untuk breadcrumb item yang perlu fetch data (UUID)
function BreadcrumbItemWithData({ segment, index, segments }) {
  const isLast = index === segments.length - 1;
  const prevSegment = index > 0 ? segments[index - 1] : null;

  // Determine resource type based on previous segment
  let resourceType = null;
  let resourceId = segment;
  let tryoutId = null;

  if (prevSegment === "tryouts") {
    resourceType = "tryout";
  } else if (prevSegment === "categories") {
    resourceType = "category";
  } else if (prevSegment === "packages") {
    resourceType = "package";
  } else if (prevSegment === "sub-chapters") {
    // For sub-chapters, we need tryoutId from earlier in the path
    const tryoutIndex = segments.findIndex((s) => s === "tryouts");
    if (tryoutIndex >= 0 && tryoutIndex + 1 < segments.length) {
      tryoutId = segments[tryoutIndex + 1];
      resourceType = "sub-chapter";
    }
  } else if (prevSegment === "questions") {
    // Question ID - we might need this in the future
    resourceType = "question";
  }

  // Fetch data based on resource type
  const { data: tryout, isLoading: tryoutLoading } = useTryout(
    resourceType === "tryout" ? resourceId : null
  );
  const { data: category, isLoading: categoryLoading } = useCategory(
    resourceType === "category" ? resourceId : null
  );
  const { data: pkg, isLoading: packageLoading } = usePackage(
    resourceType === "package" ? resourceId : null
  );
  const { data: subChapter, isLoading: subChapterLoading } = useSubChapter(
    tryoutId,
    resourceType === "sub-chapter" ? resourceId : null
  );

  const isLoading =
    tryoutLoading || categoryLoading || packageLoading || subChapterLoading;

  let label = segment;
  if (resourceType === "tryout" && tryout) {
    label = tryout.title;
  } else if (resourceType === "category" && category) {
    label = category.name;
  } else if (resourceType === "package" && pkg) {
    label = pkg.name;
  } else if (resourceType === "sub-chapter" && subChapter) {
    label = subChapter.categoryName || subChapter.name || "Sub-Bab";
  } else if (isLoading) {
    label = "Memuat...";
  } else if (routeLabels[segment]) {
    label = routeLabels[segment];
  } else {
    label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const href = getValidRoute(segments, index);

  return (
    <div className="flex items-center gap-2">
      <ChevronRight className="w-4 h-4 text-gray-400" />
      {isLast ? (
        <span className={cn("font-medium", "text-gray-900")}>{label}</span>
      ) : href ? (
        <Link
          href={href}
          className={cn(
            "hover:text-gray-900 transition-colors",
            "flex items-center gap-1.5"
          )}
        >
          {label}
        </Link>
      ) : (
        <span className={cn("text-gray-600")}>{label}</span>
      )}
    </div>
  );
}

// Component untuk breadcrumb item regular (bukan UUID)
function BreadcrumbItem({ segment, index, segments }) {
  const isLast = index === segments.length - 1;
  const label =
    routeLabels[segment] ||
    segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const href = getValidRoute(segments, index);

  return (
    <div className="flex items-center gap-2">
      <ChevronRight className="w-4 h-4 text-gray-400" />
      {isLast ? (
        <span className={cn("font-medium", "text-gray-900")}>{label}</span>
      ) : href ? (
        <Link
          href={href}
          className={cn(
            "hover:text-gray-900 transition-colors",
            "flex items-center gap-1.5"
          )}
        >
          {label}
        </Link>
      ) : (
        <span className={cn("text-gray-600")}>{label}</span>
      )}
    </div>
  );
}

export function Breadcrumb() {
  const pathname = usePathname();

  if (!pathname || pathname === "/admin/dashboard") {
    return null;
  }

  // Parse pathname into segments
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .slice(1); // Remove 'admin' from start

  if (segments.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6 flex-wrap">
      <div className="flex items-center gap-2">
        <Home className="w-4 h-4" />
        <Link
          href="/admin/dashboard"
          className={cn(
            "hover:text-gray-900 transition-colors",
            "flex items-center gap-1.5"
          )}
        >
          Dashboard
        </Link>
      </div>
      {segments.map((segment, index) => {
        if (isUUID(segment)) {
          return (
            <BreadcrumbItemWithData
              key={`${segment}-${index}`}
              segment={segment}
              index={index}
              segments={segments}
            />
          );
        } else {
          return (
            <BreadcrumbItem
              key={`${segment}-${index}`}
              segment={segment}
              index={index}
              segments={segments}
            />
          );
        }
      })}
    </nav>
  );
}
