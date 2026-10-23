"use client";

import { BlogListColumn } from "./BlogListColumn";
import { BlogListFeatured } from "./BlogListFeatured";
import type { BlogListProps } from "./BlogListParts";
import { BlogListRail } from "./BlogListRail";

/** Public blog list in the layout an administrator picked (BlogSettings.listLayout). */
export function BlogList(props: BlogListProps) {
  switch (props.layout) {
    case "column":
      return <BlogListColumn {...props} />;
    case "rail":
      return <BlogListRail {...props} />;
    case "featured":
    default:
      return <BlogListFeatured {...props} />;
  }
}

export type { BlogListProps };
