import { D3Node } from "./d3.node.interface";

export interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
  relationshipType?: string;
}
