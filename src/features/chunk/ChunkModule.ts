import { FileTextIcon } from "lucide-react";
import { createJsonApiInclusion } from "../../core";
import { ModuleFactory } from "../../permissions";
import { Chunk } from "./data/Chunk";

export const ChunkModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/chunks",
    name: "chunks",
    model: Chunk,
    moduleId: "9b1c2f64-7ea3-4df5-8b2a-91b6a8d0e3a4",
    icon: FileTextIcon,
    inclusions: {
      lists: {
        fields: [createJsonApiInclusion<Chunk>("chunks", ["content", "nodeId", "nodeType", "imagePath", "source"])],
      },
    },
  });
