import { Component } from 'react'

/**
 * Top-level error boundary. Without this, any uncaught render error unmounts the
 * whole React tree to a blank white screen with no recovery path. Here we catch
 * it, show a minimal fallback, and offer a reload.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Surface in dev; in production this is where a real error reporter (Sentry,
    // etc.) would be wired in.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Unhandled UI error:', error, info)
    }
  }

  handleReload = () => {
    this.setState({ hasError: false })
    window.location.assign('/')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4">
          <div className="card max-w-md w-full p-8 text-center">
            <h1 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              An unexpected error occurred. You can return to the dashboard and try again.
            </p>
            <button onClick={this.handleReload} className="btn-primary mt-6 text-sm">
              Back to dashboard
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
