import { render, screen, fireEvent } from '@testing-library/react'
import InlineEditor from './InlineEditor'

describe('InlineEditor', () => {
  const mockOnSave = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render input with initial value', () => {
    render(
      <InlineEditor
        value="Initial Value"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )
    const input = screen.getByDisplayValue('Initial Value')
    expect(input).toBeInTheDocument()
  })

  it('should call onSave when Enter is pressed', () => {
    render(
      <InlineEditor
        value="Test Value"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )
    const input = screen.getByDisplayValue('Test Value')
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    expect(mockOnSave).toHaveBeenCalledWith('Test Value')
  })

  it('should call onCancel when Escape is pressed', () => {
    render(
      <InlineEditor
        value="Test Value"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )
    const input = screen.getByDisplayValue('Test Value')
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' })
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should update value when typing', () => {
    render(
      <InlineEditor
        value="Initial"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )
    const input = screen.getByDisplayValue('Initial')
    fireEvent.change(input, { target: { value: 'Updated' } })
    expect(input).toHaveValue('Updated')
  })

  it('should call onSave with trimmed value', () => {
    render(
      <InlineEditor
        value="Test"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )
    const input = screen.getByDisplayValue('Test')
    fireEvent.change(input, { target: { value: '  Trimmed  ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockOnSave).toHaveBeenCalledWith('Trimmed')
  })

  it('should display placeholder', () => {
    render(
      <InlineEditor
        value=""
        placeholder="Enter text"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
  })

  it('should auto-focus input', () => {
    render(
      <InlineEditor
        value="Test"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )
    const input = screen.getByDisplayValue('Test')
    expect(input).toHaveFocus()
  })
})

