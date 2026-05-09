import { LucideIcon } from "lucide-react";

export interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  instanceType: string;
  relationshipType?: string;
  isBrowsableNode?: boolean;
  icon?: LucideIcon;
  imageUrl?: string;
  visible?: boolean;
  washedOut?: boolean;
  bold?: boolean;
}
