
import { Position, Side } from '../types';

/**
 * Calculates a smooth Cubic Bezier path between two points.
 * Adjusts control points based on the side of the node the handle is on.
 */
export const getBezierPath = (
  source: Position,
  target: Position,
  sourceSide: Side = 'right',
  targetSide: Side = 'left',
  curvature = 50
): string => {
  const { x: sx, y: sy } = source;
  const { x: tx, y: ty } = target;

  let cp1x = sx, cp1y = sy;
  let cp2x = tx, cp2y = ty;

  // Calculate Source Control Point
  switch (sourceSide) {
    case 'left': cp1x = sx - curvature; break;
    case 'right': cp1x = sx + curvature; break;
    case 'top': cp1y = sy - curvature; break;
    case 'bottom': cp1y = sy + curvature; break;
  }

  // Calculate Target Control Point
  switch (targetSide) {
    case 'left': cp2x = tx - curvature; break;
    case 'right': cp2x = tx + curvature; break;
    case 'top': cp2y = ty - curvature; break;
    case 'bottom': cp2y = ty + curvature; break;
  }

  return `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;
};

/**
 * Calculates the center point (t=0.5) of a Cubic Bezier curve.
 */
export const getBezierCenter = (
  source: Position,
  target: Position,
  sourceSide: Side = 'right',
  targetSide: Side = 'left',
  curvature = 50
): Position => {
  const { x: sx, y: sy } = source;
  const { x: tx, y: ty } = target;

  let cp1x = sx, cp1y = sy;
  let cp2x = tx, cp2y = ty;

  switch (sourceSide) {
    case 'left': cp1x = sx - curvature; break;
    case 'right': cp1x = sx + curvature; break;
    case 'top': cp1y = sy - curvature; break;
    case 'bottom': cp1y = sy + curvature; break;
  }

  switch (targetSide) {
    case 'left': cp2x = tx - curvature; break;
    case 'right': cp2x = tx + curvature; break;
    case 'top': cp2y = ty - curvature; break;
    case 'bottom': cp2y = ty + curvature; break;
  }

  // Cubic Bezier at t=0.5
  // B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3
  const t = 0.5;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  const x = mt3 * sx + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * tx;
  const y = mt3 * sy + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * ty;

  return { x, y };
};

/**
 * Converts screen coordinates (mouse event) to canvas coordinates
 * considering pan and zoom.
 */
export const screenToCanvas = (
  screenPos: Position,
  viewport: { x: number; y: number; zoom: number },
  containerRect: DOMRect
): Position => {
  return {
    x: (screenPos.x - containerRect.left - viewport.x) / viewport.zoom,
    y: (screenPos.y - containerRect.top - viewport.y) / viewport.zoom,
  };
};

export const generateId = () => Math.random().toString(36).substring(2, 9);
