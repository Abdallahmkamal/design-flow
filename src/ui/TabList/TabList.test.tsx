import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { TabList } from './TabList';

function Example() {
  const [value, setValue] = useState<'one' | 'two'>('one');
  return (
    <TabList
      label="Reports"
      value={value}
      onValueChange={setValue}
      items={[
        { value: 'one', label: 'One', panelId: 'one-panel' },
        { value: 'two', label: 'Two', panelId: 'two-panel' },
      ]}
    />
  );
}

describe('TabList', () => {
  it('moves and activates with arrow keys', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const first = screen.getByRole('tab', { name: 'One' });
    first.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();
  });
});
