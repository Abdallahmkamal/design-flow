import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  ChartNoAxesCombined,
  ChevronDown,
  House,
  ListChecks,
  LogOut,
  Moon,
  Plus,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { useRef, useState, type ComponentType, type SVGProps } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { useAuthentication } from '../../features/auth/authContext';
import { getNotificationUnreadCount } from '../../features/notifications/notificationsApi';
import { getPublicEnvironment } from '../../shared/config/env';
import { useTheme } from '../../shared/theme/themeContext';
import designFlowMark from '../../assets/design-flow-mark.svg';
import { SkipLink } from '../../ui/SkipLink/SkipLink';
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  getInitials,
  Separator,
  Sheet,
  SheetClose,
  SheetDescription,
  SheetOverlay,
  SheetPortal,
  SheetPrimitiveContent,
  SheetTitle,
  SheetTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/primitives';
import { cn } from '../../ui/lib/cn';
import {
  getShellCapabilities,
  getShellDestinations,
  type ShellDestination,
} from './shellPermissions';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const destinationDefinitions: Record<
  ShellDestination,
  { label: string; to: string; icon: Icon }
> = {
  dashboard: { label: 'Dashboard', to: '/', icon: House },
  'work-items': { label: 'Work Items', to: '/work-items', icon: ListChecks },
  reports: { label: 'Reports', to: '/reports', icon: ChartNoAxesCombined },
  settings: { label: 'Settings', to: '/settings', icon: Settings },
};

function positionLabel(positionCode: string) {
  return positionCode.charAt(0).toUpperCase() + positionCode.slice(1);
}

function Brand({ mobile = false }: { mobile?: boolean }) {
  return (
    <NavLink
      className="inline-flex min-w-0 items-center gap-2 rounded-md text-foreground! no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      to="/"
      aria-label="Design Flow home"
    >
      <span
        className={cn(
          'grid shrink-0 place-items-center',
          mobile ? 'size-10' : 'size-6',
        )}
      >
        <img
          alt=""
          aria-hidden="true"
          className={cn(
            'block',
            mobile ? 'h-10 w-[1.375rem]' : 'h-6 w-[0.8125rem]',
          )}
          src={designFlowMark}
        />
      </span>
    </NavLink>
  );
}

