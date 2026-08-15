import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';

import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { Checkbox } from '../../ui/Checkbox/Checkbox';
import { DataTable, type DataTableColumn } from '../../ui/DataTable/DataTable';
import { Input } from '../../ui/Input/Input';
import { Select } from '../../ui/Select/Select';
import {
  createMember,
  deactivateMember,
  getAssignedWorkItems,
  getMembers,
  issueTemporaryPassword,
  reactivateMember,
  setMemberAccess,
  type AssignedWorkItem,
  type MemberRecord,
  type OneTimeCredentialResult,
  type PositionCode,
} from './settingsApi';
import {
  formatDateTime,
  operationIdFor,
  announceSettingsSaved,
  settingsErrorMessage,
  type StableOperation,
} from './settingsUi';
import styles from './SettingsPage.module.css';

type MemberAction =
  | { type: 'create' }
  | { type: 'edit'; member: MemberRecord }
  | { type: 'reset'; member: MemberRecord }
  | { type: 'deactivate'; member: MemberRecord }
  | { type: 'reactivate'; member: MemberRecord };

interface CredentialNotice {
  email: string;
  action: 'created' | 'reset';
  result: OneTimeCredentialResult;
}

function supervisorOptions(
  members: MemberRecord[],
  positionCode: PositionCode,
  excludedId?: string,
): MemberRecord[] {
  const requiredPosition =
    positionCode === 'designer'
      ? 'lead'
      : positionCode === 'lead'
        ? 'manager'
        : null;
  if (!requiredPosition) return [];

  return members.filter(
    (member) =>
      member.id !== excludedId &&
      member.isActive &&
      !member.mustChangePassword &&
      member.positionCode === requiredPosition,
  );
}

function eligibleAssignees(
  members: MemberRecord[],
  excludedId?: string,
): MemberRecord[] {
  return members.filter(
    (member) =>
      member.id !== excludedId &&
      member.isActive &&
      !member.mustChangePassword &&
      member.positionCode !== 'viewer',
  );
}

function AccessFields({
  admin,
  members,
  onAdminChange,
  onPositionChange,
  onSupervisorChange,
  position,
  supervisorId,
  targetId,
}: {
  admin: boolean;
  members: MemberRecord[];
  onAdminChange: (value: boolean) => void;
  onPositionChange: (value: PositionCode) => void;
  onSupervisorChange: (value: string | null) => void;
  position: PositionCode;
  supervisorId: string | null;
  targetId?: string;
}) {
  const supervisors = supervisorOptions(members, position, targetId);
  const needsSupervisor = position === 'designer' || position === 'lead';

  return (
    <>
      <Select
        label="Organizational position"
        value={position}
        onChange={(event) => {
          const nextPosition = event.target.value as PositionCode;
          onPositionChange(nextPosition);
          if (nextPosition === 'viewer') onAdminChange(false);
          if (nextPosition === 'viewer' || nextPosition === 'manager') {
            onSupervisorChange(null);
          } else {
            onSupervisorChange(null);
          }
        }}
        required
      >
        <option value="viewer">Viewer</option>
        <option value="designer">Designer</option>
        <option value="lead">Lead</option>
        <option value="manager">Manager</option>
      </Select>
      <Select
        label="Reports to"
        description={
          needsSupervisor
            ? `${position === 'designer' ? 'Designers' : 'Leads'} require an active ${
                position === 'designer' ? 'Lead' : 'Manager'
              }.`
            : 'Managers and Viewers have no supervisor in the MVP.'
        }
        value={supervisorId ?? ''}
        onChange={(event) => onSupervisorChange(event.target.value || null)}
        disabled={!needsSupervisor}
        required={needsSupervisor}
      >
        <option value="">
          {needsSupervisor ? 'Select supervisor' : 'No supervisor'}
        </option>
        {supervisors.map((member) => (
          <option key={member.id} value={member.id}>
            {member.displayName}
          </option>
        ))}
      </Select>
      <Checkbox
        label="Admin privilege"
        description="Admin changes capability only; it does not change position, reporting, or default people scope."
        checked={admin}
        disabled={position === 'viewer'}
        onChange={(event) => onAdminChange(event.target.checked)}
      />
    </>
  );
}

