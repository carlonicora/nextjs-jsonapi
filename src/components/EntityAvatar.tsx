import { getInitials } from "../utils/getInitials";
import { Avatar, AvatarFallback, AvatarImage } from "../shadcnui";

type EntityAvatarProps = {
  image?: string;
  name: string;
  className?: string;
  fallbackClassName?: string;
};

export function EntityAvatar({
  image,
  name,
  className = "h-24 w-24",
  fallbackClassName = "text-2xl",
}: EntityAvatarProps) {
  return (
    <Avatar className={`${className} ${fallbackClassName}`}>
      {image ? <AvatarImage src={image} alt={name} /> : null}
      <AvatarFallback className={fallbackClassName}>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
