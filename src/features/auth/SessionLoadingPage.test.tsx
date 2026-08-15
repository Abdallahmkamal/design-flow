import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SessionLoadingPage } from './SessionLoadingPage';

describe('SessionLoadingPage', () => {
  it('shows only the animated Design Flow mark and an accessible status', () => {
    const { container } = render(<SessionLoadingPage />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Restoring your session…',
    );
    expect(container.querySelector('img[aria-hidden="true"]')).toBeVisible();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
