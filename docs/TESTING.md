# Testing Documentation

## Overview

This document describes the comprehensive testing strategy for the Kanban Board application, covering unit tests, integration tests, and end-to-end tests.

## Test Coverage Requirements

- **Minimum 80% line coverage** (configured in `jest.config.cjs`)
- **Unit tests**: All hooks and components
- **Integration tests**: Reducer logic and offline syncing
- **E2E tests**: Complete workflow including offline operations

## Test Structure

### Unit Tests

#### Component Tests
- **Card.test.jsx**: Tests card rendering, interactions, and edge cases
- **ListColumn.test.jsx**: Tests list rendering, card management, and list operations
- **Header.test.jsx**: Tests header rendering and status indicators

#### Hook Tests
- **useBoardState.test.js**: Tests board state management and operations
- **useOfflineSync.test.js**: Tests offline synchronization logic
- **useUndoRedo.test.js**: Tests undo/redo functionality

### Integration Tests

#### Reducer Integration
- **boardReducer.test.js**: Unit tests for individual reducer actions
- **boardReducer.integration.test.js**: Complex workflows and state transitions

#### Offline Sync Integration
- **useOfflineSync.integration.test.js**: Complete offline workflows including:
  - Queueing operations while offline
  - Reconnection and automatic sync
  - Retry logic for failed operations
  - Multiple operation types in sequence

### End-to-End Tests

#### E2E Workflow Test
- **e2e/kanban-workflow.spec.js**: Comprehensive E2E test covering:
  1. Creating lists and cards
  2. Moving cards between lists
  3. Performing offline changes
  4. Syncing after reconnect
  5. Data persistence after page refresh

## Running Tests

### Unit and Integration Tests
```bash
npm test
```

### With Coverage Report
```bash
npm run test:coverage
```

### End-to-End Tests
```bash
npm run e2e
```

## Test Coverage Goals

- **Lines**: 80% minimum
- **Functions**: 80% minimum
- **Branches**: 75% minimum
- **Statements**: 80% minimum

## Test Files Created

1. `src/components/Card.test.jsx` - Card component unit tests
2. `src/components/ListColumn.test.jsx` - ListColumn component unit tests
3. `src/components/Header.test.jsx` - Header component unit tests
4. `src/context/boardReducer.test.js` - Reducer unit tests
5. `src/context/boardReducer.integration.test.js` - Reducer integration tests
6. `src/hooks/useOfflineSync.integration.test.js` - Offline sync integration tests
7. `e2e/kanban-workflow.spec.js` - Comprehensive E2E test

## Existing Test Files

- `src/App.test.jsx` - App component tests
- `src/hooks/useBoardState.test.js` - useBoardState hook tests
- `src/hooks/useOfflineSync.test.js` - useOfflineSync hook tests
- `src/hooks/useUndoRedo.test.js` - useUndoRedo hook tests

## Test Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: External dependencies are mocked to ensure fast, reliable tests
3. **Coverage**: All critical paths and edge cases are tested
4. **Readability**: Tests are well-named and clearly describe what they're testing
5. **Maintainability**: Tests are structured to be easy to update when code changes

## Notes

- Some tests may need adjustments based on actual component implementation
- E2E tests use Playwright and may require browser installation
- Integration tests verify that multiple systems work together correctly
- Coverage thresholds are enforced in CI/CD pipelines

