# Nexus Flow - Custom Node Editor

A premium, custom-built node editor using React 18, CSS-in-JS, and Framer Motion. This project demonstrates a high-performance visual interface without relying on heavy external node-graph libraries.

## Architecture

- **IPO Model**:
  - **Input**: Mouse events (Drag, Click, Scroll), Touch Gestures (Pinch, Pan).
  - **Process**: Geometry calculations (Bezier curves, Viewport transforms), State updates (Nodes, Edges), AI Graph Generation via Gemini API.
  - **Output**: Rendered Canvas (SVG Layer + HTML Nodes).

- **Stack**:
  - React 18 (Hooks oriented)
  - TypeScript (Strict typing)
  - CSS-in-JS (Styling with semantic design tokens)
  - Framer Motion (Interactions & Animations)
  - Phosphor Icons (UI icons)
  - Gemini API (AI Features)
  - Three.js (3D Model Rendering)

## Features

- **Infinite Canvas**: Pan (Middle-click, Alt+Drag, or two-finger drag) and Zoom (Ctrl+Wheel, or Pinch on touch).
- **Custom Nodes**: Draggable nodes with dynamic handles for standard data processing.
- **Embed Node**: A special node type that can host uploaded content, including images, videos, audio, and interactive 3D models (.glb).
- **AI Graph Generation**: Use a text prompt to have the Gemini AI automatically generate and lay out a complete node graph.
- **Bezier Connections**: Interactive SVG paths connecting nodes.
- **Context Menu**: Right-click menu for quick actions, tool selection, and project import/export.
- **Premium UI**: Glassmorphism, Semantic Color System with spacing/radius tokens, consistent Typography, and State Layer interactions.
- **Import/Export**: Save and load graph configurations as JSON, including embedded media data.
- **Edge Management**: Select edges to reveal a delete control, improving clarity.

## Directory Structure

```
/
├── components/
│   ├── Core/           # Primitive Blocks (NodeBlock, EmbedSlate, Handle, ConnectionLine, NodeShell, GraphEngine, ThemeContext, EdgeConnector)
│   ├── Section/        # UI Sections (ContextMenu, Dock, GeneratorModal)
│   └── App/            # Logic Containers (FlowEditor)
├── utils/              # Math & Helpers
└── types.ts            # Global TS Definitions
```