function ThemeControl({ mobile = false }: { mobile?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const label = isLight ? 'Switch to dark mode' : 'Switch to light mode';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={mobile ? 'size-10' : 'size-8'}
          onClick={toggleTheme}
          aria-label={label}
        >
          {isLight ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function NotificationControl({
  mobile = false,
  unread,
  pending,
}: {
  mobile?: boolean;
  unread: number | undefined;
  pending: boolean;
}) {
  const label = pending
    ? 'Notifications, loading unread count'
    : unread
      ? `Notifications, ${unread} unread`
      : 'Notifications';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={mobile ? 'size-10' : 'size-8'}
          asChild
        >
          <NavLink to="/notifications" aria-label={label}>
            <Bell aria-hidden="true" />
            {unread ? (
              <Badge
                tone="info"
                className="absolute -top-1 -right-1 min-h-4 min-w-4 justify-center px-1 text-[10px]"
                aria-hidden="true"
              >
                {unread > 99 ? '99+' : unread}
              </Badge>
            ) : null}
          </NavLink>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function ProfileMenu({
  displayName,
  isAdmin,
  isSigningOut,
  onSignOut,
  position,
  mobile = false,
}: {
  displayName: string;
  isAdmin: boolean;
  isSigningOut: boolean;
  onSignOut: () => void;
  position: string;
  mobile?: boolean;
}) {
  const role = `${positionLabel(position)}${isAdmin ? ', Admin' : ''}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={mobile ? 'icon' : 'default'}
          className={cn(
            mobile
              ? 'size-10 rounded-xl p-0'
              : 'h-14 w-full justify-start gap-2 rounded-xl px-3 text-left',
          )}
          aria-label={`Open profile menu for ${displayName}`}
        >
          <Avatar className={mobile ? 'size-10' : 'size-8'}>
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          {!mobile ? (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {displayName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {role.replace(', ', ' · ')}
                </span>
              </span>
              <ChevronDown className="size-4" aria-hidden="true" />
            </>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="grid gap-1">
          <span className="truncate text-sm text-foreground">
            {displayName}
          </span>
          <span>{role}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isSigningOut} onSelect={onSignOut}>
          <LogOut aria-hidden="true" />
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DestinationLink({
  destination,
  mobile = false,
}: {
  destination: (typeof destinationDefinitions)[ShellDestination];
  mobile?: boolean;
}) {
  const Icon = destination.icon;
  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          'relative font-sans text-muted-foreground no-underline outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          mobile
            ? 'flex h-[3.3125rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-xs'
            : 'flex h-10 items-center gap-2 rounded-xl px-3 text-base before:absolute before:left-0 before:h-5 before:w-1 before:rounded-r-full before:bg-transparent',
          isActive
            ? mobile
              ? 'text-foreground!'
              : 'bg-muted text-foreground! before:bg-primary'
            : 'text-muted-foreground! hover:bg-accent hover:text-foreground!',
        )
      }
      end={destination.to === '/'}
      to={destination.to}
    >
      <Icon
        aria-hidden="true"
        className={cn('shrink-0', mobile ? 'size-6' : 'size-[1.125rem]')}
      />
      <span>{destination.label}</span>
    </NavLink>
  );
}

export function AppShell() {
  const { account, signOut } = useAuthentication();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const quickActionsContentRef = useRef<HTMLDivElement>(null);
  const appEnvironment = getPublicEnvironment().VITE_APP_ENV;
  const unread = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: getNotificationUnreadCount,
  });

  if (!account) return null;

  const capabilities = getShellCapabilities(account);
  const destinations = getShellDestinations(account).map(
    (destination) => destinationDefinitions[destination],
  );
  const environmentNotice =
    appEnvironment === 'production'
      ? 'Production environment'
      : `Synthetic ${appEnvironment} environment`;

  const handleSignOut = () => {
    setSignOutError(null);
    setIsSigningOut(true);
    void signOut()
      .catch(() => {
        setSignOutError(
          'Design Flow could not sign you out. Keep this page open and try again.',
        );
      })
      .finally(() => setIsSigningOut(false));
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-dvh bg-card text-foreground md:bg-background">
        <SkipLink href="#main-content" />

        <header className="flex h-16 items-center justify-between gap-2 rounded-xl bg-card px-3 md:hidden">
          <Brand mobile />
          <div className="flex items-center gap-2">
            <ThemeControl mobile />
            <NotificationControl
              mobile
              unread={unread.data}
              pending={unread.isPending}
            />
            <ProfileMenu
              mobile
              displayName={account.displayName}
              position={account.positionCode}
              isAdmin={account.isAdmin}
              isSigningOut={isSigningOut}
              onSignOut={handleSignOut}
            />
          </div>
        </header>

        <aside className="fixed top-4 left-4 z-30 hidden h-[33.125rem] max-h-[calc(100dvh-2rem)] w-[13.4375rem] flex-col overflow-hidden rounded-shell border-r border-border bg-card pr-px shadow-shell md:flex">
          <div className="flex h-14 items-center gap-0 px-3">
            <Brand />
            <div className="ml-auto flex items-center">
              <ThemeControl />
              <NotificationControl
                unread={unread.data}
                pending={unread.isPending}
              />
            </div>
          </div>

          <Separator className="mx-3 w-auto" />

          <div className="flex min-h-0 flex-1 flex-col px-3 pt-3 pb-3">
            <nav aria-label="Primary navigation" className="grid gap-1">
              {destinations.map((destination) => (
                <DestinationLink
                  key={destination.to}
                  destination={destination}
                />
              ))}
            </nav>

            {capabilities.canLogWork || capabilities.canCreateTicket ? (
              <div className="mt-4 grid gap-2" aria-label="Quick actions">
                {capabilities.canLogWork ? (
                  <Button
                    className="h-8 w-full text-sm font-semibold no-underline"
                    size="sm"
                    asChild
                  >
                    <NavLink to="/work-logs/new">Log Work</NavLink>
                  </Button>
                ) : null}
                {capabilities.canCreateTicket ? (
                  <Button
                    className="h-8 w-full text-sm font-semibold no-underline"
                    variant="secondary"
                    size="sm"
                    asChild
                  >
                    <NavLink to="/work-items/new">Create Ticket</NavLink>
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="mt-auto">
              <Separator className="mb-2" />
              {signOutError ? (
                <p
                  className="m-0 mb-2 text-xs text-error-foreground"
                  role="alert"
                >
                  {signOutError}
                </p>
              ) : null}
              <ProfileMenu
                displayName={account.displayName}
                position={account.positionCode}
                isAdmin={account.isAdmin}
                isSigningOut={isSigningOut}
                onSignOut={handleSignOut}
              />
            </div>
            <p className="sr-only">{environmentNotice}</p>
          </div>
        </aside>

        <main
          className="mt-3 min-h-[calc(100dvh-4.75rem)] min-w-0 bg-background p-4 pb-[calc(7rem+env(safe-area-inset-bottom))] md:mt-0 md:min-h-dvh md:ml-[15.4375rem] md:p-10"
          id="main-content"
          tabIndex={-1}
        >
          <Outlet />
        </main>

        <div className="fixed inset-x-0 bottom-0 z-40 flex min-h-[5.9375rem] items-start gap-4 bg-card px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:hidden">
          <nav
            aria-label="Primary navigation"
            className="flex h-[3.8125rem] min-w-0 flex-1 items-center rounded-full bg-card p-1 shadow-shell"
          >
            {destinations.map((destination) => (
              <DestinationLink
                key={destination.to}
                destination={destination}
                mobile
              />
            ))}
          </nav>
          {capabilities.canLogWork || capabilities.canCreateTicket ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  className="size-[3.8125rem] rounded-full shadow-shell [&_svg]:size-8"
                  aria-label="Open Quick Actions"
                >
                  <Plus className="size-8" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetPortal>
                <SheetOverlay
                  className="z-40 bg-black/30"
                  data-testid="quick-actions-scrim"
                />
                <SheetPrimitiveContent
                  ref={quickActionsContentRef}
                  className="pointer-events-none fixed inset-0 z-50 outline-none"
                  tabIndex={-1}
                  onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    quickActionsContentRef.current?.focus();
                  }}
                >
                  <SheetTitle className="sr-only">Quick Actions</SheetTitle>
                  <SheetDescription className="sr-only">
                    Start a permitted Design Flow action.
                  </SheetDescription>
                  <div className="pointer-events-auto fixed inset-x-3 bottom-[calc(6.75rem+env(safe-area-inset-bottom))] grid gap-4">
                    {capabilities.canLogWork ? (
                      <SheetClose asChild>
                        <Button
                          className="h-16 w-full rounded-2xl text-base font-semibold no-underline"
                          asChild
                        >
                          <NavLink to="/work-logs/new">Log Work</NavLink>
                        </Button>
                      </SheetClose>
                    ) : null}
                    {capabilities.canCreateTicket ? (
                      <SheetClose asChild>
                        <Button
                          className="h-16 w-full rounded-2xl bg-card text-base font-semibold no-underline"
                          variant="secondary"
                          asChild
                        >
                          <NavLink to="/work-items/new">Create Ticket</NavLink>
                        </Button>
                      </SheetClose>
                    ) : null}
                  </div>
                  <SheetClose asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="pointer-events-auto fixed right-4 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] size-[3.8125rem] rounded-full bg-card shadow-shell [&_svg]:size-8"
                      aria-label="Close Quick Actions"
                    >
                      <X className="size-8" aria-hidden="true" />
                    </Button>
                  </SheetClose>
                </SheetPrimitiveContent>
              </SheetPortal>
            </Sheet>
          ) : null}
        </div>
      </div>
    </TooltipProvider>
  );
}
