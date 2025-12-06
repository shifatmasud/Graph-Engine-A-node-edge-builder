# Bug Report

## In Progress
- [ ] **Node Drag Performance**: Framer Motion handles visual drag efficiently, but state sync happens `onDragEnd` to prevent re-render storms during drag. For complex graphs, optimizing this could be beneficial.

## Resolved
- **Edge Calculation**: The handle position calculation is now robustly based on `ResizeObserver` which accurately reports node dimensions, making connections precise.

## Suggestions
- Add "Snap to Grid" functionality.
- Implement "Delete" key handler for selected nodes/edges.
- Implement multi-node selection (e.g., via Shift+Click or a selection box).