import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState } from 'react';

import {
  FormInput,
  type FormInputProps,
} from '../../ui/primitives/form-controls';
import { Button } from '../../ui/primitives/button';

export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<FormInputProps, 'trailingAction' | 'trailingIcon' | 'type'>
>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <FormInput
      {...props}
      ref={ref}
      type={visible ? 'text' : 'password'}
      className="pr-12"
      trailingAction={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 rounded-md border-0"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      }
    />
  );
});
