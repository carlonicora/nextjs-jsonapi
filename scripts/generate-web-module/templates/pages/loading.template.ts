/**
 * Loading Template
 *
 * Generates the loading.tsx that sits next to every generated page.tsx that
 * awaits data. Under Cache Components each data-fetching route segment owns its
 * own Suspense boundary; a boundary in a parent segment does nothing for a
 * client navigation between siblings.
 *
 * Content matches the app convention verbatim (PageSkeleton from the app's
 * common skeletons).
 */

/**
 * Generate the loading file content
 *
 * @returns Generated file content
 */
export function generateLoadingTemplate(): string {
  return `import { PageSkeleton } from "@/features/common/components/skeletons/PageSkeleton";

export default function Loading() {
  return <PageSkeleton />;
}
`;
}
