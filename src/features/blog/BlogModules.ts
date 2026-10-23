import { NewspaperIcon } from "lucide-react";
import { ModuleFactory } from "../../permissions";
import { BlogCategory } from "./data/BlogCategory";
import { BlogCategoryTranslation } from "./data/BlogCategoryTranslation";
import { BlogPost } from "./data/BlogPost";
import { BlogPostTranslation } from "./data/BlogPostTranslation";
import { BlogSettings } from "./data/BlogSettings";
import { BLOG_MODULE_ID } from "./types/blog.constants";

export const BlogPostModule = (factory: ModuleFactory) =>
  factory({
    moduleId: BLOG_MODULE_ID,
    pageUrl: "/administration/blog",
    name: "blog-posts",
    model: BlogPost,
    icon: NewspaperIcon,
  });

export const BlogPostTranslationModule = (factory: ModuleFactory) =>
  factory({
    moduleId: BLOG_MODULE_ID,
    name: "blog-post-translations",
    model: BlogPostTranslation,
    icon: NewspaperIcon,
  });

export const BlogCategoryModule = (factory: ModuleFactory) =>
  factory({
    moduleId: BLOG_MODULE_ID,
    name: "blog-categories",
    model: BlogCategory,
    icon: NewspaperIcon,
  });

export const BlogCategoryTranslationModule = (factory: ModuleFactory) =>
  factory({
    moduleId: BLOG_MODULE_ID,
    name: "blog-category-translations",
    model: BlogCategoryTranslation,
    icon: NewspaperIcon,
  });

export const BlogSettingsModule = (factory: ModuleFactory) =>
  factory({
    moduleId: BLOG_MODULE_ID,
    name: "blog-settings",
    model: BlogSettings,
    icon: NewspaperIcon,
  });