function AssignmentReplacementFields({
  items,
  members,
  onChange,
  targetId,
  values,
}: {
  items: AssignedWorkItem[];
  members: MemberRecord[];
  onChange: (itemId: string, replacementId: string) => void;
  targetId: string;
  values: Record<string, string>;
}) {
  const assignees = eligibleAssignees(members, targetId);

  if (items.length === 0) return null;

  return (
    <fieldset className={styles.fieldset}>
      <legend>Current ticket assignments</legend>
      <p>
        Choose a replacement for every current ticket. Active workflow tickets
        cannot be left unassigned.
      </p>
      {items.map((item) => {
        const requiresAssignee = ['todo', 'in_progress', 'in_review'].includes(
          item.statusCode,
        );
        return (
          <Select
            key={item.id}
            label={`${item.displayId}: ${item.title}`}
            value={values[item.id] ?? ''}
            onChange={(event) => onChange(item.id, event.target.value)}
            required
          >
            <option value="">Select replacement</option>
            {!requiresAssignee ? (
              <option value="__none__">Close current assignment</option>
            ) : null}
            {assignees.map((member) => (
              <option key={member.id} value={member.id}>
                {member.displayName} · {member.positionLabel}
              </option>
            ))}
          </Select>
        );
      })}
    </fieldset>
  );
}

function FormFeedback({
  error,
  success,
}: {
  error: unknown;
  success?: string;
}) {
  return (
    <>
      {success ? (
        <p className={styles.success} role="status">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {settingsErrorMessage(error)}
        </p>
      ) : null}
    </>
  );
}

