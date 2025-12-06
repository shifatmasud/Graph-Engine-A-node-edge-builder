# LLM Context

This project is a custom node editor implementation.

## Key Files

- `components/App/FlowEditor.tsx`: Main logic hub. Handles viewport state, node state, and global event listeners for the canvas.
- `components/Core/GraphEngine.tsx`: The core logic for canvas interactions (pan, zoom, gestures), node/edge rendering, and connection management.
- `components/Core/NodeShell.tsx`: The wrapper component for nodes, handling drag logic, selection state, and handle rendering.
- `utils/geometry.ts`: Critical math for converting screen coordinates to canvas coordinates (accounting for zoom/pan) and generating Bezier paths.

## Styling Logic

- **CSS-in-JS**: All styles are defined as JavaScript objects within components, using semantic design tokens from `ThemeContext.tsx`.
- **Design Tokens**:
    - **Surface**: `theme.surface[1-3]` hierarchy (e.g., Zinc 950/900/800 dark mode).
    - **Content**: `theme.content[1-3]` hierarchy (e.g., Zinc 50/400/600 dark mode).
    - **Accent**: `theme.accent.primary` (e.g., Blue 500), `theme.accent.glow`, `theme.accent.valid`, `theme.accent.danger`.
    - **Border**: `theme.border`.
    - **Shadow**: `theme.shadow`.
    - **Space**: `theme.space['1'-'12']` using a 4pt grid system (e.g., `theme.space[2]` is '8px').
    - **Radius**: `theme.radius['1'-'6']` and `theme.radius.round` for consistent border radii.
- **Motion**: Spring animations via Framer Motion.
- **State Layer**: Interactive elements utilize an absolute-positioned, circular overlay (`stateLayer`) for visual feedback on hover and press, maintaining the core component's visual integrity.

## Constraints

- No external flow libraries (React Flow, etc).
- No Tailwind CSS. All styling must be CSS-in-JS using provided theme tokens.