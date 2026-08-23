import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState } from 'react';

import {
  FormInput,
  type FormInputProps,
} from '../../ui/primitives/form-controls';
import { Button } from '../../ui/primitives/button';

export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<FormInputProps, 'trailingAction' | 'trailingIcon' | 'type'> & {
    showVisibilityToggle?: boolean;
    visible?: boolean;
    onVisibleChange?: (visible: boolean) => void;
    visibilityTargetLabel?: string;
  }
>(function PasswordInput(
  {
    showVisibilityToggle = true,
    visible: controlledVisible,
    onVisibleChange,
    visibilityTargetLabel = 'password',
    ...props
  },
  ref,
) {
  const [internalVisible, setInternalVisible] = useState(false);
  const visible = controlledVisible ?? internalVisible;
  const setVisible = (next: boolean) => {
    if (controlledVisible === undefined) setInternalVisible(next);
    onVisibleChange?.(next);
  };

  return (
    <FormInput
      {...props}
      ref={ref}
      type={visible ? 'text' : 'password'}
      className="pr-12"
      trailingAction={
        showVisibilityToggle ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 rounded-md border-0"
            aria-label={`${visible ? 'Hide' : 'Show'} ${visibilityTargetLabel}`}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
          </Button>
        ) : undefined
      }
    />
  );
});
