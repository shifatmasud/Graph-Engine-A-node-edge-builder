# LLM Context

This project is a custom node editor implementation.

## Key Files

- `components/App/FlowEditor.tsx`: Main logic hub. Handles viewport state, node state, and global event listeners for the canvas.
- `components/Core/NodeBlock.tsx`: The visual node component. Uses `framer-motion` for drag physics.
- `utils/geometry.ts`: Critical math for converting screen coordinates to canvas coordinates (accounting for zoom/pan) and generating Bezier paths.

## Styling Logic

- **Surface**: Zinc 950/900/800 hierarchy.
- **Content**: Zinc 50/400/600 hierarchy.
- **Accent**: Blue 500.
- **Motion**: Spring animations via Framer Motion.

## Constraints

- No external flow libraries (React Flow, etc).
- Tailwind CSS for all styling.
