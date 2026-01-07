"use client";

import { formatDistanceToNow } from "date-fns";
import { Key, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../shadcnui";
import { OAuthClientInterface } from "../interfaces/oauth.interface";

export interface OAuthClientCardProps {
  /** The OAuth client to display */
  client: OAuthClientInterface;
  /** Called when card is clicked */
  onClick?: () => void;
  /** Called when edit is clicked */
  onEdit?: () => void;
  /** Called when delete is clicked */
  onDelete?: () => void;
}

/**
 * Card component for displaying an OAuth client in a list
 */
export function OAuthClientCard({
  client,
  onClick,
  onEdit,
  onDelete,
}: OAuthClientCardProps) {
  // Truncate client ID for display
  const truncatedId = client.clientId.length > 12
    ? `${client.clientId.slice(0, 8)}...${client.clientId.slice(-4)}`
    : client.clientId;

  const createdAgo = client.createdAt
    ? formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })
    : "Unknown";

  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-accent/50 ${!client.isActive ? "opacity-60" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{client.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={client.isActive ? "default" : "secondary"}>
              {client.isActive ? "Active" : "Inactive"}
            </Badge>
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                  <Button render={<div />} nativeButton={false} variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onDelete(); }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {client.description && (
          <CardDescription className="line-clamp-2">{client.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="font-mono">{truncatedId}</span>
          <span>Created {createdAgo}</span>
          <span>{client.isConfidential ? "Confidential" : "Public"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
