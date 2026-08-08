import { ArrowLeft, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Button } from '../primitives/button';
import {
  Sheet,
  SheetDescription,
  SheetOverlay,
  SheetPortal,
  SheetPrimitiveContent,
  SheetTitle,
} from '../primitives/sheet';
import { cn } from '../lib/cn';

export interface WorkflowOverlayProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  isDirty?: boolean;
  isBusy?: boolean;
  onDismiss: () => void;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

/** Route-backed substantial-form overlay; product features own all domain state. */
export function WorkflowOverlay({
  backLabel = 'Back',
  children,
  className,
  description,
  footer,
  isBusy = false,
  isDirty = false,
  onBack,
  onDismiss,
  title,
}: WorkflowOverlayProps) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const requestDismiss = () => {
    if (isBusy) return;
    if (isDirty) setConfirmDiscard(true);
    else onDismiss();
  };

  return (
    <Sheet open modal onOpenChange={(open) => !open && requestDismiss()}>
      <SheetPortal>
        <SheetOverlay
          className="z-[60] bg-black/48"
          data-testid="workflow-backdrop"
        />
        <SheetPrimitiveContent
          className={cn(
            'fixed inset-0 z-[70] grid min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden bg-background text-foreground outline-none md:inset-y-6 md:right-6 md:left-auto md:w-[37.5rem] md:rounded-3xl md:shadow-overlay',
            className,
          )}
          aria-describedby="workflow-description"
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            if (confirmDiscard) setConfirmDiscard(false);
            else requestDismiss();
          }}
          onPointerDownOutside={(event) => {
            event.preventDefault();
            requestDismiss();
          }}
        >
          <header className="flex min-w-0 items-start justify-between gap-4 border-b border-border px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-5 md:pt-6">
            <div className="flex min-w-0 items-start gap-2">
              {onBack ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-0.5 shrink-0"
                  aria-label={backLabel}
                  onClick={onBack}
                  disabled={isBusy}
                >
                  <ArrowLeft aria-hidden="true" />
                </Button>
              ) : null}
              <div className="min-w-0">
                <SheetTitle className="text-[2rem] leading-[2.3rem] font-semibold break-words">
                  {title}
                </SheetTitle>
                <SheetDescription id="workflow-description" className="sr-only">
                  {description}
                </SheetDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 shrink-0"
              aria-label={`Close ${title}`}
              onClick={requestDismiss}
              disabled={isBusy}
            >
              <X className="size-6" aria-hidden="true" />
            </Button>
          </header>
          <div className="min-h-0 overflow-x-hidden overflow-y-auto px-6 py-6">
            {confirmDiscard ? (
              <section
                className="grid gap-4 rounded-xl border border-warning bg-warning/10 p-4"
                role="alertdialog"
                aria-labelledby="discard-title"
                aria-describedby="discard-description"
              >
                <h2 id="discard-title" className="m-0 text-lg font-semibold">
                  Discard this draft?
                </h2>
                <p
                  id="discard-description"
                  className="m-0 text-sm text-muted-foreground"
                >
                  Your unsaved changes will be lost.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onDismiss}
                  >
                    Discard draft
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setConfirmDiscard(false)}
                    autoFocus
                  >
                    Keep editing
                  </Button>
                </div>
              </section>
            ) : (
              children
            )}
          </div>
          <footer className="border-t border-border bg-background px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        </SheetPrimitiveContent>
      </SheetPortal>
    </Sheet>
  );
}
