import {
  Children,
  forwardRef,
  isValidElement,
  useState,
  useId,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { format, isValid, parseISO } from 'date-fns';
import { CalendarDays, Check } from 'lucide-react';

import { cn } from '../lib/cn';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface FieldChromeProps {
  label: string;
  description?: string | undefined;
  error?: string | undefined;
  hideLabel?: boolean | undefined;
  required?: boolean | undefined;
  id?: string | undefined;
}

const fieldClass = 'grid min-w-0 gap-1';
const labelClass = 'font-sans text-base font-medium leading-[1.15rem]';
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
  extends InputHTMLAttributes<HTMLInputElement>, FieldChromeProps {
  trailingIcon?: ReactNode | undefined;
}

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
      trailingIcon,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    const descriptionId = description ? `${controlId}-description` : undefined;
    const errorId = error ? `${controlId}-error` : undefined;
    const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');
    const hasTrailingIcon = trailingIcon != null ? true : props.type === 'date';

    return (
      <div className={fieldClass}>
        <FieldLabel
          hideLabel={hideLabel}
          id={controlId}
          label={label}
          required={required}
        />
        <div className="relative min-w-0">
          <input
            {...props}
            ref={ref}
            id={controlId}
            required={required}
            aria-describedby={describedBy || undefined}
            aria-invalid={error ? true : undefined}
            className={cn(
              controlClass,
              'h-12',
              hasTrailingIcon &&
                'pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0',
              className,
            )}
          />
          {hasTrailingIcon ? (
            <span
              className="pointer-events-none absolute top-1/2 right-3 flex size-5 -translate-y-1/2 items-center justify-center text-foreground [&_svg]:size-[1.125rem]"
              aria-hidden="true"
            >
              {trailingIcon ?? <CalendarDays />}
            </span>
          ) : null}
        </div>
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

interface FormSelectOptionProps {
  value?: string;
  disabled?: boolean;
  children?: ReactNode;
}

export interface FormSelectProps extends FieldChromeProps {
  children: ReactNode;
  value?: string | undefined;
  name?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  'aria-label'?: string | undefined;
  onChange?: ((event: ChangeEvent<HTMLSelectElement>) => void) | undefined;
}

/** Team-ready shadcn select, backed by Base UI and Figma field geometry. */
export const FormSelect = forwardRef<HTMLButtonElement, FormSelectProps>(
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
      name,
      value = '',
      disabled,
      onChange,
      'aria-label': ariaLabel,
    },
    ref,
  ) {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    const descriptionId = description ? `${controlId}-description` : undefined;
    const errorId = error ? `${controlId}-error` : undefined;
    const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');

    const parsedOptions = Children.toArray(children).flatMap((child) => {
      if (!isValidElement<FormSelectOptionProps>(child)) return [];
      const option = child;
      return [
        {
          value: option.props.value ?? '',
          label: option.props.children,
          disabled: option.props.disabled ?? false,
        },
      ];
    });
    const placeholder = parsedOptions.find((option) => option.value === '');
    const selectableOptions = parsedOptions.filter(
      (option) => option.value !== '',
    );
    const items = selectableOptions.map((option) => ({
      value: option.value,
      label:
        typeof option.label === 'string' ? option.label : String(option.value),
    }));

    const handleValueChange = (next: string | null) => {
      const nextValue = next ?? '';
      onChange?.({
        target: { value: nextValue },
        currentTarget: { value: nextValue },
      } as ChangeEvent<HTMLSelectElement>);
    };

    return (
      <div className={fieldClass}>
        <FieldLabel
          hideLabel={hideLabel}
          id={controlId}
          label={label}
          required={required}
        />
        <Select
          items={items}
          modal={false}
          name={name}
          value={value || null}
          disabled={disabled}
          required={required}
          onValueChange={handleValueChange}
        >
          <SelectTrigger
            ref={ref}
            id={controlId}
            aria-label={ariaLabel}
            aria-describedby={describedBy || undefined}
            aria-invalid={error ? true : undefined}
            className={className}
          >
            <SelectValue
              placeholder={placeholder?.label ?? 'Select an option'}
            />
          </SelectTrigger>
          <SelectContent>
            {selectableOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

export interface FormDatePickerProps
  extends
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'defaultValue' | 'onChange' | 'type' | 'value'
    >,
    FieldChromeProps {
  value?: string | undefined;
  onChange?: ((event: ChangeEvent<HTMLInputElement>) => void) | undefined;
}

/** shadcn date picker composition: Base UI popover + React DayPicker. */
export const FormDatePicker = forwardRef<
  HTMLButtonElement,
  FormDatePickerProps
>(function FormDatePicker(
  {
    className,
    description,
    disabled,
    error,
    hideLabel = false,
    id,
    label,
    max,
    min,
    name,
    onChange,
    required,
    value = '',
    'aria-label': ariaLabel,
  },
  ref,
) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');
  const [open, setOpen] = useState(false);
  const parsedValue = value ? parseISO(value) : undefined;
  const selected =
    parsedValue && isValid(parsedValue) ? parsedValue : undefined;
  const minDate = typeof min === 'string' && min ? parseISO(min) : undefined;
  const maxDate = typeof max === 'string' && max ? parseISO(max) : undefined;

  const selectDate = (date: Date | undefined) => {
    if (!date) return;
    const nextValue = format(date, 'yyyy-MM-dd');
    onChange?.({
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as ChangeEvent<HTMLInputElement>);
    setOpen(false);
  };

  return (
    <div className={fieldClass}>
      <FieldLabel
        hideLabel={hideLabel}
        id={controlId}
        label={label}
        required={required}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          ref={ref}
          id={controlId}
          render={<button type="button" />}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            controlClass,
            'flex h-12 items-center justify-between gap-2 text-left data-[empty=true]:text-muted-foreground',
            className,
          )}
          data-empty={!selected}
        >
          <span>
            {selected ? format(selected, 'MM/dd/yyyy') : 'Select date'}
          </span>
          <CalendarDays
            className="size-[1.125rem] shrink-0"
            aria-hidden="true"
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={selectDate}
            disabled={[
              ...(minDate && isValid(minDate) ? [{ before: minDate }] : []),
              ...(maxDate && isValid(maxDate) ? [{ after: maxDate }] : []),
            ]}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <FieldMessages
        description={description}
        descriptionId={descriptionId}
        error={error}
        errorId={errorId}
      />
    </div>
  );
});

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

export interface FormCheckboxProps {
  label: string;
  size?: 'default' | 'sm' | undefined;
  id?: string | undefined;
  name?: string | undefined;
  className?: string | undefined;
  checked?: boolean | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  onChange?: ((event: ChangeEvent<HTMLInputElement>) => void) | undefined;
}

/** Team-ready shadcn checkbox backed by Base UI. */
export const FormCheckbox = forwardRef<HTMLButtonElement, FormCheckboxProps>(
  function FormCheckbox(
    {
      checked,
      className,
      disabled,
      id,
      label,
      name,
      onChange,
      required,
      size = 'default',
    },
    ref,
  ) {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    return (
      <label
        className={cn(
          'inline-flex min-w-0 cursor-pointer items-start gap-2 font-sans text-sm text-foreground',
          className,
        )}
        htmlFor={controlId}
      >
        <CheckboxPrimitive.Root
          ref={ref}
          id={controlId}
          name={name}
          checked={checked}
          disabled={disabled}
          required={required}
          onCheckedChange={(next) =>
            onChange?.({
              target: { checked: next },
              currentTarget: { checked: next },
            } as ChangeEvent<HTMLInputElement>)
          }
          className={cn(
            'box-border mt-px flex shrink-0 items-center justify-center rounded-sm border border-input bg-background text-transparent outline-none transition-[border-color,background-color,color,box-shadow] data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 [&_svg]:size-3.5',
            size === 'sm' ? 'size-4' : 'size-5',
          )}
        >
          <CheckboxPrimitive.Indicator>
            <Check strokeWidth={3} />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        <span className="min-w-0 leading-[1.15rem]">{label}</span>
      </label>
    );
  },
);
