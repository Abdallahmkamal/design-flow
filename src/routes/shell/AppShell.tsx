import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  ChartNoAxesCombined,
  Clock3,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Moon,
  Plus,
  Settings,
  Sun,
  TicketPlus,
} from 'lucide-react';
import { useState, type ComponentType, type SVGProps } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { useAuthentication } from '../../features/auth/authContext';
import { getNotificationUnreadCount } from '../../features/notifications/notificationsApi';
import { getPublicEnvironment } from '../../shared/config/env';
import { useTheme } from '../../shared/theme/themeContext';
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
  SheetContent,
  SheetDescription,
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
  dashboard: { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  'work-items': { label: 'Work Items', to: '/work-items', icon: ListTodo },
  reports: { label: 'Reports', to: '/reports', icon: ChartNoAxesCombined },
  settings: { label: 'Settings', to: '/settings', icon: Settings },
};

function positionLabel(positionCode: string) {
  return positionCode.charAt(0).toUpperCase() + positionCode.slice(1);
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <NavLink
      className="inline-flex min-w-0 items-center gap-2 rounded-md text-foreground! no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      to="/"
      aria-label="Design Flow home"
    >
      <span
        className="grid size-9 shrink-0 place-items-center rounded-full bg-primary font-sans text-xs font-semibold text-primary-foreground"
        aria-hidden="true"
      >
        DF
      </span>
      {!compact ? (
        <span className="truncate font-sans text-lg font-semibold">
          Design Flow
        </span>
      ) : null}
    </NavLink>
  );
}

function ThemeControl() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const label = isLight ? 'Switch to dark mode' : 'Switch to light mode';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
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
  unread,
  pending,
}: {
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
        <Button variant="ghost" size="icon" asChild>
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
}: {
  displayName: string;
  isAdmin: boolean;
  isSigningOut: boolean;
  onSignOut: () => void;
  position: string;
}) {
  const role = `${positionLabel(position)}${isAdmin ? ', Admin' : ''}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Open profile menu for ${displayName}`}
        >
          <Avatar className="size-9">
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
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
          'rounded-md font-sans text-sm font-medium text-muted-foreground no-underline outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          mobile
            ? 'flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[11px]'
            : 'flex min-h-10 items-center gap-3 px-3',
          isActive
            ? 'bg-secondary text-foreground!'
            : 'text-muted-foreground! hover:bg-accent hover:text-foreground!',
        )
      }
      end={destination.to === '/'}
      to={destination.to}
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      <span>{destination.label}</span>
    </NavLink>
  );
}

export function AppShell() {
  const { account, signOut } = useAuthentication();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
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

  const profileMenu = (
    <ProfileMenu
      displayName={account.displayName}
      position={account.positionCode}
      isAdmin={account.isAdmin}
      isSigningOut={isSigningOut}
      onSignOut={handleSignOut}
    />
  );
  const notificationControl = (
    <NotificationControl unread={unread.data} pending={unread.isPending} />
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-dvh bg-background text-foreground">
        <SkipLink href="#main-content" />

        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border bg-popover px-4 md:hidden">
          <Brand />
          <div className="flex items-center gap-1">
            <ThemeControl />
            {notificationControl}
            {profileMenu}
          </div>
        </header>

        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17.5rem] flex-col border-r border-border bg-popover p-4 md:flex">
          <Brand />

          {capabilities.canLogWork || capabilities.canCreateTicket ? (
            <div className="mt-7 grid gap-2" aria-label="Quick actions">
              {capabilities.canLogWork ? (
                <Button className="w-full justify-start" asChild>
                  <NavLink to="/work-logs/new">
                    <Clock3 aria-hidden="true" />
                    Log Work
                  </NavLink>
                </Button>
              ) : null}
              {capabilities.canCreateTicket ? (
                <Button
                  className="w-full justify-start"
                  variant="secondary"
                  asChild
                >
                  <NavLink to="/work-items/new">
                    <TicketPlus aria-hidden="true" />
                    Create Ticket
                  </NavLink>
                </Button>
              ) : null}
            </div>
          ) : null}

          <Separator className="my-5" />
          <nav aria-label="Primary navigation" className="grid gap-1">
            {destinations.map((destination) => (
              <DestinationLink key={destination.to} destination={destination} />
            ))}
          </nav>

          <div className="mt-auto grid gap-3 pt-5">
            <p className="m-0 font-sans text-xs text-muted-foreground">
              {environmentNotice}
            </p>
            {signOutError ? (
              <p className="m-0 text-xs text-error-foreground" role="alert">
                {signOutError}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <ThemeControl />
                {notificationControl}
              </div>
              {profileMenu}
            </div>
            <div className="min-w-0">
              <p className="m-0 truncate font-sans text-sm font-medium">
                {account.displayName}
              </p>
              <p className="m-0 font-sans text-xs text-muted-foreground">
                {positionLabel(account.positionCode)}
                {account.isAdmin ? ' · Admin' : ''}
              </p>
            </div>
          </div>
        </aside>

        <main
          className="min-h-[calc(100dvh-4rem)] min-w-0 bg-background p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:min-h-dvh md:pl-[calc(17.5rem+1.5rem)] md:pt-6 md:pr-6 md:pb-6"
          id="main-content"
          tabIndex={-1}
        >
          <Outlet />
        </main>

        <nav
          aria-label="Primary navigation"
          className="fixed inset-x-0 bottom-0 z-40 grid min-h-16 grid-flow-col auto-cols-fr items-end border-t border-border bg-popover px-2 pt-1 pb-[env(safe-area-inset-bottom)] shadow-overlay md:hidden"
        >
          {destinations.map((destination) => (
            <DestinationLink
              key={destination.to}
              destination={destination}
              mobile
            />
          ))}
          {capabilities.canLogWork || capabilities.canCreateTicket ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  className="mx-auto mb-2 size-12 rounded-full shadow-popover"
                  aria-label="Open Quick Actions"
                >
                  <Plus className="size-6" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom">
                <SheetTitle>Quick Actions</SheetTitle>
                <SheetDescription>
                  Start a permitted Design Flow action.
                </SheetDescription>
                <div className="mt-5 grid gap-3">
                  {capabilities.canLogWork ? (
                    <Button className="w-full justify-start" asChild>
                      <NavLink to="/work-logs/new">
                        <Clock3 aria-hidden="true" />
                        Log Work
                      </NavLink>
                    </Button>
                  ) : null}
                  {capabilities.canCreateTicket ? (
                    <Button
                      className="w-full justify-start"
                      variant="secondary"
                      asChild
                    >
                      <NavLink to="/work-items/new">
                        <TicketPlus aria-hidden="true" />
                        Create Ticket
                      </NavLink>
                    </Button>
                  ) : null}
                </div>
              </SheetContent>
            </Sheet>
          ) : null}
        </nav>
      </div>
    </TooltipProvider>
  );
}
