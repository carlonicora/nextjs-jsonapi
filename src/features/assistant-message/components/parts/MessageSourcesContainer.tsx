"use client";

import { useEffect, useMemo, useState } from "react";
import { ClientAbstractService, ClientHttpMethod, EndpointCreator, ModuleRegistry } from "../../../../core";
import type { ApiDataInterface, ApiRequestDataTypeInterface } from "../../../../core";
import type { AssistantMessageInterface } from "../../data/AssistantMessageInterface";
import { MessageSourcesPanel } from "./MessageSourcesPanel";

interface Props {
  message: AssistantMessageInterface;
  isLatestAssistant: boolean;
  onSelectFollowUp: (q: string) => void;
}

class SourcesFetcher extends ClientAbstractService {
  static async findManyByIds(params: {
    module: ApiRequestDataTypeInterface;
    idsParam: string;
    ids: string[];
  }): Promise<ApiDataInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: params.module });
    endpoint.addAdditionalParam(params.idsParam, params.ids.join(","));
    if (params.module.inclusions?.lists?.fields) endpoint.limitToFields(params.module.inclusions.lists.fields);
    if (params.module.inclusions?.lists?.types) endpoint.limitToType(params.module.inclusions.lists.types);
    return this.callApi<ApiDataInterface[]>({
      type: params.module,
      method: ClientHttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }
}

/**
 * Library-level data wrapper around `MessageSourcesPanel`. Reads
 * `chunk.nodeId` / `chunk.nodeType` from the message's citations, dynamically
 * resolves the matching module via `ModuleRegistry.findByModelName(nodeType)`,
 * fetches the entities in one request per type, and supplies them (plus their
 * deduplicated `author` users) to the presentational panel.
 */
export function MessageSourcesContainer({ message, isLatestAssistant, onSelectFollowUp }: Props) {
  // Group nodeIds per nodeType so we issue one request per source type.
  const groups = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const chunk of message.citations) {
      if (!chunk.nodeType || !chunk.nodeId) continue;
      let bucket = map.get(chunk.nodeType);
      if (!bucket) {
        bucket = new Set<string>();
        map.set(chunk.nodeType, bucket);
      }
      bucket.add(chunk.nodeId);
    }
    return map;
  }, [message.citations]);

  // Flatten to a deterministic key so useEffect re-runs when ids change.
  const groupsKey = useMemo(() => {
    const parts: string[] = [];
    for (const [nodeType, ids] of groups) {
      parts.push(`${nodeType}:${Array.from(ids).sort().join(",")}`);
    }
    return parts.sort().join("|");
  }, [groups]);

  const [resolved, setResolved] = useState<ApiDataInterface[]>([]);

  useEffect(() => {
    if (groups.size === 0) {
      setResolved([]);
      return;
    }
    let cancelled = false;
    const requests: Promise<ApiDataInterface[]>[] = [];
    for (const [nodeType, idSet] of groups) {
      let module: ApiRequestDataTypeInterface | undefined;
      try {
        module = ModuleRegistry.findByModelName(nodeType);
      } catch {
        continue; // No registered module for this nodeType — skip silently.
      }
      const idsParam = `${(module as any).nodeName ?? module.name.replace(/s$/, "")}Ids`;
      requests.push(
        SourcesFetcher.findManyByIds({
          module,
          idsParam,
          ids: Array.from(idSet),
        }).catch((error) => {
          console.error(`Failed to load sources for ${nodeType}:`, error);
          return [] as ApiDataInterface[];
        }),
      );
    }
    Promise.all(requests).then((results) => {
      if (cancelled) return;
      setResolved(results.flat());
    });
    return () => {
      cancelled = true;
    };
  }, [groupsKey, groups]);

  const sources = useMemo(() => {
    const map = new Map<string, ApiDataInterface>();
    for (const entity of resolved) map.set(entity.id, entity);
    return map;
  }, [resolved]);

  const users = useMemo(() => {
    const userMap = new Map<string, ApiDataInterface>();
    for (const entity of resolved) {
      // Content.author getter throws when missing; tolerate either shape.
      const author =
        (entity as any)._author ??
        (() => {
          try {
            return (entity as any).author;
          } catch {
            return undefined;
          }
        })();
      if (author?.id) userMap.set(author.id, author);
    }
    return Array.from(userMap.values());
  }, [resolved]);

  return (
    <MessageSourcesPanel
      message={message}
      isLatestAssistant={isLatestAssistant}
      onSelectFollowUp={onSelectFollowUp}
      sources={sources}
      users={users}
    />
  );
}
