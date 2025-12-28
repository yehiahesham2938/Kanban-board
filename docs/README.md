# Documentation

This folder contains all required documentation for the Kanban Board project.

## Required Documents

### Performance & Profiling
- **PERFORMANCE_REPORT.md**: Detailed performance analysis with profiling evidence, metrics, and optimization strategies
- **CODE_SPLITTING.md**: Code splitting implementation with React.lazy() and Suspense, including bundle analysis

### Essays
- Additional required essays will be added here as specified

## How to Generate Test Data

### Browser Console Method (Recommended)
1. Open the browser console (F12)
2. Navigate to the `scripts/seedData.browser.js` file
3. Copy the entire contents
4. Paste into the console and press Enter
5. Refresh the page to see 580 test cards

### Node.js Method
```bash
node scripts/seedData.js
```

## Performance Testing

1. Generate test data using the seeding script
2. Open Chrome DevTools → Performance tab
3. Click Record
4. Interact with the board (scroll, drag cards, add/delete)
5. Stop recording and analyze the trace
6. Use React DevTools Profiler for component-level analysis

## Profiling Tools Used

- **Chrome DevTools Performance**: For overall application performance
- **React DevTools Profiler**: For component render analysis
- **Lighthouse**: For performance audits (optional)

