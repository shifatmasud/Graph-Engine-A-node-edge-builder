# Nexus Flow - Custom Node Editor

A premium, custom-built node editor using React 18, CSS-in-JS, and Framer Motion. This project demonstrates a high-performance visual interface without relying on heavy external node-graph libraries.

## Architecture

- **IPO Model**:
  - **Input**: Mouse events (Drag, Click, Scroll), Touch Gestures (Pinch, Pan).
  - **Process**: Geometry calculations (Bezier curves, Viewport transforms), State updates (Nodes, Edges).
  - **Output**: Rendered Canvas (SVG Layer + HTML Nodes).

- **Stack**:
  - React 18 (Hooks oriented)
  - TypeScript (Strict typing)
  - CSS-in-JS (Styling with semantic design tokens)
  - Framer Motion (Interactions & Animations)
  - Phosphor Icons (UI icons)

## Features

- **Infinite Canvas**: Pan (Middle-click, Alt+Drag, or two-finger drag) and Zoom (Ctrl+Wheel, or Pinch on touch).
- **Custom Nodes**: Draggable nodes with dynamic handles.
- **Bezier Connections**: Interactive SVG paths connecting nodes.
- **Context Menu**: Right-click menu for quick actions, tool selection, and project import/export.
- **Premium UI**: Glassmorphism, Semantic Color System with spacing/radius tokens, consistent Typography, and State Layer interactions.
- **Import/Export**: Save and load graph configurations as JSON.
- **Edge Management**: Select edges to reveal a delete control, improving clarity.

## Directory Structure

```
/
├── components/
│   ├── Core/           # Primitive Blocks (NodeBlock, Handle, ConnectionLine, NodeShell, GraphEngine, ThemeContext, EdgeConnector)
│   ├── Section/        # UI Sections (ContextMenu)
│   └── App/            # Logic Containers (FlowEditor)
├── utils/              # Math & Helpers
└── types.ts            # Global TS Definitions
```