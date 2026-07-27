import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './themeContext';

function ThemeControl() {
  const { theme, toggleTheme } = useTheme();

  return <button onClick={toggleTheme}>{theme}</button>;
}

it('keeps theming usable when browser storage is unavailable', async () => {
  const getItem = vi
    .spyOn(Storage.prototype, 'getItem')
    .mockImplementation(() => {
      throw new DOMException('Synthetic storage denial', 'SecurityError');
    });
  const setItem = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new DOMException('Synthetic storage denial', 'SecurityError');
    });

  try {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeControl />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'light' }));

    expect(screen.getByRole('button', { name: 'dark' })).toBeVisible();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  } finally {
    getItem.mockRestore();
    setItem.mockRestore();
  }
});
