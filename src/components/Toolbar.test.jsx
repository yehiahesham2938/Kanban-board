import { render, screen, fireEvent } from '@testing-library/react'
import Toolbar from './Toolbar'

describe('Toolbar', () => {
  const mockOnClearBoard = jest.fn()
  const mockOnExportData = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render export data button', () => {
    render(
      <Toolbar onClearBoard={mockOnClearBoard} onExportData={mockOnExportData} />
    )
    const exportButton = screen.getByRole('button', { name: /export data/i })
    expect(exportButton).toBeInTheDocument()
  })

  it('should render clear board button', () => {
    render(
      <Toolbar onClearBoard={mockOnClearBoard} onExportData={mockOnExportData} />
    )
    const clearButton = screen.getByRole('button', { name: /clear board/i })
    expect(clearButton).toBeInTheDocument()
  })

  it('should call onExportData when export button is clicked', () => {
    render(
      <Toolbar onClearBoard={mockOnClearBoard} onExportData={mockOnExportData} />
    )
    const exportButton = screen.getByRole('button', { name: /export data/i })
    fireEvent.click(exportButton)
    expect(mockOnExportData).toHaveBeenCalled()
  })

  it('should call onClearBoard when clear button is clicked', () => {
    render(
      <Toolbar onClearBoard={mockOnClearBoard} onExportData={mockOnExportData} />
    )
    const clearButton = screen.getByRole('button', { name: /clear board/i })
    fireEvent.click(clearButton)
    expect(mockOnClearBoard).toHaveBeenCalled()
  })

  it('should not render export button when onExportData is not provided', () => {
    render(<Toolbar onClearBoard={mockOnClearBoard} />)
    expect(screen.queryByRole('button', { name: /export data/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear board/i })).toBeInTheDocument()
  })

  it('should not render clear button when onClearBoard is not provided', () => {
    render(<Toolbar onExportData={mockOnExportData} />)
    expect(screen.queryByRole('button', { name: /clear board/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export data/i })).toBeInTheDocument()
  })

  it('should render both buttons when both callbacks are provided', () => {
    render(
      <Toolbar onClearBoard={mockOnClearBoard} onExportData={mockOnExportData} />
    )
    expect(screen.getByRole('button', { name: /export data/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear board/i })).toBeInTheDocument()
  })

  it('should render nothing when no callbacks are provided', () => {
    const { container } = render(<Toolbar />)
    expect(container.querySelector('button')).not.toBeInTheDocument()
  })
})

