"use client";

import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import { Link } from "../../../../shadcnui";
import { ContentInterface } from "../../../content";
import { UserInterface } from "../../data";
import { UserAvatar } from "../widgets";

type ContributorsListProps = {
  content: ContentInterface;
};

export function ContributorsList({ content }: ContributorsListProps) {
  const generateUrl = usePageUrlGenerator();

  return (
    <div className="flex flex-row items-center">
      <Link
        key={content.author.id}
        href={generateUrl({ page: Modules.User, id: content.author.id })}
        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
      >
        <UserAvatar user={content.author} className="mr-1 h-6 w-6" />
      </Link>
      <div className="flex flex-row-reverse justify-end -space-x-1 space-x-reverse">
        {content.editors
          .filter((editor: UserInterface) => editor.id !== content.author.id)
          .map((editor: UserInterface) => (
            <Link
              key={editor.id}
              href={generateUrl({ page: Modules.User, id: editor.id })}
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
            >
              <UserAvatar user={editor} className="h-5 w-5" />
            </Link>
          ))}
      </div>
    </div>
  );
}
