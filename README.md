# Nexus Flow - Custom Node Editor

A premium, custom-built node editor using React 18, Tailwind CSS, and Framer Motion. This project demonstrates a high-performance visual interface without relying on heavy external node-graph libraries.

## Architecture

- **IPO Model**:
  - **Input**: Mouse events (Drag, Click, Scroll).
  - **Process**: Geometry calculations (Bezier curves, Viewport transforms), State updates (Nodes, Edges).
  - **Output**: Rendered Canvas (SVG Layer + HTML Nodes).

- **Stack**:
  - React 18 (Hooks oriented)
  - TypeScript (Strict typing)
  - Tailwind CSS (Styling)
  - Framer Motion (Interactions & Animations)
  - Lucide React (Icons)

## Features

- **Infinite Canvas**: Pan (Alt+Drag) and Zoom (Ctrl+Wheel).
- **Custom Nodes**: Draggable nodes with inputs/outputs.
- **Bezier Connections**: Smooth SVG paths connecting nodes.
- **Dynamic Dock**: Floating control palette.
- **Premium UI**: Glassmorphism, Semantic Color System, Typography.

## Directory Structure

```
/
├── components/
│   ├── Core/           # Primitive Blocks (Node, Handle, Line)
│   ├── Section/        # UI Sections (Dock)
│   └── App/            # Logic Containers (FlowEditor)
├── utils/              # Math & Helpers
└── types.ts            # Global TS Definitions
```
