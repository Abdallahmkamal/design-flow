import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Input } from './Input';

describe('Input', () => {
  it('associates its visible label and description', () => {
    render(
      <Input
        label="Work email"
        description="Use your synthetic Phase 1 account."
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Work email' });

    expect(input).toHaveAccessibleDescription(
      'Use your synthetic Phase 1 account.',
    );
  });

  it('exposes validation errors without relying on color', () => {
    render(<Input label="Work email" error="Enter a valid email address." />);

    expect(screen.getByRole('textbox', { name: 'Work email' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a valid email address.',
    );
  });
});
