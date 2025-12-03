
export interface Position {
  x: number;
  y: number;
}

export type Side = 'top' | 'right' | 'bottom' | 'left';

export interface NodeData {
  label: string;
  type: 'input' | 'process' | 'output';
  value?: string | number;
}

export interface Node {
  id: string;
  position: Position;
  data: NodeData;
  handles: {
    [key in Side]?: number;
  };
  width?: number;
  height?: number;
}

export interface Edge {
  id: string;
  source: string;
  sourceHandle: number;
  sourceSide: Side;
  target: string;
  targetHandle: number;
  targetSide: Side;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export type ConnectionStatus = 'idle' | 'connecting';

export interface PendingConnection {
  sourceNodeId: string;
  sourceHandle: number;
  sourceSide: Side;
  startPos: Position;
}

export interface DragConnection {
  sourceNodeId: string;
  sourceHandleIndex: number;
  sourceSide: Side;
  currentPosition: Position;
}
