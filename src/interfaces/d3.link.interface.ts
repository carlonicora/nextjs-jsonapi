import type { SimulationLinkDatum } from "d3";
import { D3Node } from "./d3.node.interface";

export interface D3Link extends SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
  relationshipType?: string;
}
