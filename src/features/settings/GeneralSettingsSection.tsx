import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState, type FormEvent } from 'react';

import { Button } from '../../ui/Button/Button';
import { Select } from '../../ui/Select/Select';
import { getTeamSettings, setTeamTimezone } from './settingsApi';
import {
  operationIdFor,
  settingsErrorMessage,
  type StableOperation,
} from './settingsUi';
import styles from './SettingsPage.module.css';

function supportedTimezones(current?: string): string[] {
  const supported =
    typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : ['Africa/Cairo', 'UTC'];

  return Array.from(
    new Set([...(current ? [current] : []), ...supported]),
  ).sort();
}

export function GeneralSettingsSection() {
  const queryClient = useQueryClient();
  const [timezone, setTimezone] = useState('');
  const operation = useRef<StableOperation | null>(null);
  const settings = useQuery({
    queryKey: ['settings-general'],
    queryFn: getTeamSettings,
  });
  const mutation = useMutation({
    mutationFn: async (nextTimezone: string) =>
      await setTeamTimezone(
        nextTimezone,
        settings.data?.updatedAt ?? '',
        operationIdFor(
          operation,
          `${nextTimezone}|${settings.data?.updatedAt ?? ''}`,
        ),
      ),
    onSuccess: async () => {
      operation.current = null;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['settings-general'] }),
        queryClient.invalidateQueries({ queryKey: ['settings-audit'] }),
      ]);
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const selectedTimezone = timezone || settings.data?.timezone;
    if (selectedTimezone) mutation.mutate(selectedTimezone);
  };

  return (
    <section
      className={styles.section}
      id="general"
      aria-labelledby="general-title"
    >
      <header className={styles.sectionHeader}>
        <div>
          <h2 id="general-title">General</h2>
          <p>
            Team timezone controls timestamp display and team-local today
            boundaries. Stored UTC timestamps and work dates are not rewritten.
          </p>
        </div>
      </header>

      {settings.isPending ? (
        <p className={styles.scopedState} role="status">
          Loading general settings…
        </p>
      ) : settings.isError ? (
        <div className={styles.scopedState} role="alert">
          <p>Design Flow could not load general settings.</p>
          <Button variant="secondary" onClick={() => void settings.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <form className={styles.inlineForm} onSubmit={submit}>
          <Select
            label="Team timezone"
            description="IANA timezone used for display and local-day boundaries."
            value={timezone || settings.data.timezone}
            onChange={(event) => setTimezone(event.target.value)}
            required
          >
            {supportedTimezones(settings.data.timezone).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <Button
            type="submit"
            isLoading={mutation.isPending}
            disabled={
              (timezone || settings.data.timezone) === settings.data.timezone
            }
          >
            Save timezone
          </Button>
        </form>
      )}
      {mutation.isSuccess ? (
        <p className={styles.success} role="status">
          Team timezone updated.
        </p>
      ) : null}
      {mutation.isError ? (
        <p className={styles.error} role="alert">
          {settingsErrorMessage(mutation.error)}
        </p>
      ) : null}
    </section>
  );
}
