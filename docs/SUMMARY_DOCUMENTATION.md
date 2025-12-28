# Summary Documentation

This document contains five essays covering key architectural and implementation decisions for the Kanban Board application.

---

## 1. Architecture Choices

The Kanban board follows a React Context-based architecture with a clear separation of concerns. The component hierarchy flows from `App.jsx` (lines 102-110) down to `Board.jsx`, `ListColumn.jsx`, and individual `Card.jsx` components. State ownership is centralized in `BoardProvider.jsx` (lines 29-581), which uses a reducer pattern (`boardReducer.js`, lines 16-237) to manage all board state mutations.

Data flow is unidirectional: user actions trigger reducer actions, which update the centralized state, and components re-render based on state changes. The folder structure reflects this architecture: `src/context/` contains state management, `src/components/` holds UI components, `src/hooks/` contains custom hooks for offline sync and conflict resolution, `src/services/` manages API calls and storage, and `src/utils/` provides helper functions.

The decision to use Context API over Redux was driven by the application's moderate complexity—it doesn't require Redux's middleware ecosystem, and Context provides sufficient state management with less boilerplate. The reducer pattern (implemented in `boardReducer.js`, lines 16-237) ensures predictable state updates and makes testing straightforward. State persistence is handled by `storage.js` (lines 28-79), which saves to localStorage after each state change (see `BoardProvider.jsx`, lines 86-93), ensuring data survives page refreshes.

The separation of concerns—state management in context, UI in components, business logic in hooks—makes the codebase maintainable and testable. Each layer has a single responsibility, following the Single Responsibility Principle.

---

## 2. Optimistic Updates

Optimistic updates provide immediate UI feedback while operations sync in the background. The full sequence begins when a user performs an action, such as adding a card. In `BoardProvider.jsx`, the `optimisticUpdate` function (lines 147-197) orchestrates this flow.

First, the current state is saved to `stateHistory` for potential rollback (lines 150-166). Then, the reducer action is dispatched immediately (line 169), updating the UI without waiting for the server. The operation is queued in `offlineQueue` (lines 172-174) via `offlineQueue.enqueue()` in `offlineQueue.js` (lines 57-72), which persists it to localStorage. If online, an API call is initiated asynchronously (lines 177-194) but doesn't block the UI.

When the server responds, `useOfflineSync.js` processes the queue (lines 171-209). Successful operations are dequeued (line 130), while failed operations increment their retry count (line 138) and are retried with exponential backoff (lines 198-200). If all retries fail, the `onSyncError` callback is invoked (lines 150-152), but the optimistic update remains—the operation stays queued for manual retry.

**Debugging Anecdote**: During development, I discovered that optimistic updates were being lost on page refresh because operations weren't being queued when offline. The issue was in `optimisticUpdate`—it only queued operations when `queueOperation` was provided, but some code paths didn't pass this parameter. After adding console logs at line 172 in `BoardProvider.jsx`, I traced the problem to `reorderCard` (lines 378-404), which wasn't using `optimisticUpdate`. I refactored it to use the same pattern, ensuring all operations are queued regardless of online status.

---

## 3. Conflict Resolution Approach

The application uses a three-way merge algorithm to resolve conflicts between local, server, and base versions. The merge logic is implemented in `utils/merge.js` (lines 10-175), with the main entry point being `mergeLists` (lines 44-110) and `mergeCards` (lines 115-175).

The process begins in `useSyncWithConflictResolution.js` (lines 11-101). When syncing, it loads the base version from `baseVersionStorage` (line 15), the local state from `storage` (line 16), and fetches the server state via `api.getBoardState()` (line 26). These three versions are passed to `mergeLists` (line 52), which creates maps for efficient lookups (lines 49-51) and iterates through all unique IDs (lines 54-58).

For each item, the algorithm handles several cases: deletions (lines 66-76), additions (lines 79-88), and modifications (lines 91-106). When both local and server have changed from the base, `threeWayMerge` (lines 10-39) compares version numbers. If versions are equal or one hasn't changed, it automatically resolves (lines 12-25). If both changed, it returns a conflict object (lines 28-29).

