"use client";

import { Plus, Key } from "lucide-react";
import { Button, Skeleton } from "../../../shadcnui";
import { OAuthClientCard } from "./OAuthClientCard";
import { OAuthClientInterface } from "../interfaces/oauth.interface";

export interface OAuthClientListProps {
  /** List of OAuth clients */
  clients: OAuthClientInterface[];
  /** Whether list is loading */
  isLoading?: boolean;
  /** Error to display */
  error?: Error | null;
  /** Called when a client is clicked */
  onClientClick?: (client: OAuthClientInterface) => void;
  /** Called when create button is clicked */
  onCreateClick?: () => void;
  /** Called when edit is clicked on a client */
  onEditClick?: (client: OAuthClientInterface) => void;
  /** Called when delete is clicked on a client */
  onDeleteClick?: (client: OAuthClientInterface) => void;
  /** Message to show when list is empty */
  emptyStateMessage?: string;
  /** Title for the list */
  title?: string;
}

/**
 * Component for displaying a list of OAuth clients
 */
export function OAuthClientList({
  clients,
  isLoading = false,
  error,
  onClientClick,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  emptyStateMessage = "No OAuth applications yet. Create one to get started.",
  title = "OAuth Applications",
}: OAuthClientListProps) {
  // Loading state
  if (isLoading && clients.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title}</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">{error.message}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (clients.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title}</h2>
          {onCreateClick && (
            <Button onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              New App
            </Button>
          )}
        </div>
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No OAuth Applications</h3>
          <p className="text-muted-foreground mb-4">{emptyStateMessage}</p>
          {onCreateClick && (
            <Button onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Create Application
            </Button>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        {onCreateClick && (
          <Button onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            New App
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {clients.map((client) => (
          <OAuthClientCard
            key={client.id || client.clientId}
            client={client}
            onClick={() => onClientClick?.(client)}
            onEdit={onEditClick ? () => onEditClick(client) : undefined}
            onDelete={onDeleteClick ? () => onDeleteClick(client) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
