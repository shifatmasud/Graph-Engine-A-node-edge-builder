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