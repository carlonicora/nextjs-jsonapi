import { getInitials } from "../utils/getInitials";
import { Avatar, AvatarFallback, AvatarImage } from "../shadcnui";

type TableCellAvatarProps = {
  image?: string;
  name: string;
};

export function TableCellAvatar({ image, name }: TableCellAvatarProps) {
  return (
    <Avatar className="mr-2 h-10 w-10 shrink-0">
      {image ? <AvatarImage src={image} alt={name} /> : null}
      <AvatarFallback className="text-xs">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
