import {
  Component,
  type ErrorInfo,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

import { Button } from '../ui/primitives/button';
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
            <h1 id="error-title">This view couldn’t load</h1>
            <p>Try again, or return to the Dashboard.</p>
            <div className={styles.actions}>
              <Button variant="secondary" asChild>
                <a href="/">Back to dashboard</a>
              </Button>
              <Button onClick={this.reset}>Try again</Button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
