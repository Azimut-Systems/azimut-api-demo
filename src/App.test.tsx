import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const auth = vi.hoisted(() => ({
  authed: false,
  login: vi.fn(async () => {
    auth.authed = true
  }),
  logout: vi.fn(() => {
    auth.authed = false
  }),
}))

vi.mock('./api/auth', () => ({
  hasCredentials: () => auth.authed,
  login: auth.login,
  logout: auth.logout,
}))

vi.mock('./pages/TransitFeed', () => ({
  TransitFeed: () => <div>Transit feed</div>,
}))

vi.mock('./pages/TransitDetail', () => ({
  TransitDetail: () => <div>Transit detail</div>,
}))

vi.mock('./pages/VesselList', () => ({
  VesselList: () => <div>Vessel list</div>,
}))

vi.mock('./pages/VesselDetail', () => ({
  VesselDetail: () => <div>Vessel detail</div>,
}))

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  auth.authed = false
  auth.login.mockClear()
  auth.logout.mockClear()
})

describe('App auth routes', () => {
  it('shows login instead of protected app content when unauthenticated', () => {
    renderApp('/')

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.queryByText('Transit feed')).not.toBeInTheDocument()
  })

  it('uses vessels as the authenticated home page', () => {
    auth.authed = true
    renderApp('/')

    expect(screen.getByText('Vessel list')).toBeInTheDocument()
    expect(screen.queryByText('Transit feed')).not.toBeInTheDocument()
  })

  it('keeps the transit feed available at /transits', () => {
    auth.authed = true
    renderApp('/transits')

    expect(screen.getByText('Transit feed')).toBeInTheDocument()
  })

  it('returns to the requested route after successful login', async () => {
    renderApp('/')

    fireEvent.change(screen.getByLabelText('Client ID'), {
      target: { value: 'client-id' },
    })
    fireEvent.change(screen.getByLabelText('API key'), {
      target: { value: 'api-key' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByText('Vessel list')).toBeInTheDocument()
    })
    expect(auth.login).toHaveBeenCalledWith({
      clientId: 'client-id',
      apiKey: 'api-key',
    })
  })

  it('stays on login and shows an error when credentials are rejected', async () => {
    auth.login.mockRejectedValueOnce(new Error('nope'))
    renderApp('/vessels')

    fireEvent.change(screen.getByLabelText('Client ID'), {
      target: { value: 'client-id' },
    })
    fireEvent.change(screen.getByLabelText('API key'), {
      target: { value: 'api-key' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not sign in with those credentials.',
    )
    expect(screen.queryByText('Vessel list')).not.toBeInTheDocument()
  })
})
