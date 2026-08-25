export type PhysicalSide = "top" | "bottom" | "left" | "right";
export type LogicalSide = PhysicalSide | "start" | "end";

export function resolvePhysicalSide(side: LogicalSide, dir: "ltr" | "rtl"): PhysicalSide {
  if (side === "start") return dir === "rtl" ? "right" : "left";
  if (side === "end") return dir === "rtl" ? "left" : "right";
  return side;
}