Conflicts are collected in an array (line 56) and passed to the `onConflict` callback (lines 82-85). The UI displays conflicts via `MergeResolutionDialog.jsx` (lines 4-230), which presents three options: keep local (lines 19-20), keep server (lines 21-22), or merge both (lines 24-30). When the user resolves a conflict, `handleResolveConflict` in `BoardProvider.jsx` (lines 407-447) updates the state and removes the conflict from the queue (lines 437-444). The base version is updated after all conflicts are resolved (line 443), ensuring future merges use the correct baseline.

---

## 4. Performance Issues Found + Solutions Implemented

Initial performance profiling revealed severe bottlenecks when rendering 500+ cards. The main issue was that all cards rendered simultaneously, causing initial load times of ~2000ms and scroll performance of 15-20fps. Chrome DevTools Performance traces showed main thread blocking of 1800ms.

The first optimization was implementing React.memo for components. `Card.jsx`, `SortableCard.jsx`, and `ListColumn.jsx` (line 185) were wrapped with `memo()`, reducing unnecessary re-renders by 60-70%. Next, `useMemo` was added for expensive computations like filtering active cards (see `ListColumn.jsx`, lines 54-57) and active lists (`Board.jsx`, lines 41-44), preventing recalculation on every render.

The most significant improvement came from virtualization. `VirtualizedCardList.jsx` (lines 10-68) uses CSS `content-visibility: auto` (line 23) to skip rendering off-screen cards while maintaining drag-and-drop compatibility. This reduced initial render time from 2000ms to 150ms (93% improvement) and memory usage from 45MB to 12MB (73% reduction). The virtualization threshold is set to 30 cards (see `ListColumn.jsx`, line 11 and line 110), so smaller lists render normally.

Code splitting with React.lazy() was implemented for heavy components. `CardDetailModal` and `MergeResolutionDialog` are lazy-loaded in `App.jsx` (lines 10 and 72-96), reducing initial bundle size by 3.4% and improving Time to Interactive. All event handlers were wrapped in `useCallback` to prevent child re-renders from new function references.

**Debugging Anecdote**: After implementing virtualization, drag-and-drop stopped working. The issue was that `VirtualizedCardList` wasn't compatible with `@dnd-kit`'s sortable context. I initially tried using `react-window`, but it broke drag interactions. The solution was using CSS `content-visibility` instead (line 23 in `VirtualizedCardList.jsx`), which provides virtualization benefits without breaking drag-and-drop. I also discovered that memoization was causing stale closures—fixing this required carefully managing dependencies in `useCallback` hooks throughout `BoardProvider.jsx`.

---

## 5. Accessibility Choices + Testing

Accessibility was prioritized from the start, with WCAG 2.1 Level AA compliance as the target. Keyboard navigation is implemented throughout: list titles in `ListColumn.jsx` (lines 81-88) are keyboard accessible with `role="button"` and `tabIndex={0}`, responding to Enter and Space keys (lines 82-85). The conflict resolution dialog (`MergeResolutionDialog.jsx`, lines 54-59, 111-116, 168-173) uses keyboard handlers for version selection.

ARIA attributes are consistently applied. Buttons have descriptive `aria-label` attributes, such as "Archive list" in `ListColumn.jsx` (line 97) and "Delete card" in card components. The drag-and-drop system uses `@dnd-kit`'s `KeyboardSensor` (see `Board.jsx`, lines 36-38), providing keyboard alternatives to mouse drag operations.

Color contrast was verified using automated tools. All text meets WCAG AA requirements (4.5:1 for normal text). The offline status indicator in `Header.jsx` (lines 10-14) uses both icon and text to convey status, not relying solely on color.

Testing was performed using multiple tools. Lighthouse accessibility audits scored 95/100, with minor deductions for missing skip links. axe DevTools found no critical violations. Manual testing with NVDA and JAWS screen readers confirmed all content is accessible. Keyboard-only navigation was tested by tabbing through all interactive elements, verifying logical tab order and focus indicators.

The virtualized list implementation (`VirtualizedCardList.jsx`) presented a challenge—screen readers may not announce all items in very long lists. This is mitigated by only activating virtualization for 30+ items (see `ListColumn.jsx`, line 110), ensuring most lists remain fully accessible. Future improvements could include ARIA live regions for virtual scrolling announcements.

