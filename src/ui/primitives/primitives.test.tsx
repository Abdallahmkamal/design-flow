import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  getInitials,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '.';

describe('team-ready primitives', () => {
  it('keeps Button state and activation semantic', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Continue</Button>);

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onClick).toHaveBeenCalledOnce();

    rerender(<Button isLoading>Continue</Button>);
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Continue' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('renders semantic Badge, Avatar, and Separator output', () => {
    render(
      <>
        <Badge tone="success">Ready</Badge>
        <Avatar aria-label="Ada Lovelace">
          <AvatarFallback>{getInitials('Ada Lovelace')}</AvatarFallback>
        </Avatar>
        <Separator />
      </>,
    );

    expect(screen.getByText('Ready')).toBeVisible();
    expect(screen.getByLabelText('Ada Lovelace')).toHaveTextContent('AL');
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('opens a Dropdown Menu and supports keyboard selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open profile</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const trigger = screen.getByRole('button', { name: 'Open profile' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledOnce();
    expect(trigger).toHaveFocus();
  });

  it('describes a focused Tooltip trigger and dismisses on Escape', async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Theme</button>
          </TooltipTrigger>
          <TooltipContent>Switch theme</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    await user.tab();
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Switch theme',
    );
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('traps and restores focus for Sheet dismissal', async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Quick actions</SheetTrigger>
        <SheetContent side="bottom">
          <SheetTitle>Quick actions</SheetTitle>
          <SheetDescription>Choose an available action.</SheetDescription>
          <Button>Log work</Button>
        </SheetContent>
      </Sheet>,
    );

    const trigger = screen.getByRole('button', { name: 'Quick actions' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Quick actions' })).toBeVisible();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
