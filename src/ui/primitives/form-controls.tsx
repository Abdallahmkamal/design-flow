import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

import { cn } from '../lib/cn';

interface FieldChromeProps {
  label: string;
  description?: string | undefined;
  error?: string | undefined;
  hideLabel?: boolean | undefined;
  required?: boolean | undefined;
  id?: string | undefined;
}

const fieldClass = 'grid min-w-0 gap-1';
const labelClass = 'font-sans text-sm font-medium leading-[1.00625rem]';
const controlClass =
  'box-border w-full rounded-md border border-input bg-background px-3 font-sans text-base text-foreground outline-none transition-[border-color,box-shadow,opacity] duration-175 placeholder:text-muted-foreground hover:not-disabled:border-foreground/45 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20';

function FieldMessages({
  description,
  descriptionId,
  error,
  errorId,
}: {
  description?: string | undefined;
  descriptionId?: string | undefined;
  error?: string | undefined;
  errorId?: string | undefined;
}) {
  return (
    <>
      {description ? (
        <p
          id={descriptionId}
          className="m-0 font-sans text-xs text-muted-foreground"
        >
          {description}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="m-0 font-sans text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </>
  );
}

function FieldLabel({
  hideLabel,
  id,
  label,
  required,
}: Pick<FieldChromeProps, 'hideLabel' | 'id' | 'label' | 'required'>) {
  return (
    <label className={hideLabel ? 'sr-only' : labelClass} htmlFor={id}>
      {label}
      {required && !hideLabel ? (
        <span className="text-destructive" aria-hidden="true">
          {' '}
          *
        </span>
      ) : null}
    </label>
  );
}

export interface FormInputProps
  extends InputHTMLAttributes<HTMLInputElement>, FieldChromeProps {}

/** Team-ready shadcn-style input with the approved Figma field anatomy. */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput(
    {
      className,
      description,
      error,
      hideLabel = false,
      id,
      label,
      required,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    const descriptionId = description ? `${controlId}-description` : undefined;
    const errorId = error ? `${controlId}-error` : undefined;
    const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');

    return (
      <div className={fieldClass}>
        <FieldLabel
          hideLabel={hideLabel}
          id={controlId}
          label={label}
          required={required}
        />
        <input
          {...props}
          ref={ref}
          id={controlId}
          required={required}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          className={cn(controlClass, 'h-12', className)}
        />
        <FieldMessages
          description={description}
          descriptionId={descriptionId}
          error={error}
          errorId={errorId}
        />
      </div>
    );
  },
);

export interface FormSelectProps
  extends SelectHTMLAttributes<HTMLSelectElement>, FieldChromeProps {}

/** Team-ready native select with consistent shadcn/Figma field geometry. */
export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  function FormSelect(
    {
      children,
      className,
      description,
      error,
      hideLabel = false,
      id,
      label,
      required,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    const descriptionId = description ? `${controlId}-description` : undefined;
    const errorId = error ? `${controlId}-error` : undefined;
    const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');

    return (
      <div className={fieldClass}>
        <FieldLabel
          hideLabel={hideLabel}
          id={controlId}
          label={label}
          required={required}
        />
        <select
          {...props}
          ref={ref}
          id={controlId}
          required={required}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          className={cn(controlClass, 'h-12 pr-10', className)}
        >
          {children}
        </select>
        <FieldMessages
          description={description}
          descriptionId={descriptionId}
          error={error}
          errorId={errorId}
        />
      </div>
    );
  },
);

export interface FormTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldChromeProps {}

/** Team-ready textarea sharing the same label, border, and state system. */
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea(
    {
      className,
      description,
      error,
      hideLabel = false,
      id,
      label,
      required,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    const descriptionId = description ? `${controlId}-description` : undefined;
    const errorId = error ? `${controlId}-error` : undefined;
    const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');

    return (
      <div className={fieldClass}>
        <FieldLabel
          hideLabel={hideLabel}
          id={controlId}
          label={label}
          required={required}
        />
        <textarea
          {...props}
          ref={ref}
          id={controlId}
          required={required}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            controlClass,
            'min-h-28 resize-y py-3 leading-[1.15rem]',
            className,
          )}
        />
        <FieldMessages
          description={description}
          descriptionId={descriptionId}
          error={error}
          errorId={errorId}
        />
      </div>
    );
  },
);
