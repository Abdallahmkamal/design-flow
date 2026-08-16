import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  Alert,
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  FormCheckbox,
  FormInput,
  FormMultiSelect,
  FormSelect,
  FormTextarea,
  getAvatarTone,
  getAvatarToneClassName,
  getInitials,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '.';

describe('team-ready primitives', () => {
  it('provides semantic Dashboard surfaces and feedback states', () => {
    render(
      <>
        <Card>Summary</Card>
        <Skeleton aria-label="Loading summary" />
        <Empty>No results</Empty>
        <Alert>Could not load</Alert>
      </>,
    );

    expect(screen.getByText('Summary')).toHaveAttribute('data-slot', 'card');
    expect(screen.getByText('Summary')).not.toHaveClass('shadow-surface');
    expect(document.querySelector('[data-slot="skeleton"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(screen.getByText('No results')).toHaveAttribute(
      'data-slot',
      'empty',
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load');
  });

  it('keeps the team-ready form controls labelled and described consistently', () => {
    render(
      <>
        <FormInput label="Title" required error="Enter a title." />
        <FormSelect label="Area / Squad" description="Choose one area.">
          <option value="">Choose an Area / Squad</option>
        </FormSelect>
        <FormTextarea label="Description" />
        <FormCheckbox label="Change status" />
      </>,
    );

    expect(screen.getByLabelText('Title *')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText('Title *')).toHaveAccessibleDescription(
      'Enter a title.',
    );
    expect(screen.getByLabelText('Area / Squad')).toHaveAccessibleDescription(
      'Choose one area.',
    );
    expect(screen.getByLabelText('Description')).toBeInstanceOf(
      HTMLTextAreaElement,
    );
    expect(
      screen.getByRole('checkbox', { name: 'Change status' }),
    ).toHaveAttribute('aria-checked', 'false');
  });

  it('supports an accessible interactive trailing input action', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <FormInput
        label="Password"
        trailingAction={
          <button type="button" onClick={onClick}>
            Show password
          </button>
        }
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('Password')).toBeVisible();
  });

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
        <Badge tone="brand">3</Badge>
        <Avatar aria-label="Ada Lovelace">
          <AvatarFallback>{getInitials('Ada Lovelace')}</AvatarFallback>
        </Avatar>
        <Separator />
      </>,
    );

    expect(screen.getByText('Ready')).toBeVisible();
    expect(screen.getByText('3')).toHaveClass('bg-primary');
    expect(screen.getByLabelText('Ada Lovelace')).toHaveTextContent('AL');
    expect(screen.getByLabelText('Ada Lovelace')).toHaveClass(
      'rounded-[var(--radius-element)]',
    );
    expect(getAvatarTone('00000000-0000-4000-8000-000000000001')).toBe(
      getAvatarTone('00000000-0000-4000-8000-000000000001'),
    );
    expect(
      getAvatarToneClassName('00000000-0000-4000-8000-000000000001'),
    ).toContain('color-avatar-');
    expect(getInitials('[SYNTHETIC] Manager + Admin')).toBe('MA');
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
    const menu = screen.getByRole('menu');
    expect(menu).toHaveClass('overflow-y-auto', 'overscroll-contain');
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledOnce();
    expect(trigger).toHaveFocus();
  });

  it('keeps long Select option lists touch and wheel scrollable', async () => {
    const user = userEvent.setup();
    render(
      <FormSelect label="Person">
        {Array.from({ length: 30 }, (_, index) => (
          <option key={index} value={`person-${index}`}>
            Person {index + 1}
          </option>
        ))}
      </FormSelect>,
    );

    await user.click(screen.getByRole('combobox', { name: 'Person' }));
    expect(document.querySelector('[role="listbox"]')).toHaveClass(
      'flex-1',
      'touch-pan-y',
      'overflow-y-scroll',
      'overscroll-contain',
      '[-webkit-overflow-scrolling:touch]',
    );
    expect(document.querySelector('[data-slot="select-content"]')).toHaveClass(
      'flex',
      'flex-col',
      'overflow-hidden',
    );
    expect(document.querySelector('[data-slot="select-content"]')).toHaveStyle({
      maxHeight: 'min(20rem, var(--available-height, calc(100dvh - 2rem)))',
    });
    const list = document.querySelector('[data-slot="select-list"]')!;
    Object.defineProperties(list, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 400 },
    });
    fireEvent.wheel(list, { deltaY: 72 });
    expect(list.scrollTop).toBe(72);
    expect(document.querySelectorAll('[data-direction]').length).toBe(0);
  });

  it('keeps a modal FormSelect popup inside its dialog scroll boundary', async () => {
    const user = userEvent.setup();
    render(
      <div role="dialog" aria-label="Create ticket">
        <FormSelect label="Area">
          <option value="area-1">Area 1</option>
          <option value="area-2">Area 2</option>
        </FormSelect>
      </div>,
    );

    await user.click(screen.getByRole('combobox', { name: 'Area' }));
    expect(
      document
        .querySelector('[data-slot="select-list"]')
        ?.closest('[role="dialog"]'),
    ).toBe(screen.getByRole('dialog', { name: 'Create ticket' }));
  });

  it('renders the selected FormSelect label instead of its stored value', () => {
    const areaOptions = (
      <>
        <option value="">Area: All</option>
        <option value="area-uuid">Area: Consumer App</option>
      </>
    );
    const { rerender } = render(
      <FormSelect label="Area" value="">
        {areaOptions}
      </FormSelect>,
    );
    rerender(
      <FormSelect label="Area" value="area-uuid">
        {areaOptions}
      </FormSelect>,
    );

    expect(screen.getByRole('combobox', { name: 'Area' })).toHaveTextContent(
      'Area: Consumer App',
    );
    expect(
      screen.getByRole('combobox', { name: 'Area' }),
    ).not.toHaveTextContent('area-uuid');
  });

  it('supports multiple selections in the shared dropdown field', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <FormMultiSelect
        label="Labels"
        value={[]}
        placeholder="All labels"
        onValueChange={onValueChange}
      >
        <option value="foundation">Foundation</option>
        <option value="mobile">Mobile</option>
      </FormMultiSelect>,
    );

    await user.click(screen.getByRole('combobox', { name: 'Labels' }));
    await user.click(screen.getByRole('option', { name: 'Mobile' }));
    expect(onValueChange).toHaveBeenCalledWith(['mobile']);
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

  it('activates Tabs with the standard arrow, Home, and End keys', async () => {
    const user = userEvent.setup();
    function Example() {
      const [value, setValue] = React.useState('one');
      return (
        <Tabs value={value} onValueChange={setValue}>
          <TabsList aria-label="Example sections">
            <TabsTrigger value="one">One</TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
            <TabsTrigger value="three">Three</TabsTrigger>
          </TabsList>
          <TabsContent value={value}>{value}</TabsContent>
        </Tabs>
      );
    }
    render(<Example />);

    screen.getByRole('tab', { name: 'One' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus();
  });

  it('presents an accessible no-shadow confirmation dialog', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Discard changes?</AlertDialogTitle>
          <AlertDialogDescription>
            Unsaved edits will be lost.
          </AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>,
    );

    expect(
      screen.getByRole('dialog', { name: 'Discard changes?' }),
    ).toHaveClass('shadow-none');
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
      'Unsaved edits will be lost.',
    );
  });

  it('keeps Table anatomy semantic inside a contained overflow region', () => {
    render(
      <Table aria-label="People">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Person</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByRole('table', { name: 'People' })).toBeVisible();
    expect(screen.getByRole('table').parentElement).toHaveClass(
      'overflow-x-auto',
    );
  });
});
