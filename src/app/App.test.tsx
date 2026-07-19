import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App foundation', () => {
  it('renders the synthetic Phase 1 dashboard inside the application shell', () => {
    window.history.pushState({}, '', '/');

    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: 'Design work, with the operating context intact',
      }),
    ).toBeVisible();
    expect(screen.getByText('Synthetic local environment')).toBeInTheDocument();
  });

  it('switches theme with an accessible control', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/');

    render(<App />);

    await user.click(
      screen.getByRole('button', { name: 'Switch to dark mode' }),
    );

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    ).toBeVisible();
  });

  it('labels unfinished product routes as synthetic placeholders', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/');

    render(<App />);
    await user.click(screen.getByRole('link', { name: 'Reports' }));

    expect(screen.getByRole('heading', { name: 'Reports' })).toBeVisible();
    expect(screen.getByText('Synthetic placeholder')).toBeVisible();
  });
});