function CreateMemberForm({
  members,
  onCancel,
  onCredential,
}: {
  members: MemberRecord[];
  onCancel: () => void;
  onCredential: (notice: CredentialNotice) => void;
}) {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState<PositionCode>('designer');
  const [admin, setAdmin] = useState(false);
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  const operation = useRef<StableOperation | null>(null);
  const mutation = useMutation({
    mutationFn: async () =>
      await createMember(
        {
          displayName: displayName.trim(),
          email: email.trim(),
          positionCode: position,
          isAdmin: admin,
          supervisorId,
        },
        operationIdFor(
          operation,
          JSON.stringify({
            displayName: displayName.trim(),
            email: email.trim(),
            position,
            admin,
            supervisorId,
          }),
        ),
      ),
    onSuccess: async (result) => {
      announceSettingsSaved();
      operation.current = null;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['settings-members'] }),
        queryClient.invalidateQueries({ queryKey: ['team-directory'] }),
        queryClient.invalidateQueries({ queryKey: ['settings-audit'] }),
      ]);
      onCredential({ email: email.trim(), action: 'created', result });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if ((position === 'designer' || position === 'lead') && !supervisorId) {
      return;
    }
    mutation.mutate();
  };

  return (
    <form className={styles.actionForm} onSubmit={submit}>
      <h3 tabIndex={-1}>Create member</h3>
      <div className={styles.formGrid}>
        <Input
          label="Display name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          required
        />
        <Input
          label="Work email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <AccessFields
          admin={admin}
          members={members}
          onAdminChange={setAdmin}
          onPositionChange={setPosition}
          onSupervisorChange={setSupervisorId}
          position={position}
          supervisorId={supervisorId}
        />
      </div>
      <p className={styles.consequence}>
        A temporary password is shown once after creation. The member must
        change it before entering the portal.
      </p>
      <FormFeedback error={mutation.error} />
      <div className={styles.formActions}>
        <Button type="submit" isLoading={mutation.isPending}>
          Create member
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EditAccessForm({
  assignments,
  member,
  members,
  onCancel,
  onComplete,
}: {
  assignments: AssignedWorkItem[];
  member: MemberRecord;
  members: MemberRecord[];
  onCancel: () => void;
  onComplete: () => void;
}) {
  const queryClient = useQueryClient();
  const [position, setPosition] = useState(member.positionCode);
  const [admin, setAdmin] = useState(member.isAdmin);
  const [supervisorId, setSupervisorId] = useState(member.supervisorId);
  const [replacements, setReplacements] = useState<Record<string, string>>({});
  const operation = useRef<StableOperation | null>(null);
  const targetAssignments = assignments.filter(
    (item) => item.assigneeId === member.id,
  );
  const mutation = useMutation({
    mutationFn: async () =>
      await setMemberAccess(
        {
          targetProfileId: member.id,
          positionCode: position,
          isAdmin: admin,
          supervisorId,
          expectedUpdatedAt: member.updatedAt,
          assignmentReplacements:
            position === 'viewer'
              ? targetAssignments.map((item) => ({
                  work_item_id: item.id,
                  new_assignee_id:
                    replacements[item.id] === '__none__'
                      ? null
                      : (replacements[item.id] ?? null),
                }))
              : [],
        },
        operationIdFor(
          operation,
          JSON.stringify({
            member: member.id,
            position,
            admin,
            supervisorId,
            replacements,
            version: member.updatedAt,
          }),
        ),
      ),
    onSuccess: async () => {
      announceSettingsSaved();
      operation.current = null;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['settings-members'] }),
        queryClient.invalidateQueries({
          queryKey: ['settings-assigned-work-items'],
        }),
        queryClient.invalidateQueries({ queryKey: ['team-directory'] }),
        queryClient.invalidateQueries({ queryKey: ['settings-audit'] }),
      ]);
      onComplete();
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const needsSupervisor = position === 'designer' || position === 'lead';
    if (needsSupervisor && !supervisorId) return;
    if (
      position === 'viewer' &&
      targetAssignments.some((item) => !replacements[item.id])
    ) {
      return;
    }
    mutation.mutate();
  };

  return (
    <form className={styles.actionForm} onSubmit={submit}>
      <h3 tabIndex={-1}>Edit access for {member.displayName}</h3>
      <div className={styles.formGrid}>
        <AccessFields
          admin={admin}
          members={members}
          onAdminChange={setAdmin}
          onPositionChange={setPosition}
          onSupervisorChange={setSupervisorId}
          position={position}
          supervisorId={supervisorId}
          targetId={member.id}
        />
      </div>
      {position === 'viewer' ? (
        <AssignmentReplacementFields
          items={targetAssignments}
          members={members}
          onChange={(itemId, replacementId) =>
            setReplacements((current) => ({
              ...current,
              [itemId]: replacementId,
            }))
          }
          targetId={member.id}
          values={replacements}
        />
      ) : null}
      <FormFeedback
        error={mutation.error}
        {...(mutation.isSuccess ? { success: 'Member access updated.' } : {})}
      />
      <div className={styles.formActions}>
        <Button type="submit" isLoading={mutation.isPending}>
          Save access
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ResetMemberForm({
  member,
  onCancel,
  onCredential,
}: {
  member: MemberRecord;
  onCancel: () => void;
  onCredential: (notice: CredentialNotice) => void;
}) {
  const queryClient = useQueryClient();
  const operation = useRef<StableOperation | null>(null);
  const mutation = useMutation({
    mutationFn: async () =>
      await issueTemporaryPassword(
        member.id,
        operationIdFor(operation, `reset|${member.id}`),
      ),
    onSuccess: async (result) => {
      announceSettingsSaved();
      operation.current = null;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['settings-members'] }),
        queryClient.invalidateQueries({ queryKey: ['settings-audit'] }),
      ]);
      onCredential({ email: member.email, action: 'reset', result });
    },
  });

  return (
    <div className={styles.actionForm}>
      <h3 tabIndex={-1}>Issue temporary password?</h3>
      <p>
        {member.displayName} will be restricted to password change until the new
        temporary credential is replaced. Position, Admin access, and reporting
        remain unchanged.
      </p>
      <FormFeedback error={mutation.error} />
      <div className={styles.formActions}>
        <Button
          variant="destructive"
          isLoading={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Issue temporary password
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function DeactivateMemberForm({
  assignments,
  member,
  members,
  onCancel,
  onComplete,
}: {
  assignments: AssignedWorkItem[];
  member: MemberRecord;
  members: MemberRecord[];
  onCancel: () => void;
  onComplete: () => void;
}) {
  const queryClient = useQueryClient();
  const [assignmentReplacements, setAssignmentReplacements] = useState<
    Record<string, string>
  >({});
  const [reportingReplacements, setReportingReplacements] = useState<
    Record<string, string>
  >({});
  const operation = useRef<StableOperation | null>(null);
  const directReports = members.filter(
    (candidate) => candidate.isActive && candidate.supervisorId === member.id,
  );
  const targetAssignments = assignments.filter(
    (item) => item.assigneeId === member.id,
  );
  const mutation = useMutation({
    mutationFn: async () =>
      await deactivateMember(
        member.id,
        directReports.map((report) => ({
          personId: report.id,
          newSupervisorId: reportingReplacements[report.id] ?? '',
        })),
        targetAssignments.map((item) => ({
          workItemId: item.id,
          newAssigneeId:
            assignmentReplacements[item.id] === '__none__'
              ? null
              : (assignmentReplacements[item.id] ?? null),
        })),
        operationIdFor(
          operation,
          JSON.stringify({
            member: member.id,
            reportingReplacements,
            assignmentReplacements,
          }),
        ),
      ),
    onSuccess: async () => {
      announceSettingsSaved();
      operation.current = null;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['settings-members'] }),
        queryClient.invalidateQueries({
          queryKey: ['settings-assigned-work-items'],
        }),
        queryClient.invalidateQueries({ queryKey: ['team-directory'] }),
        queryClient.invalidateQueries({ queryKey: ['settings-audit'] }),
      ]);
      onComplete();
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      directReports.some((report) => !reportingReplacements[report.id]) ||
      targetAssignments.some((item) => !assignmentReplacements[item.id])
    ) {
      return;
    }
    mutation.mutate();
  };

  return (
    <form className={styles.actionForm} onSubmit={submit}>
      <h3 tabIndex={-1}>Deactivate {member.displayName}?</h3>
      <p className={styles.consequence}>
        Portal access will be blocked without deleting historical tickets, work,
        comments, reports, or audit attribution.
      </p>
      {directReports.length > 0 ? (
        <fieldset className={styles.fieldset}>
          <legend>Reporting replacements</legend>
          {directReports.map((report) => (
            <Select
              key={report.id}
              label={`New supervisor for ${report.displayName}`}
              value={reportingReplacements[report.id] ?? ''}
              onChange={(event) =>
                setReportingReplacements((current) => ({
                  ...current,
                  [report.id]: event.target.value,
                }))
              }
              required
            >
              <option value="">Select supervisor</option>
              {supervisorOptions(members, report.positionCode, member.id).map(
                (supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.displayName}
                  </option>
                ),
              )}
            </Select>
          ))}
        </fieldset>
      ) : null}
      <AssignmentReplacementFields
        items={targetAssignments}
        members={members}
        onChange={(itemId, replacementId) =>
          setAssignmentReplacements((current) => ({
            ...current,
            [itemId]: replacementId,
          }))
        }
        targetId={member.id}
        values={assignmentReplacements}
      />
      <FormFeedback error={mutation.error} />
      <div className={styles.formActions}>
        <Button
          type="submit"
          variant="destructive"
          isLoading={mutation.isPending}
        >
          Confirm deactivation
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ReactivateMemberForm({
  member,
  members,
  onCancel,
  onComplete,
}: {
  member: MemberRecord;
  members: MemberRecord[];
  onCancel: () => void;
  onComplete: () => void;
}) {
  const queryClient = useQueryClient();
  const [position, setPosition] = useState(member.positionCode);
  const [admin, setAdmin] = useState(member.isAdmin);
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const operation = useRef<StableOperation | null>(null);
  const mutation = useMutation({
    mutationFn: async () =>
      await reactivateMember(
        {
          targetProfileId: member.id,
          positionCode: position,
          isAdmin: admin,
          supervisorId,
          mustChangePassword,
        },
        operationIdFor(
          operation,
          JSON.stringify({
            member: member.id,
            position,
            admin,
            supervisorId,
            mustChangePassword,
          }),
        ),
      ),
    onSuccess: async () => {
      announceSettingsSaved();
      operation.current = null;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['settings-members'] }),
        queryClient.invalidateQueries({ queryKey: ['team-directory'] }),
        queryClient.invalidateQueries({ queryKey: ['settings-audit'] }),
      ]);
      onComplete();
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if ((position === 'designer' || position === 'lead') && !supervisorId) {
      return;
    }
    mutation.mutate();
  };

  return (
    <form className={styles.actionForm} onSubmit={submit}>
      <h3 tabIndex={-1}>Reactivate {member.displayName}</h3>
      <div className={styles.formGrid}>
        <AccessFields
          admin={admin}
          members={members}
          onAdminChange={setAdmin}
          onPositionChange={setPosition}
          onSupervisorChange={setSupervisorId}
          position={position}
          supervisorId={supervisorId}
          targetId={member.id}
        />
        <Checkbox
          label="Require password change"
          description="Keep enabled unless support has separately confirmed a safe current credential."
          checked={mustChangePassword}
          onChange={(event) => setMustChangePassword(event.target.checked)}
        />
      </div>
      <FormFeedback error={mutation.error} />
      <div className={styles.formActions}>
        <Button type="submit" isLoading={mutation.isPending}>
          Reactivate member
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function MemberSettingsSection() {
  const [action, setAction] = useState<MemberAction | null>(null);
  const [credential, setCredential] = useState<CredentialNotice | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const actionPanel = useRef<HTMLDivElement | null>(null);
  const credentialPanel = useRef<HTMLDivElement | null>(null);
  const membersQuery = useQuery({
    queryKey: ['settings-members'],
    queryFn: getMembers,
  });
  const assignmentsQuery = useQuery({
    queryKey: ['settings-assigned-work-items'],
    queryFn: getAssignedWorkItems,
  });

  const openAction = (nextAction: MemberAction) => {
    returnFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setCredential(null);
    setAction(nextAction);
  };
  const closeAction = () => {
    setAction(null);
    requestAnimationFrame(() => returnFocus.current?.focus());
  };

  useEffect(() => {
    if (action) {
      actionPanel.current
        ?.querySelector<HTMLElement>('h3')
        ?.focus({ preventScroll: true });
      actionPanel.current?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [action]);

  useEffect(() => {
    if (credential) {
      credentialPanel.current
        ?.querySelector<HTMLElement>('h3')
        ?.focus({ preventScroll: true });
      credentialPanel.current?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [credential]);

  const members = membersQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];

  const columns: readonly DataTableColumn<MemberRecord>[] = [
    {
      key: 'member',
      header: 'Member',
      render: (member) => (
        <div className={styles.memberIdentity}>
          <strong>{member.displayName}</strong>
          <span>{member.email}</span>
        </div>
      ),
    },
    {
      key: 'access',
      header: 'Access',
      render: (member) => (
        <div className={styles.badges}>
          <Badge tone={member.isActive ? 'success' : 'neutral'}>
            {member.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Badge>{member.positionLabel}</Badge>
          {member.isAdmin ? <Badge tone="info">Admin</Badge> : null}
          {member.mustChangePassword ? (
            <Badge tone="warning">Password change required</Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: 'reports',
      header: 'Reports to',
      render: (member) => member.reportsToDisplayName ?? '—',
    },
    {
      key: 'support',
      header: 'Account support',
      render: (member) => (
        <div className={styles.supportDates}>
          <span>Last sign-in: {formatDateTime(member.lastSignInAt)}</span>
          <span>Created: {formatDateTime(member.createdAt)}</span>
          <span>
            Access updated: {formatDateTime(member.accessAdministeredAt)}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (member) => (
        <div className={styles.rowActions}>
          {member.isActive ? (
            <>
              <Button
                variant="ghost"
                size="small"
                onClick={() => openAction({ type: 'edit', member })}
              >
                Edit access
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={() => openAction({ type: 'reset', member })}
              >
                Reset password
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={() => openAction({ type: 'deactivate', member })}
              >
                Deactivate
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="small"
              onClick={() => openAction({ type: 'reactivate', member })}
            >
              Reactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  let actionContent: ReactNode = null;
  if (action?.type === 'create') {
    actionContent = (
      <CreateMemberForm
        members={members}
        onCancel={closeAction}
        onCredential={(notice) => {
          setCredential(notice);
          setAction(null);
        }}
      />
    );
  } else if (action?.type === 'edit') {
    actionContent = (
      <EditAccessForm
        assignments={assignments}
        member={action.member}
        members={members}
        onCancel={closeAction}
        onComplete={closeAction}
      />
    );
  } else if (action?.type === 'reset') {
    actionContent = (
      <ResetMemberForm
        member={action.member}
        onCancel={closeAction}
        onCredential={(notice) => {
          setCredential(notice);
          setAction(null);
        }}
      />
    );
  } else if (action?.type === 'deactivate') {
    actionContent = (
      <DeactivateMemberForm
        assignments={assignments}
        member={action.member}
        members={members}
        onCancel={closeAction}
        onComplete={closeAction}
      />
    );
  } else if (action?.type === 'reactivate') {
    actionContent = (
      <ReactivateMemberForm
        member={action.member}
        members={members}
        onCancel={closeAction}
        onComplete={closeAction}
      />
    );
  }

  const isLoading = membersQuery.isPending || assignmentsQuery.isPending;
  const isError = membersQuery.isError || assignmentsQuery.isError;

  return (
    <section
      className={styles.section}
      id="members"
      aria-labelledby="members-title"
    >
      <header className={styles.sectionHeader}>
        <div>
          <h2 id="members-title">Members and access</h2>
          <p>
            Account support, position, independent Admin privilege, reporting
            hierarchy, and lifecycle administration.
          </p>
        </div>
        <Button onClick={() => openAction({ type: 'create' })}>
          Create member
        </Button>
      </header>

      {credential ? (
        <div
          className={styles.credentialNotice}
          ref={credentialPanel}
          role="status"
        >
          <h3 tabIndex={-1}>
            {credential.action === 'created'
              ? 'Member created'
              : 'Temporary password issued'}
          </h3>
          {credential.result.credentialDelivered &&
          credential.result.temporaryPassword ? (
            <>
              <p>
                Share this credential through an approved private channel. It is
                shown once and is not stored in Design Flow.
              </p>
              <dl>
                <div>
                  <dt>Email</dt>
                  <dd>{credential.email}</dd>
                </div>
                <div>
                  <dt>Temporary password</dt>
                  <dd>
                    <code>{credential.result.temporaryPassword}</code>
                  </dd>
                </div>
              </dl>
              <Button
                variant="secondary"
                onClick={() =>
                  void navigator.clipboard?.writeText(
                    credential.result.temporaryPassword ?? '',
                  )
                }
              >
                Copy temporary password
              </Button>
            </>
          ) : (
            <p>
              The account action completed, but the one-time credential is no
              longer available. Issue a new temporary password.
            </p>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              setCredential(null);
              requestAnimationFrame(() => returnFocus.current?.focus());
            }}
          >
            Dismiss
          </Button>
        </div>
      ) : null}

      {actionContent ? (
        <div className={styles.actionPanel} ref={actionPanel}>
          {actionContent}
        </div>
      ) : null}

      {isLoading ? (
        <p className={styles.scopedState} role="status">
          Loading members and current assignments…
        </p>
      ) : isError ? (
        <div className={styles.scopedState} role="alert">
          <p>Design Flow could not load member administration.</p>
          <Button
            variant="secondary"
            onClick={() => {
              void membersQuery.refetch();
              void assignmentsQuery.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      ) : (
        <DataTable
          caption="Member account administration"
          columns={columns}
          rows={members}
          getRowKey={(member) => member.id}
          emptyContent={
            <p>No member accounts are available. Create the first member.</p>
          }
        />
      )}
    </section>
  );
}
