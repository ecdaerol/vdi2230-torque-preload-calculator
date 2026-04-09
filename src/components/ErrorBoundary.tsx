import { Component, ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card p-6 text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
            Calculation error — check your inputs and try again.
          </p>
          <button
            className="mt-2 px-4 py-1 rounded-[10px] text-sm font-medium"
            style={{ background: 'var(--brand)', color: '#fff' }}
            onClick={() => this.setState({ hasError: false })}
          >
            Reset
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
