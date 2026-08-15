import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RouteErrorBoundary } from './RouteErrorBoundary';

function BrokenView({ broken }: { broken: boolean }) {
  if (broken) {
    throw new Error('Synthetic route failure');
  }

  return <p>Recovered view</p>;
}

describe('RouteErrorBoundary', () => {
  it('offers a concise retry and a dashboard escape route', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const user = userEvent.setup();
    let broken = true;
    const { rerender } = render(
      <RouteErrorBoundary>
        <BrokenView broken={broken} />
      </RouteErrorBoundary>,
    );

    expect(
      screen.getByRole('heading', { name: 'This view couldn’t load' }),
    ).toBeVisible();
    expect(screen.queryByText('Application error')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to dashboard' }),
    ).toHaveAttribute('href', '/');

    broken = false;
    rerender(
      <RouteErrorBoundary>
        <BrokenView broken={broken} />
      </RouteErrorBoundary>,
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Recovered view')).toBeVisible();
    consoleError.mockRestore();
  });
});
