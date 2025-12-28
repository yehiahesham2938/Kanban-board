import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the kanban board title', () => {
    render(<App />)
    const titleElement = screen.getByRole('heading', { name: /kanban board/i })
    expect(titleElement).toBeInTheDocument()
  })

  it('renders empty board message', () => {
    render(<App />)
    const emptyMessage = screen.getByText(/your board is empty/i)
    expect(emptyMessage).toBeInTheDocument()
  })
})

