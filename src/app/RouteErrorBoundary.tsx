import {
  Component,
  type ErrorInfo,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

import { Button } from '../ui/Button/Button';
import { reportUnexpectedError } from '../shared/monitoring/monitoring';
import styles from './RouteErrorBoundary.module.css';

interface RouteErrorBoundaryState {
  error: Error | null;
}

export class RouteErrorBoundary extends Component<
  PropsWithChildren,
  RouteErrorBoundaryState
> {
  override state: RouteErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    reportUnexpectedError(error, 'react_boundary');

    if (import.meta.env.DEV) {
      console.error('Design Flow render failure', error, info);
    }
  }

  private reset = () => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <main className={styles.page}>
          <section className={styles.panel} aria-labelledby="error-title">
            <p className={styles.eyebrow}>Application error</p>
            <h1 id="error-title">Design Flow could not load this view</h1>
            <p>
              Try the view again. If the problem continues, record what you were
              doing and contact the system administrator.
            </p>
            <Button onClick={this.reset}>Try again</Button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
