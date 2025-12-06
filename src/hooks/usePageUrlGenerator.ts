import { PageUrl } from "../permissions/types";

export function usePageUrlGenerator(): (params: {
  page?: PageUrl | string;
  id?: string;
  childPage?: PageUrl | string;
  childId?: string;
  additionalParameters?: { [key: string]: string | string[] | undefined };
  language?: string;
}) => string {
  const generateUrl = (params: {
    page?: PageUrl | string;
    id?: string;
    childPage?: PageUrl | string;
    childId?: string;
    additionalParameters?: { [key: string]: string | string[] | undefined };
    language?: string;
  }): string => {
    if (!params.page) return "/";

    const pathParams: string[] = [
      `${params.language ? `/${params.language}` : ""}${typeof params.page === "string" ? params.page : params.page.pageUrl}`,
    ];

    if (params.id) {
      pathParams.push(params.id);
      if (params.childPage) {
        pathParams.push(typeof params.childPage === "string" ? params.childPage : (params.childPage.pageUrl ?? ""));
        if (params.childId) {
          pathParams.push(params.childId);
        }
      }
    }
    const response = pathParams.join(`/`);

    if (params.additionalParameters) {
      const searchParams = new URLSearchParams();
      for (const key in params.additionalParameters) {
        if (params.additionalParameters[key]) {
          searchParams.append(key, params.additionalParameters[key] as string);
        }
      }
      return `${response}?${searchParams.toString()}`;
    }

    return response;
  };

  return generateUrl;
}
