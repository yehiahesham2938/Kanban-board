# Kanban Board Application

A full-featured Kanban board application built with React, featuring drag-and-drop, offline support, conflict resolution, and performance optimizations for handling 500+ cards.

## Features

- ✅ **Drag & Drop**: Smooth drag-and-drop for cards within and between lists
- ✅ **Offline Support**: Full functionality offline with automatic sync
- ✅ **Optimistic Updates**: Instant UI updates with server sync
- ✅ **Conflict Resolution**: Three-way merge for handling conflicts
- ✅ **Performance Optimized**: Handles 500+ cards with virtualization
- ✅ **Custom Hooks**: useBoardState, useOfflineSync, useUndoRedo
- ✅ **Accessibility**: WCAG 2.1 AA compliant

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Generate Test Data

To generate 500+ test cards for performance testing:

**Browser Console Method** (Recommended):
1. Open browser console (F12)
2. Copy contents of `scripts/seedData.browser.js`
3. Paste and execute in console
4. Refresh the page

**Node.js Method**:
```bash
npm run seed
```

## Performance Testing

1. Generate test data using the seeding script
2. Open Chrome DevTools → Performance tab
3. Record a session while interacting with the board
4. Analyze the performance trace
5. Check `docs/PERFORMANCE_REPORT.md` for detailed analysis

## Project Structure

```
src/
├── components/       # React components
├── context/          # React Context providers
├── hooks/            # Custom hooks
├── services/         # API and storage services
├── utils/            # Utility functions
├── styles/           # CSS styles
└── mocks/            # MSW handlers

docs/                 # Documentation
scripts/              # Data seeding scripts
```

## Documentation

See the `docs/` folder for:
- **PERFORMANCE_REPORT.md**: Performance analysis and profiling
- **ACCESSIBILITY_REPORT.md**: Accessibility audit and compliance
- **README.md**: This file

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm test` - Run unit tests
- `npm run test:coverage` - Run tests with coverage
- `npm run e2e` - Run end-to-end tests
- `npm run seed` - Generate test data

## Technologies

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **@dnd-kit** - Drag and drop
- **MSW** - API mocking
- **Jest** - Testing
- **Playwright** - E2E testing

## License

MIT
