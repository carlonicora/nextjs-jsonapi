import { cn } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../shadcnui";
import { getInitials } from "../utils/getInitials";

type TableCellAvatarProps = {
  image?: string;
  name: string;
  className?: string;
};

export function TableCellAvatar({ image, name, className }: TableCellAvatarProps) {
  return (
    <Avatar className={cn("mr-2 h-10 w-10 shrink-0", className)}>
      {image ? <AvatarImage src={image} alt={name} /> : null}
      <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
