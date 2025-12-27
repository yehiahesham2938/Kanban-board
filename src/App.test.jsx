import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the kanban board title', () => {
    render(<App />)
    const titleElement = screen.getByRole('heading', { name: /kanban board/i })
    expect(titleElement).toBeInTheDocument()
  })

  it('renders welcome message', () => {
    render(<App />)
    const welcomeMessage = screen.getByText(/welcome to your kanban board application/i)
    expect(welcomeMessage).toBeInTheDocument()
  })
})

