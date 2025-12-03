# Bug Report

## In Progress
- [ ] **Edge Calculation**: Handle position calculation is currently approximated based on CSS assumptions. A `ResizeObserver` or `ref` based measurement system would be more robust for production.
- [ ] **Node Drag Performance**: Framer Motion handles visual drag efficiently, but state sync happens `onDragEnd` to prevent re-render storms.

## Suggestions
- Add "Snap to Grid" functionality.
- Implement "Delete" key handler for selected nodes/edges.
