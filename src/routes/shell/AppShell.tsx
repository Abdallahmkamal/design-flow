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
import {
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type SVGProps,
} from 'react';
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
  getAvatarToneClassName,
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
import styles from './AppShell.module.css';
import {
  getShellCapabilities,
  getShellDestinations,
  type ShellDestination,
} from './shellPermissions';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

// Keep both properties inline: the production CSS optimizer otherwise removes
// the unprefixed declaration, which breaks blur on some Android compositors.
const mobileDockBackdropStyle: CSSProperties = {
  backdropFilter: 'var(--mobile-dock-backdrop-filter)',
  WebkitBackdropFilter: 'var(--mobile-dock-backdrop-filter)',
};

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
  accountId,
  displayName,
  isAdmin,
  isSigningOut,
  onSignOut,
  position,
  mobile = false,
}: {
  accountId: string;
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
          <Avatar
            className={cn(
              mobile ? 'size-10' : 'size-8',
              getAvatarToneClassName(accountId),
            )}
          >
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
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
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
              accountId={account.id}
              displayName={account.displayName}
              position={account.positionCode}
              isAdmin={account.isAdmin}
              isSigningOut={isSigningOut}
              onSignOut={handleSignOut}
            />
          </div>
        </header>

        <aside className="fixed top-6 left-6 z-30 hidden h-[33.125rem] max-h-[calc(100dvh-3rem)] w-[13.4375rem] flex-col overflow-hidden rounded-shell border-r border-border bg-card pr-px shadow-shell md:flex">
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
                accountId={account.id}
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
          className="min-h-[calc(100dvh-4rem)] min-w-0 bg-background p-4 pb-[calc(7rem+env(safe-area-inset-bottom))] md:min-h-dvh md:ml-[15.4375rem] md:p-10"
          id="main-content"
          tabIndex={-1}
        >
          <Outlet />
        </main>

        <div
          className={styles.mobileControls}
          data-menu-open={quickActionsOpen}
          data-testid="mobile-shell-controls"
        >
          <nav
            aria-label="Primary navigation"
            className={styles.mobileDock}
            style={mobileDockBackdropStyle}
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
            <Sheet open={quickActionsOpen} onOpenChange={setQuickActionsOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className={cn(styles.quickActionFab, styles.restingFab)}
                  aria-label="Open Quick Actions"
                >
                  <svg
                    className={styles.fabBorderTrace}
                    viewBox="0 0 66 66"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <defs>
                      <linearGradient
                        id="design-flow-mobile-fab-gradient"
                        x1="33"
                        y1="1"
                        x2="33"
                        y2="65"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop
                          offset="0"
                          stopColor="var(--color-action-accent-background)"
                        />
                        <stop
                          offset="1"
                          stopColor="var(--color-action-accent-gradient-deep)"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      className={styles.fabBorderTrack}
                      d="M33 1C50.6731 1 65 15.3269 65 33C65 50.6731 50.6731 65 33 65C15.3269 65 1 50.6731 1 33C1 15.3269 15.3269 1 33.0103 1.00103"
                    />
                    <path
                      className={styles.fabBorderProgress}
                      d="M33 1C50.6731 1 65 15.3269 65 33C65 50.6731 50.6731 65 33 65C15.3269 65 1 50.6731 1 33C1 15.3269 15.3269 1 33.0103 1.00103"
                      pathLength="1"
                    />
                  </svg>
                  <Plus className={styles.fabIcon} aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetPortal>
                <SheetOverlay
                  className={styles.quickActionsBackdrop}
                  data-testid="quick-actions-scrim"
                />
                <SheetPrimitiveContent
                  ref={quickActionsContentRef}
                  className={styles.quickActionsContent}
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
                  <div className={styles.quickActionGroup}>
                    {capabilities.canLogWork ? (
                      <SheetClose asChild>
                        <Button
                          className={cn(
                            styles.expandedAction,
                            styles.primaryExpandedAction,
                          )}
                          asChild
                        >
                          <NavLink to="/work-logs/new">Log Work</NavLink>
                        </Button>
                      </SheetClose>
                    ) : null}
                    {capabilities.canCreateTicket ? (
                      <SheetClose asChild>
                        <Button
                          className={cn(
                            styles.expandedAction,
                            styles.secondaryExpandedAction,
                          )}
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
                      className={cn(styles.quickActionFab, styles.closeFab)}
                      aria-label="Close Quick Actions"
                    >
                      <X className={styles.fabIcon} aria-hidden="true" />
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
