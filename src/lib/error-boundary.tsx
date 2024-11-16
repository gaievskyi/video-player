import { Component, type ReactNode } from "react"

export type ErrorPageProps = {
  error?: Error
  reset?: () => void
}

type ErrorBoundaryProps = {
  children: ReactNode
  fallback: ReactNode | ((props: ErrorPageProps) => ReactNode)
}

type ErrorBoundaryState = {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({
          error: this.state.error,
          reset: this.reset
        })
      }
      return this.props.fallback
    }

    return this.props.children
  }
}