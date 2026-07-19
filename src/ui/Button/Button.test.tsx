import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('uses button semantics and activates with the keyboard', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Save changes</Button>);

    const button = screen.getByRole('button', { name: 'Save changes' });
    button.focus();
    await user.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('announces and disables a pending action', () => {
    render(<Button isLoading>Save changes</Button>);

    expect(
      screen.getByRole('button', { name: 'Save changes, loading' }),
    ).toBeDisabled();
  });
});
