"use client";

import * as d3 from "d3";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { D3Link, D3Node } from "../interfaces";
import { computeLayeredLayout, type LayeredRankDir } from "./computeLayeredLayout";

/**
 * Custom hook for D3 graph visualization with larger circles and more interactive features
 */
export function useCustomD3Graph(
  nodes: D3Node[],
  links: D3Link[],
  onNodeClick: (nodeId: string) => void,
  visibleNodeIds?: Set<string>,
  options?: {
    directed?: boolean;
    layout?: "radial" | "layered";
    layered?: {
      rankdir?: LayeredRankDir;
      nodesep?: number;
      ranksep?: number;
    };
  },
  loadingNodeIds?: Set<string>,
  containerKey?: string | number,
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomRef = useRef<d3.ZoomTransform | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const nodePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const prevContainerKeyRef = useRef<string | number | undefined>(containerKey);

  const zoomToNode = useCallback(
    (nodeId: string, childIds: string[] = []) => {
      if (!svgRef.current || !zoomBehaviorRef.current) return;

      const svg = d3.select(svgRef.current);
      const zoom = zoomBehaviorRef.current;

      const targetNode = nodes.find((n) => n.id === nodeId);
      const childNodes = nodes.filter((n) => childIds.includes(n.id));

      if (!targetNode) return;

      const positions: { x: number; y: number }[] = [];

      if (
        targetNode.fx !== undefined &&
        targetNode.fy !== undefined &&
        targetNode.fx !== null &&
        targetNode.fy !== null
      ) {
        positions.push({ x: targetNode.fx, y: targetNode.fy });
      } else if (
        targetNode.x !== undefined &&
        targetNode.y !== undefined &&
        targetNode.x !== null &&
        targetNode.y !== null
      ) {
        positions.push({ x: targetNode.x, y: targetNode.y });
      }

      childNodes.forEach((child) => {
        if (child.fx !== undefined && child.fy !== undefined && child.fx !== null && child.fy !== null) {
          positions.push({ x: child.fx, y: child.fy });
        } else if (child.x !== undefined && child.y !== undefined && child.x !== null && child.y !== null) {
          positions.push({ x: child.x, y: child.y });
        }
      });

      if (positions.length === 0) return;

      const bounds = {
        xMin: Math.min(...positions.map((p) => p.x)),
        xMax: Math.max(...positions.map((p) => p.x)),
        yMin: Math.min(...positions.map((p) => p.y)),
        yMax: Math.max(...positions.map((p) => p.y)),
      };

      const padding = 150;
      bounds.xMin -= padding;
      bounds.xMax += padding;
      bounds.yMin -= padding;
      bounds.yMax += padding;

      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;

      const contentWidth = bounds.xMax - bounds.xMin;
      const contentHeight = bounds.yMax - bounds.yMin;

      const scaleX = width / contentWidth;
      const scaleY = height / contentHeight;

      let scale = Math.min(scaleX, scaleY);

      scale = Math.min(Math.max(scale, 0.2), 1.5);

      const centerX = (bounds.xMin + bounds.xMax) / 2;
      const centerY = (bounds.yMin + bounds.yMax) / 2;

      const translateX = width / 2 - centerX * scale;
      const translateY = height / 2 - centerY * scale;

      svg
        .transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
    },
    [nodes],
  );

  const colorScale = useMemo(() => {
    const accentColor = "var(--accent)";

    // Define unified color for all content types
    const contentColor = "hsl(30, 80%, 55%)"; // Orange for all content

    const groupTypes = new Set<string>();
    nodes.forEach((node) => {
      groupTypes.add(node.instanceType);
    });

    const typeColorMap = new Map<string, string>();

    Array.from(groupTypes).forEach((type, index) => {
      if (type === nodes[0]?.instanceType) {
        // Root node
        typeColorMap.set(type, accentColor);
      } else if (type === "documents" || type === "articles" || type === "hyperlinks") {
        // All content types get the same orange color
        typeColorMap.set(type, contentColor);
      } else {
        // Topics, Expertises, etc. - use golden angle
        const hueShift = (index * 137.508) % 360;
        typeColorMap.set(type, `hsl(${hueShift}, 32%, 52%)`);
      }
    });

    return typeColorMap;
  }, [nodes]);

  const washOutColor = useCallback((color: string): string => {
    // Parse HSL color and make it lighter and more desaturated
    const hslMatch = color.match(/hsl\((\d+\.?\d*),\s*(\d+\.?\d*)%,\s*(\d+\.?\d*)%\)/);
    if (hslMatch) {
      const hue = parseFloat(hslMatch[1]);

      // Reduce saturation to 15% and increase lightness to 80%
      return `hsl(${hue}, 15%, 80%)`;
    }

    // For var(--accent), return a lighter version
    if (color.includes("var(--accent)")) {
      return "hsl(0, 0%, 80%)"; // Light gray for washed out accent
    }

    // Fallback
    return "hsl(0, 0%, 80%)";
  }, []);

  const getNodeColor = useCallback(
    (node: D3Node) => {
      if (node.color) {
        return node.washedOut ? washOutColor(node.color) : node.color;
      }
      const baseColor = colorScale.get(node.instanceType) || "gray";
      if (node.washedOut) {
        return washOutColor(baseColor);
      }
      return baseColor;
    },
    [colorScale, washOutColor],
  );

  useEffect(() => {
    if (!nodes.length || !svgRef.current) return;

    const visibleNodes = visibleNodeIds
      ? nodes.filter((node) => visibleNodeIds.has(node.id))
      : nodes.filter((node) => node.visible !== false);

    const visibleNodeIdSet = new Set(visibleNodes.map((node) => node.id));
    const visibleLinks = links.filter((link) => {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      return visibleNodeIdSet.has(sourceId) && visibleNodeIdSet.has(targetId);
    });

    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    svg.selectAll("*").remove();

    const container = svgRef.current?.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr("width", width).attr("height", height).attr("viewBox", `0 0 ${width} ${height}`);

    const graphGroup = svg.append("g").attr("class", "graph-content");

    const nodeRadius = 40;
    const directed = options?.directed === true;

    if (directed) {
      const defs = svg.append("defs");
      defs
        .append("marker")
        .attr("id", "narr8-arrow")
        .attr("viewBox", "-10 -10 20 20")
        .attr("markerWidth", 14)
        .attr("markerHeight", 14)
        .attr("markerUnits", "userSpaceOnUse")
        .attr("orient", "auto")
        .attr("refX", 0)
        .attr("refY", 0)
        .append("path")
        .attr("d", "M-10,-10 L0,0 L-10,10 z")
        .attr("fill", "#999");
    }

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        const transform = event.transform;
        graphGroup.attr("transform", transform.toString());
        zoomRef.current = transform;
      });

    zoomBehaviorRef.current = zoom;

    svg
      .call(zoom as any)
      .on("wheel.zoom", null)
      .on("dblclick.zoom", null);

    const layoutMode = options?.layout ?? "radial";
    let layeredPositionsApplied = false;

    if (layoutMode === "layered") {
      const layeredOpts = options?.layered ?? {};
      const positions = computeLayeredLayout(visibleNodes, visibleLinks, {
        rankdir: layeredOpts.rankdir ?? "LR",
        nodesep: layeredOpts.nodesep,
        ranksep: layeredOpts.ranksep,
        minNodeWidth: nodeRadius * 2,
        minNodeHeight: nodeRadius * 2,
      });

      if (positions) {
        visibleNodes.forEach((node) => {
          const saved = nodePositionsRef.current.get(node.id);
          if (saved) {
            node.fx = saved.x;
            node.fy = saved.y;
            node.x = saved.x;
            node.y = saved.y;
            return;
          }
          const pos = positions.get(node.id);
          if (pos) {
            node.fx = pos.x;
            node.fy = pos.y;
            node.x = pos.x;
            node.y = pos.y;
            nodePositionsRef.current.set(node.id, { x: pos.x, y: pos.y });
          }
        });
        // d3.forceLink normally mutates link.source/link.target from string
        // IDs to D3Node references when the simulation initializes. The
        // layered branch skips the simulation, so we resolve those refs
        // ourselves — otherwise the downstream link rendering reads
        // `(d.source as D3Node).x` against a string and draws every line
        // at (0,0)→(0,0).
        const nodeById = new Map<string, D3Node>();
        visibleNodes.forEach((n) => nodeById.set(n.id, n));
        visibleLinks.forEach((link) => {
          if (typeof link.source === "string") {
            const src = nodeById.get(link.source);
            if (src) link.source = src;
          }
          if (typeof link.target === "string") {
            const tgt = nodeById.get(link.target);
            if (tgt) link.target = tgt;
          }
        });
        layeredPositionsApplied = true;
      } else {
        console.warn("[useCustomD3Graph] Layered layout failed; falling back to radial.");
      }
    }

    let simulation: d3.Simulation<D3Node, D3Link> | null = null;

    if (!layeredPositionsApplied) {
      const childDistanceFromRoot = Math.min(width, height) * 0.4;
      const grandchildDistanceFromChild = nodeRadius * 10;

      const centralNodeId = nodes[0].id;

      const nodeHierarchy = new Map<
        string,
        {
          depth: number;
          parent: string | null;
          children: string[];
          angle?: number;
          x?: number;
          y?: number;
        }
      >();

      nodeHierarchy.set(centralNodeId, {
        depth: 0,
        parent: null,
        children: [],
      });

      visibleLinks.forEach((link) => {
        const sourceId = typeof link.source === "string" ? link.source : link.source.id;
        const targetId = typeof link.target === "string" ? link.target : link.target.id;

        if (sourceId === centralNodeId) {
          nodeHierarchy.set(targetId, { depth: 1, parent: centralNodeId, children: [] });
          const rootNode = nodeHierarchy.get(centralNodeId);
          if (rootNode) {
            rootNode.children.push(targetId);
          }
        }
      });

      visibleLinks.forEach((link) => {
        const sourceId = typeof link.source === "string" ? link.source : link.source.id;
        const targetId = typeof link.target === "string" ? link.target : link.target.id;

        const sourceNode = nodeHierarchy.get(sourceId);
        if (sourceNode && sourceNode.depth === 1 && !nodeHierarchy.has(targetId)) {
          nodeHierarchy.set(targetId, { depth: 2, parent: sourceId, children: [] });
          sourceNode.children.push(targetId);
        }
      });

      const rootChildren = nodeHierarchy.get(centralNodeId)?.children || [];

      const childAngleStep = (2 * Math.PI) / Math.max(rootChildren.length, 1);

      rootChildren.forEach((childId, index) => {
        const childNode = nodeHierarchy.get(childId);
        if (childNode) {
          const angle = index * childAngleStep;
          childNode.angle = angle;
          childNode.x = width / 2 + childDistanceFromRoot * Math.cos(angle);
          childNode.y = height / 2 + childDistanceFromRoot * Math.sin(angle);
        }
      });

      for (const [_nodeId, node] of nodeHierarchy.entries()) {
        if (node.depth === 1 && node.angle !== undefined && node.x !== undefined && node.y !== undefined) {
          const childAngle = node.angle;
          const childX = node.x;
          const childY = node.y;
          const grandchildren = node.children;

          if (grandchildren.length === 0) continue;

          const dirX = childX - width / 2;
          const dirY = childY - height / 2;
          const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);

          const normDirX = dirX / dirLength;
          const normDirY = dirY / dirLength;

          if (grandchildren.length === 1) {
            const grandchildId = grandchildren[0];
            const grandchildNode = nodeHierarchy.get(grandchildId);
            if (grandchildNode) {
              grandchildNode.x = childX + normDirX * grandchildDistanceFromChild;
              grandchildNode.y = childY + normDirY * grandchildDistanceFromChild;
              grandchildNode.angle = childAngle;
            }
          } else {
            // Multiple grandchildren - arrange in semicircular arc
            const numChildren = grandchildren.length;

            // Dynamic arc span: scale from 60° (2 children) to 180° (7+ children)
            const minArc = Math.PI / 3; // 60 degrees
            const maxArc = Math.PI; // 180 degrees
            const arcProgress = Math.min(1, (numChildren - 2) / 5);
            const arcSpan = minArc + arcProgress * (maxArc - minArc);

            // Calculate starting angle (center the arc around the radial direction)
            const startAngle = childAngle - arcSpan / 2;

            grandchildren.forEach((grandchildId, index) => {
              const grandchildNode = nodeHierarchy.get(grandchildId);
              if (!grandchildNode) return;

              // Calculate angle for this child
              const angleOffset = numChildren > 1 ? (index / (numChildren - 1)) * arcSpan : 0;
              const angle = startAngle + angleOffset;

              // Position at constant radius from parent
              grandchildNode.x = childX + grandchildDistanceFromChild * Math.cos(angle);
              grandchildNode.y = childY + grandchildDistanceFromChild * Math.sin(angle);
              grandchildNode.angle = angle;
            });
          }
        }
      }

      visibleNodes.forEach((node) => {
        const savedPosition = nodePositionsRef.current.get(node.id);

        if (savedPosition) {
          node.fx = savedPosition.x;
          node.fy = savedPosition.y;
        } else {
          const hierarchyNode = nodeHierarchy.get(node.id);
          if (hierarchyNode && hierarchyNode.x !== undefined && hierarchyNode.y !== undefined) {
            node.fx = hierarchyNode.x;
            node.fy = hierarchyNode.y;
            // Save the calculated position so it persists across re-renders
            nodePositionsRef.current.set(node.id, { x: hierarchyNode.x, y: hierarchyNode.y });
          } else if (node.id === centralNodeId) {
            node.fx = width / 2;
            node.fy = height / 2;
            // Save the center position
            nodePositionsRef.current.set(node.id, { x: width / 2, y: height / 2 });
          }
        }
      });

      simulation = d3
        .forceSimulation<D3Node>(visibleNodes)
        .force(
          "link",
          d3
            .forceLink<D3Node, D3Link>(visibleLinks)
            .id((d) => d.id)
            .distance(nodeRadius * 3)
            .strength(0.1),
        )
        .force("charge", d3.forceManyBody().strength(-500).distanceMax(300))
        .force("collision", d3.forceCollide().radius(nodeRadius * 1.2))
        .force("center", d3.forceCenter(width / 2, height / 2).strength(0.1));

      simulation.stop();
      for (let i = 0; i < 100; i++) {
        simulation.tick();
      }

      visibleNodes.forEach((node) => {
        if (node.fx === undefined) {
          node.fx = node.x;
          node.fy = node.y;
        }
      });
    } // end if (!layeredPositionsApplied)

    // When directed, stop the line at the target node boundary so the
    // arrowhead tip sits just outside the circle rather than inside it.
    const linkX2 = (sx: number, sy: number, tx: number, ty: number): number => {
      if (!directed) return tx;
      const dx = tx - sx;
      const dy = ty - sy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      return tx - (dx / dist) * nodeRadius;
    };
    const linkY2 = (sx: number, sy: number, tx: number, ty: number): number => {
      if (!directed) return ty;
      const dx = tx - sx;
      const dy = ty - sy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      return ty - (dy / dist) * nodeRadius;
    };

    const link = graphGroup
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(visibleLinks)
      .join("line")
      .attr("x1", (d) => (d.source as D3Node).x || 0)
      .attr("y1", (d) => (d.source as D3Node).y || 0)
      .attr("x2", (d) => {
        const s = d.source as D3Node;
        const t = d.target as D3Node;
        return linkX2(s.x || 0, s.y || 0, t.x || 0, t.y || 0);
      })
      .attr("y2", (d) => {
        const s = d.source as D3Node;
        const t = d.target as D3Node;
        return linkY2(s.x || 0, s.y || 0, t.x || 0, t.y || 0);
      })
      .attr("stroke-width", 1.5)
      .attr("marker-end", directed ? "url(#narr8-arrow)" : null);

    const node = graphGroup
      .append("g")
      .selectAll("g")
      .data(visibleNodes)
      .join("g")
      .attr("class", "node-group")
      .attr("data-id", (d) => d.id)
      .attr("cursor", "pointer")
      .attr("transform", (d) => `translate(${d.x || 0}, ${d.y || 0})`)
      .call(
        d3
          .drag<SVGGElement, D3Node>()
          .subject(function (d) {
            return d;
          })
          .on("start", function (event, d) {
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", function (event, d) {
            d.fx = event.x;
            d.fy = event.y;

            d3.select(this).attr("transform", `translate(${event.x}, ${event.y})`);

            d3.select(this).attr("transform", `translate(${event.x}, ${event.y})`);

            nodePositionsRef.current.set(d.id, { x: event.x, y: event.y });

            link
              .attr("x1", (l) => {
                const source = l.source as D3Node;
                return source.fx || source.x || 0;
              })
              .attr("y1", (l) => {
                const source = l.source as D3Node;
                return source.fy || source.y || 0;
              })
              .attr("x2", (l) => {
                const source = l.source as D3Node;
                const target = l.target as D3Node;
                const sx = source.fx || source.x || 0;
                const sy = source.fy || source.y || 0;
                const tx = target.fx || target.x || 0;
                const ty = target.fy || target.y || 0;
                return linkX2(sx, sy, tx, ty);
              })
              .attr("y2", (l) => {
                const source = l.source as D3Node;
                const target = l.target as D3Node;
                const sx = source.fx || source.x || 0;
                const sy = source.fy || source.y || 0;
                const tx = target.fx || target.x || 0;
                const ty = target.fy || target.y || 0;
                return linkY2(sx, sy, tx, ty);
              });
          })
          .on("end", function (event, d) {
            d.fx = event.x;
            d.fy = event.y;
          }) as any,
      )
      .on("mouseenter", function (_event, d) {
        // Skip hover effect for root node
        if (d.instanceType === "root") return;

        const currentNode = d3.select(this);

        // Bring node to front
        currentNode.raise();

        // Get current zoom scale for counter-scaling text
        const currentZoom = zoomRef.current?.k || 1;
        const targetScreenFontSize = 20; // Target font size in screen pixels
        const baseFontSize = 12; // Base font size in graph coordinates

        // Calculate smooth scale factor for transform
        const textScale = targetScreenFontSize / (baseFontSize * currentZoom);

        // Calculate text position offset - circle stays in graph coords, only gap is counter-scaled
        const hoverTextOffset = nodeRadius * 1.4 + 5 / currentZoom;

        // Scale up the circle with smooth transition (unchanged)
        currentNode
          .select("circle")
          .transition()
          .duration(250)
          .ease(d3.easeExpOut)
          .attr("r", nodeRadius * 1.4)
          .attr("filter", "drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.3))");

        // Scale up the text with smooth transform scaling around its anchor point
        currentNode
          .select("text")
          .transition()
          .duration(250)
          .ease(d3.easeExpOut)
          .attr("dy", -hoverTextOffset)
          .attr("transform", `translate(0, ${-hoverTextOffset}) scale(${textScale}) translate(0, ${hoverTextOffset})`);
      })
      .on("mouseleave", function (_event, d) {
        // Skip hover effect for root node
        if (d.instanceType === "root") return;

        const currentNode = d3.select(this);

        // Return circle to normal size
        currentNode
          .select("circle")
          .transition()
          .duration(250)
          .ease(d3.easeExpOut)
          .attr("r", nodeRadius)
          .attr("filter", null);

        // Return text to normal size with smooth transform. Two-line labels
        // (when `d.subtitle` is set) sit one line-gap higher than the single
        // line case — restoring to the bare `nodeRadius + 5` offset would
        // shift the title down by that gap (visibly jumping after the first
        // hover). The 16 here matches the `lineGap` used when the two-line
        // text is first rendered (see the `d.subtitle` branch below).
        const normalOffset = nodeRadius + 5 + (d.subtitle ? 16 : 0);
        currentNode
          .select("text")
          .transition()
          .duration(250)
          .ease(d3.easeExpOut)
          .attr("dy", -normalOffset)
          .attr("transform", `translate(0, ${-normalOffset}) scale(1) translate(0, ${normalOffset})`);
      });

    node
      .append("circle")
      .attr("r", nodeRadius)
      .attr("fill", (d) => getNodeColor(d))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .on("click", (event, d) => {
        event.preventDefault();
        event.stopPropagation();
        if (zoomBehaviorRef.current) {
          svg.on(".zoom", null);
          setTimeout(() => {
            if (zoomBehaviorRef.current) {
              svg
                .call(zoomBehaviorRef.current as any)
                .on("wheel.zoom", null)
                .on("dblclick.zoom", null);
            }
          }, 100);
        }
        onNodeClick(d.id);
      });

    node.each(function (d: D3Node) {
      if (d.imageUrl) {
        // Clipped image inside the circle — replaces the icon when the
        // entity has artwork. Uses a per-node clipPath so the image
        // matches the circle exactly.
        const clipId = `clip-${d.id}`;
        const defs = d3.select(this).append("defs");
        defs.append("clipPath").attr("id", clipId).append("circle").attr("r", nodeRadius);

        d3.select(this)
          .append("image")
          .attr("href", d.imageUrl)
          .attr("x", -nodeRadius)
          .attr("y", -nodeRadius)
          .attr("width", nodeRadius * 2)
          .attr("height", nodeRadius * 2)
          .attr("preserveAspectRatio", "xMidYMid slice")
          .attr("clip-path", `url(#${clipId})`)
          .style("pointer-events", "all")
          .on("click", (event) => {
            event.stopPropagation();
            onNodeClick(d.id);
          });
      } else if (d.icon) {
        const Icon = d.icon as React.FC<{ size: number; color: string }>;
        const iconSvg = renderToStaticMarkup(<Icon size={nodeRadius / 2} color="white" />);

        const _iconGroup = d3
          .select(this)
          .append("g")
          .html(iconSvg)
          .attr("transform", `translate(${-nodeRadius / 4}, ${-nodeRadius / 4})`)
          .style("pointer-events", "all")
          .on("click", (event) => {
            event.stopPropagation();
            onNodeClick(d.id);
          });
      }
    });

    // Add loading spinner for nodes that are fetching children
    node.each(function (d: D3Node) {
      if (loadingNodeIds && loadingNodeIds.has(d.id)) {
        // Remove existing icon
        d3.select(this).selectAll("g").remove();

        // Add spinner
        const spinnerSvg = renderToStaticMarkup(<Loader2 size={nodeRadius / 2} color="white" />);

        d3.select(this)
          .append("g")
          .html(spinnerSvg)
          .attr("class", "animate-spin")
          .attr("transform", `translate(${-nodeRadius / 4}, ${-nodeRadius / 4})`)
          .style("pointer-events", "none");
      }
    });

    node.each(function (d: D3Node) {
      const textElement = d3
        .select(this)
        .append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("pointer-events", "none");

      if (d.instanceType === "root") {
        // Split text by spaces for multi-line display
        const words = d.name.split(" ");
        const lineHeight = 1.2; // em units
        const numLines = words.length;
        // Calculate starting position to center the text block vertically
        // Account for the fact that we want the middle of the entire text block at y=0
        const startY = -((numLines - 1) * lineHeight) / 2;

        textElement.attr("fill", "var(--accent-foreground)").attr("dominant-baseline", "middle");

        words.forEach((word, index) => {
          textElement
            .append("tspan")
            .attr("x", 0)
            .attr("dy", index === 0 ? `${startY}em` : `${lineHeight}em`)
            .text(word);
        });
      } else if (d.subtitle) {
        // Two-line label: name (bigger, bolder) on line 1, subtitle
        // (smaller, dimmed) on line 2. Used by the scene graph to show
        // the HAPPENS_AT location name beneath the scene title. The
        // whole text block is lifted above the circle so the lower line
        // sits at the same baseline the single-line case uses.
        const titleSize = 16;
        const subtitleSize = 11;
        const lineGap = titleSize; // px between baselines
        textElement.attr("dy", -nodeRadius - 5 - lineGap).attr("fill", "currentColor");
        textElement.append("tspan").attr("x", 0).attr("font-size", titleSize).attr("font-weight", 700).text(d.name);
        textElement
          .append("tspan")
          .attr("x", 0)
          .attr("dy", lineGap)
          .attr("font-size", subtitleSize)
          .attr("fill-opacity", 0.7)
          .text(d.subtitle);
      } else {
        // Non-root nodes: single line text above the circle. The
        // optional `bold` flag lets the consumer highlight a focal
        // node (e.g. the page's own entity in narr8's graph tab).
        // Bold rendering uses 700 weight + larger font size so it
        // reads as clearly distinct from the surrounding nodes.
        textElement
          .attr("dy", -nodeRadius - 5)
          .attr("fill", "currentColor")
          .attr("font-size", d.bold ? 16 : 12)
          .attr("font-weight", d.bold ? 700 : null)
          .text(d.name);
      }
    });

    return () => {
      simulation?.stop();
    };
  }, [
    nodes,
    links,
    colorScale,
    visibleNodeIds,
    options?.directed,
    options?.layout,
    options?.layered?.rankdir,
    options?.layered?.nodesep,
    options?.layered?.ranksep,
    loadingNodeIds,
    onNodeClick,
  ]);

  const zoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;

    const svg = d3.select(svgRef.current);
    const zoom = zoomBehaviorRef.current;

    const currentTransform = zoomRef.current || d3.zoomIdentity;
    const newScale = Math.min(currentTransform.k * 1.3, 4);

    svg
      .transition()
      .duration(300)
      .call(zoom.transform, d3.zoomIdentity.translate(currentTransform.x, currentTransform.y).scale(newScale));
  }, []);

  const zoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;

    const svg = d3.select(svgRef.current);
    const zoom = zoomBehaviorRef.current;

    const currentTransform = zoomRef.current || d3.zoomIdentity;
    const newScale = Math.max(currentTransform.k * 0.7, 0.1);

    svg
      .transition()
      .duration(300)
      .call(zoom.transform, d3.zoomIdentity.translate(currentTransform.x, currentTransform.y).scale(newScale));
  }, []);

  const zoomToFitAll = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;

    const svg = d3.select(svgRef.current);
    const zoom = zoomBehaviorRef.current;

    // Get all visible nodes
    const visibleNodes = visibleNodeIds
      ? nodes.filter((node) => visibleNodeIds.has(node.id))
      : nodes.filter((node) => node.visible !== false);

    if (visibleNodes.length === 0) return;

    // Calculate bounds of all visible nodes
    const positions: { x: number; y: number }[] = [];
    visibleNodes.forEach((node) => {
      if (node.fx !== undefined && node.fy !== undefined && node.fx !== null && node.fy !== null) {
        positions.push({ x: node.fx, y: node.fy });
      } else if (node.x !== undefined && node.y !== undefined && node.x !== null && node.y !== null) {
        positions.push({ x: node.x, y: node.y });
      }
    });

    if (positions.length === 0) return;

    const bounds = {
      xMin: Math.min(...positions.map((p) => p.x)),
      xMax: Math.max(...positions.map((p) => p.x)),
      yMin: Math.min(...positions.map((p) => p.y)),
      yMax: Math.max(...positions.map((p) => p.y)),
    };

    // Add padding
    const padding = 150;
    bounds.xMin -= padding;
    bounds.xMax += padding;
    bounds.yMin -= padding;
    bounds.yMax += padding;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const contentWidth = bounds.xMax - bounds.xMin;
    const contentHeight = bounds.yMax - bounds.yMin;

    const scaleX = width / contentWidth;
    const scaleY = height / contentHeight;

    let scale = Math.min(scaleX, scaleY);
    scale = Math.min(Math.max(scale, 0.1), 2); // Clamp between 0.1 and 2

    const centerX = (bounds.xMin + bounds.xMax) / 2;
    const centerY = (bounds.yMin + bounds.yMax) / 2;

    const translateX = width / 2 - centerX * scale;
    const translateY = height / 2 - centerY * scale;

    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
  }, [nodes, visibleNodeIds]);

  // When container size changes (full-screen toggle), zoom to fit all nodes
  // This scales the view instead of recalculating positions, maintaining relative layout
  useEffect(() => {
    if (containerKey !== undefined && containerKey !== prevContainerKeyRef.current) {
      // Small delay to allow the container to finish resizing
      const timeoutId = setTimeout(() => {
        zoomToFitAll();
      }, 100);

      prevContainerKeyRef.current = containerKey;

      return () => clearTimeout(timeoutId);
    }
  }, [containerKey, zoomToFitAll]);

  return { svgRef, zoomIn, zoomOut, zoomToNode, zoomToFitAll };
}
