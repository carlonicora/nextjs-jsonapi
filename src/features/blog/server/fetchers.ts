import { EndpointCreator, Modules } from "../../../core";
import { ServerJsonApiGet } from "../../../server/JsonApiServer";
import { BlogCategoryInterface } from "../data/BlogCategoryInterface";
import { BlogPostInterface } from "../data/BlogPostInterface";
import { BlogSettingsInterface } from "../data/BlogSettingsInterface";
import { BLOG_ACTION, BLOG_LIST_LAYOUTS, BLOG_PUBLIC_PREFIX, BlogListLayout } from "../types/blog.constants";
import { PublicBlogCategory, PublicBlogList, PublicBlogPost } from "../types/blog-public.types";
import { toPublicBlogCategory, toPublicBlogPost } from "./toPublic";

// Public, token-free reads for the marketing blog pages.
//
// `cache: "minutes"` is a cacheLife profile name: the GET goes through
// cachedServerGet ("use cache"), so an admin change shows up within about a
// minute. Nothing connects API or worker writes to the web cache, and
// translations finish asynchronously in the worker, so there is no tag to expire.
//
// Each classKey is built INSIDE the function, never at module scope: reading
// Modules.X while the module evaluates throws "Module X not registered" in build
// workers that never ran the app's bootstrapper (see the app's publicHowTo.ts).

const BLOG_PAGE_SIZE = 12;

const publicPostsEndpoint = () => `${BLOG_PUBLIC_PREFIX}/${Modules.BlogPost.name}`;

const asArray = <T>(data: unknown): T[] => (Array.isArray(data) ? data : data ? [data] : []) as T[];

export async function fetchPublicBlogPosts(params: {
  language: string;
  categorySlug?: string;
  search?: string;
  page: number;
}): Promise<PublicBlogList> {
  // Matches the API cap (120 = 10 pages of 12); a larger ?page= is served as the last allowed one.
  const page = Math.min(10, Math.max(1, Math.floor(params.page || 1)));
  const size = BLOG_PAGE_SIZE * page;

  const endpoint = new EndpointCreator({ endpoint: publicPostsEndpoint() });
  endpoint.addAdditionalParam("language", params.language);
  if (params.categorySlug) endpoint.addAdditionalParam("category", encodeURIComponent(params.categorySlug));
  if (params.search) endpoint.addAdditionalParam("search", encodeURIComponent(params.search));
  endpoint.addAdditionalParam("page[size]", String(size));

  const res = await ServerJsonApiGet({
    classKey: { ...Modules.BlogPost, cache: "minutes" },
    endpoint: endpoint.generate(),
    language: params.language,
  });
  if (!res.ok) return { posts: [], hasMore: false };

  const posts = asArray<BlogPostInterface>(res.data).map(toPublicBlogPost);
  const total = Number(res.meta?.total);
  const hasMore = Number.isFinite(total) ? total > posts.length : false;

  return { posts, hasMore };
}

export async function fetchPublicBlogPost(params: { language: string; slug: string }): Promise<PublicBlogPost | null> {
  const endpoint = new EndpointCreator({ endpoint: publicPostsEndpoint(), id: encodeURIComponent(params.slug) });
  endpoint.addAdditionalParam("language", params.language);

  const res = await ServerJsonApiGet({
    classKey: { ...Modules.BlogPost, cache: "minutes" },
    endpoint: endpoint.generate(),
    language: params.language,
  });
  if (!res.ok) return null;

  const post = asArray<BlogPostInterface>(res.data)[0];
  return post ? toPublicBlogPost(post) : null;
}

export async function fetchRelatedBlogPosts(params: { language: string; slug: string }): Promise<PublicBlogPost[]> {
  const endpoint = new EndpointCreator({
    endpoint: publicPostsEndpoint(),
    id: encodeURIComponent(params.slug),
    childEndpoint: BLOG_ACTION.related,
  });
  endpoint.addAdditionalParam("language", params.language);

  const res = await ServerJsonApiGet({
    classKey: { ...Modules.BlogPost, cache: "minutes" },
    endpoint: endpoint.generate(),
    language: params.language,
  });
  if (!res.ok) return [];

  return asArray<BlogPostInterface>(res.data).map(toPublicBlogPost);
}

export async function fetchPublicBlogCategories(params: { language: string }): Promise<PublicBlogCategory[]> {
  const endpoint = new EndpointCreator({ endpoint: `${BLOG_PUBLIC_PREFIX}/${Modules.BlogCategory.name}` });
  endpoint.addAdditionalParam("language", params.language);

  const res = await ServerJsonApiGet({
    classKey: { ...Modules.BlogCategory, cache: "minutes" },
    endpoint: endpoint.generate(),
    language: params.language,
  });
  if (!res.ok) return [];

  return asArray<BlogCategoryInterface>(res.data).map(toPublicBlogCategory);
}

export async function fetchBlogSettings(): Promise<{ listLayout: BlogListLayout }> {
  const fallback: { listLayout: BlogListLayout } = { listLayout: "featured" };

  // The settings are language-neutral; the language only fills the required
  // request header, so one fixed value keeps a single cache entry.
  const res = await ServerJsonApiGet({
    classKey: { ...Modules.BlogSettings, cache: "minutes" },
    endpoint: new EndpointCreator({ endpoint: `${BLOG_PUBLIC_PREFIX}/${Modules.BlogSettings.name}` }).generate(),
    language: "en",
  });
  if (!res.ok) return fallback;

  const settings = asArray<BlogSettingsInterface>(res.data)[0];
  if (!settings || !BLOG_LIST_LAYOUTS.includes(settings.listLayout)) return fallback;

  return { listLayout: settings.listLayout };
}
