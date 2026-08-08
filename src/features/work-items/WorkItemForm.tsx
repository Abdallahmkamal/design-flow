import { useState, type FormEvent } from 'react';

import { Button } from '../../ui/Button/Button';
import { Checkbox } from '../../ui/Checkbox/Checkbox';
import { Input } from '../../ui/Input/Input';
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from '../../ui/primitives/form-controls';
import { Select } from '../../ui/Select/Select';
import { Textarea } from '../../ui/Textarea/Textarea';
import type { WorkItemFormValues, WorkItemOptions } from './workItemTypes';
import styles from './WorkItems.module.css';

const emptyValues: WorkItemFormValues = {
  title: '',
  description: '',
  areaId: '',
  assigneeId: '',
  plannedStartDate: '',
  dueDate: '',
  figmaUrl: '',
  labelIds: [],
};

export interface WorkItemFormProps {
  options: WorkItemOptions;
  initialValues?: WorkItemFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  serverError?: string | undefined;
  showCreationStatus?: boolean;
  includeAssignee?: boolean;
  onSubmit: (values: WorkItemFormValues) => void;
  onValuesChange?: (values: WorkItemFormValues) => void;
  formId?: string;
  hideSubmitButton?: boolean;
  teamReadyControls?: boolean;
}

export function WorkItemForm({
  initialValues = emptyValues,
  formId,
  hideSubmitButton = false,
  includeAssignee = true,
  isSubmitting,
  onSubmit,
  onValuesChange,
  options,
  serverError,
  showCreationStatus = true,
  submitLabel,
  teamReadyControls = false,
}: WorkItemFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const InputControl = teamReadyControls ? FormInput : Input;
  const SelectControl = teamReadyControls ? FormSelect : Select;
  const TextareaControl = teamReadyControls ? FormTextarea : Textarea;
  const update = (name: keyof WorkItemFormValues, value: string | string[]) =>
    setValues((current) => {
      const next = { ...current, [name]: value };
      onValuesChange?.(next);
      return next;
    });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!values.title.trim()) nextErrors.title = 'Enter a title.';
    if (!values.areaId) nextErrors.areaId = 'Choose an Area or Squad.';
    if (values.figmaUrl) {
      try {
        const url = new URL(values.figmaUrl);
        if (
          url.protocol !== 'https:' ||
          !(url.hostname === 'figma.com' || url.hostname.endsWith('.figma.com'))
        )
          nextErrors.figmaUrl = 'Use an HTTPS figma.com URL.';
      } catch {
        nextErrors.figmaUrl = 'Enter a valid Figma URL.';
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0)
      onSubmit({
        ...values,
        title: values.title.trim(),
        description: values.description.trim(),
        figmaUrl: values.figmaUrl.trim(),
      });
  };

  return (
    <form
      id={formId}
      className={styles.workItemForm}
      onSubmit={submit}
      noValidate
    >
      {showCreationStatus ? (
        <div className={styles.fixedStatus}>
          <span>Status</span>
          <strong>Backlog</strong>
          <small>Creation cannot submit work or start another status.</small>
        </div>
      ) : null}
      <InputControl
        label="Title"
        required
        value={values.title}
        {...(errors.title ? { error: errors.title } : {})}
        onChange={(event) => update('title', event.target.value)}
      />
      <div className={styles.formGrid}>
        <SelectControl
          label="Area / Squad"
          required
          value={values.areaId}
          {...(errors.areaId ? { error: errors.areaId } : {})}
          onChange={(event) => update('areaId', event.target.value)}
        >
          <option value="">Choose an Area / Squad</option>
          {options.areas
            .filter((option) =>
              option.isActive === true ? true : option.id === values.areaId,
            )
            .map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
        </SelectControl>
        {includeAssignee ? (
          <SelectControl
            label={teamReadyControls ? 'Assignee' : 'Assignee (optional)'}
            value={values.assigneeId}
            onChange={(event) => update('assigneeId', event.target.value)}
          >
            <option value="">Unassigned</option>
            {options.people.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </SelectControl>
        ) : null}
        <InputControl
          label="Planned start"
          type="date"
          value={values.plannedStartDate}
          onChange={(event) => update('plannedStartDate', event.target.value)}
        />
        <InputControl
          label="Due date"
          type="date"
          value={values.dueDate}
          {...(errors.dueDate ? { error: errors.dueDate } : {})}
          onChange={(event) => update('dueDate', event.target.value)}
        />
      </div>
      <InputControl
        label={teamReadyControls ? 'Figma URL' : 'Figma URL (optional)'}
        type="url"
        placeholder="https://www.figma.com/design/…"
        value={values.figmaUrl}
        {...(errors.figmaUrl ? { error: errors.figmaUrl } : {})}
        onChange={(event) => update('figmaUrl', event.target.value)}
      />
      <TextareaControl
        label="Description"
        value={values.description}
        onChange={(event) => update('description', event.target.value)}
      />
      <fieldset className={styles.checkboxGroup}>
        <legend>Labels</legend>
        {options.labels
          .filter((option) =>
            option.isActive === true
              ? true
              : values.labelIds.includes(option.id),
          )
          .map((option) => (
            <Checkbox
              key={option.id}
              label={option.label}
              checked={values.labelIds.includes(option.id)}
              onChange={(event) =>
                update(
                  'labelIds',
                  event.target.checked
                    ? [...values.labelIds, option.id]
                    : values.labelIds.filter((id) => id !== option.id),
                )
              }
            />
          ))}
        {options.labels.length === 0 ? <p>No labels are available.</p> : null}
      </fieldset>
      {serverError ? (
        <div className={styles.errorPanel} role="alert">
          {serverError}
        </div>
      ) : null}
      {!hideSubmitButton ? (
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      ) : null}
    </form>
  );
}
