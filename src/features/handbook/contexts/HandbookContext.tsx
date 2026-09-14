"use client";

import { useTranslations } from "next-intl";
import { createContext, ReactNode, useContext } from "react";
import { SharedProvider } from "../../../contexts";
import { Modules } from "../../../core";
import { usePageUrlGenerator } from "../../../hooks";
import { BreadcrumbItemData } from "../../../interfaces";
import type { HandbookPageInterface, HandbookSectionInterface } from "../data";
import { handbookPageTitle, handbookSectionTitle } from "../data/handbookDisplay";

/**
 * The handbook's page context.
 *
 * The reader's header was an empty bar with a book icon in it: the feature
 * shipped no provider, and `RoundPageContainerTitle` reads its heading from
 * `useSharedContext().title`
 * (components/containers/RoundPageContainerTitle.tsx). With nothing supplying
 * that context there was no title, no breadcrumb and no way back — so the page
 * title was printed a second time inside the body instead.
 *
 * This is the provider every other feature already has, copied from
 * `RoleProvider` (features/role/contexts/RoleContext.tsx): a `breadcrumb()`, a
 * `title()`, and `SharedProvider` wrapping the feature's own context. Every
 * handbook surface — contents, reader, ask — mounts it, so all three get the
 * same header for free.
 */

interface HandbookContextType {
  page: HandbookPageInterface | undefined;
  section: HandbookSectionInterface | undefined;
}

const HandbookContext = createContext<HandbookContextType | undefined>(undefined);

type HandbookProviderProps = {
  children: ReactNode;
  /** Undefined on the contents and ask surfaces. */
  page?: HandbookPageInterface;
  /** The page's section, when one is loaded and resolvable. */
  section?: HandbookSectionInterface;
  /** Rendered into `title.functions`. */
  functions?: ReactNode;
  /** Overrides the default `title.type`. Used by the ask surface. */
  titleType?: string;
};

export const HandbookProvider = ({ children, page, section, functions, titleType }: HandbookProviderProps) => {
  const generateUrl = usePageUrlGenerator();
  const t = useTranslations();

  const breadcrumb = () => {
    const response: BreadcrumbItemData[] = [];

    response.push({
      name: t(`handbook.title`),
      href: generateUrl({ page: Modules.HandbookPage }),
    });

    if (page)
      response.push({
        name: handbookPageTitle(page),
        href: generateUrl({ page: Modules.HandbookPage, id: page.id }),
      });

    return response;
  };

  const title = () => {
    const response: any = {
      // The reader is titled by where the page sits, not by the manual it
      // belongs to: the section is the `type` and the page is the `element`,
      // the same split every entity detail page in the product uses. Sections
      // are loaded as their own resource, so a page whose section has not
      // resolved falls back to the raw key it carries — and the key is the
      // directory name, which is not translated and never was.
      type: titleType ?? (page ? (section ? handbookSectionTitle(section) : page.section) : t(`handbook.title`)),
    };

    if (page) {
      response.element = handbookPageTitle(page);
    }

    if (functions) response.functions = functions;

    return response;
  };

  return (
    <SharedProvider value={{ breadcrumbs: breadcrumb(), title: title() }}>
      <HandbookContext.Provider
        value={{
          page: page,
          section: section,
        }}
      >
        {children}
      </HandbookContext.Provider>
    </SharedProvider>
  );
};

export const useHandbookContext = (): HandbookContextType => {
  const context = useContext(HandbookContext);
  if (context === undefined) {
    throw new Error("useHandbookContext must be used within a HandbookProvider");
  }
  return context;
};
