import { render, screen, fireEvent } from '@testing-library/react'
import MergeResolutionDialog from './MergeResolutionDialog'

describe('MergeResolutionDialog', () => {
  const mockOnResolve = jest.fn()
  const mockOnCancel = jest.fn()

  const mockConflict = {
    type: 'list',
    id: 'list-1',
    base: { id: 'list-1', version: 1, title: 'Base Title' },
    local: { id: 'list-1', version: 2, title: 'Local Title', lastModifiedAt: '2024-01-01T00:00:00Z' },
    server: { id: 'list-1', version: 2, title: 'Server Title', lastModifiedAt: '2024-01-02T00:00:00Z' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(
      <MergeResolutionDialog
        isOpen={false}
        conflict={mockConflict}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.queryByText(/resolve conflict/i)).not.toBeInTheDocument()
  })

  it('should not render when conflict is null', () => {
    render(
      <MergeResolutionDialog
        isOpen={true}
        conflict={null}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.queryByText(/resolve conflict/i)).not.toBeInTheDocument()
  })

  it('should render when isOpen is true and conflict exists', () => {
    render(
      <MergeResolutionDialog
        isOpen={true}
        conflict={mockConflict}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.getByText(/resolve conflict/i)).toBeInTheDocument()
    expect(screen.getByText(/list/i)).toBeInTheDocument()
  })

  it('should display local and server versions', () => {
    render(
      <MergeResolutionDialog
        isOpen={true}
        conflict={mockConflict}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.getAllByText(/local version/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/server version/i)[0]).toBeInTheDocument()
    expect(screen.getByText('Local Title')).toBeInTheDocument()
    expect(screen.getByText('Server Title')).toBeInTheDocument()
  })

  it('should call onResolve with local version when local is selected', () => {
    render(
      <MergeResolutionDialog
        isOpen={true}
        conflict={mockConflict}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
      />
    )

    // Click on local version option
    const localOption = screen.getByText(/local version/i).closest('div[role="button"]')
    fireEvent.click(localOption)

    // Click resolve button
    const resolveButton = screen.getByRole('button', { name: /resolve/i })
    fireEvent.click(resolveButton)

    expect(mockOnResolve).toHaveBeenCalledWith('list-1', mockConflict.local, 'list')
  })

  it('should call onResolve with server version when server is selected', () => {
    render(
      <MergeResolutionDialog
        isOpen={true}
        conflict={mockConflict}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
      />
    )

    // Click on server version option
    const serverOptions = screen.getAllByText(/server version/i)
    const serverOption = serverOptions[0].closest('div[role="button"]')
    fireEvent.click(serverOption)

    // Click resolve button
    const resolveButton = screen.getByRole('button', { name: /resolve/i })
    fireEvent.click(resolveButton)

    expect(mockOnResolve).toHaveBeenCalledWith('list-1', mockConflict.server, 'list')
  })

  it('should call onResolve with merged version when merge is selected', () => {
    render(
      <MergeResolutionDialog
        isOpen={true}
        conflict={mockConflict}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
      />
    )

    // Click on merge option
    const mergeOption = screen.getByText(/merge both/i).closest('div[role="button"]')
    fireEvent.click(mergeOption)

    // Click resolve button
    const resolveButton = screen.getByRole('button', { name: /resolve/i })
    fireEvent.click(resolveButton)

    expect(mockOnResolve).toHaveBeenCalled()
    const callArgs = mockOnResolve.mock.calls[0]
    expect(callArgs[0]).toBe('list-1')
    expect(callArgs[2]).toBe('list')
    // Check that merged version combines both
    expect(callArgs[1].title).toBe('Server Title') // Server overwrites local
    expect(callArgs[1].version).toBe(3) // Max version + 1
  })

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <MergeResolutionDialog
        isOpen={true}
        conflict={mockConflict}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should handle card conflicts', () => {
    const cardConflict = {
      type: 'card',
      id: 'card-1',
      base: { id: 'card-1', version: 1, title: 'Base Card' },
      local: { id: 'card-1', version: 2, title: 'Local Card', description: 'Local desc' },
      server: { id: 'card-1', version: 2, title: 'Server Card', description: 'Server desc' },
    }

    render(
      <MergeResolutionDialog
        isOpen={true}
        conflict={cardConflict}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText(/resolve conflict: card/i)).toBeInTheDocument()
    expect(screen.getByText('Local Card')).toBeInTheDocument()
    expect(screen.getByText('Server Card')).toBeInTheDocument()
  })

  it('should handle keyboard navigation for version selection', () => {
    render(
      <MergeResolutionDialog
        isOpen={true}
        conflict={mockConflict}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
      />
    )

    const localOption = screen.getByText(/local version/i).closest('div[role="button"]')
    
    // Test Enter key
    fireEvent.keyDown(localOption, { key: 'Enter' })
    expect(screen.getByDisplayValue('local')).toBeChecked()

    // Test Space key
    const serverOptions = screen.getAllByText(/server version/i)
    const serverOption = serverOptions[0].closest('div[role="button"]')
    fireEvent.keyDown(serverOption, { key: ' ' })
    expect(screen.getByDisplayValue('server')).toBeChecked()
  })

  it('should default to server version', () => {
    render(
      <MergeResolutionDialog
        isOpen={true}
        conflict={mockConflict}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByDisplayValue('server')).toBeChecked()
  })
})

