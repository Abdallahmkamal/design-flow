export interface PersonRef {
  id: string;
  displayName: string;
}
export interface NamedRef {
  id: string;
  name: string;
}
export interface StatusRef {
  code: string;
  label: string;
}

export interface WorkItemListRow {
  id: string;
  displayId: string;
  title: string;
  area: NamedRef;
  status: StatusRef;
  assignee: PersonRef | null;
  contributors: PersonRef[];
  labels: NamedRef[];
  plannedStartDate: string | null;
  dueDate: string | null;
  lastActivityAt: string;
  lastActivityType: string;
  daysOpen: number | null;
  daysActive: number;
  completedSubtasks: number;
  totalSubtasks: number;
  figmaUrl: string | null;
  isBlocked: boolean;
  isStale: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkItemListResult {
  rows: WorkItemListRow[];
  totalCount: number;
  page: number;
  pageSize: 25 | 50 | 100;
}

export interface WorkItemSubtask {
  id: string;
  title: string;
  position: number;
  isCompleted: boolean;
  createdBy: PersonRef;
  createdAt: string;
  completedBy: PersonRef | null;
  completedAt: string | null;
  updatedAt: string;
}

export interface WorkItemBlocker {
  id: string;
  reason: string;
  blockedBy: PersonRef;
  blockedAt: string;
  expectedResolutionDate: string | null;
  resolvedBy?: PersonRef | null;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
}

export interface WorkItemEvent {
  id: string;
  type: string;
  actor: PersonRef;
  subjectType: string;
  subjectId: string | null;
  occurredAt: string;
}

export interface WorkItemHistoryEntry {
  id: string;
  workDate: string;
  workTypeCode: string;
  workTypeLabel: string;
  description: string | null;
  relationship: 'primary' | 'contributor';
}

export interface WorkItemHistoryEvent extends WorkItemEvent {
  changedFields: string[];
  statusFrom: string | null;
  statusTo: string | null;
  assigneeFrom: string | null;
  assigneeTo: string | null;
  labelsBefore: string[];
  labelsAfter: string[];
  workLog: {
    workedBy: PersonRef;
    loggedBy: PersonRef;
    submittedAt: string;
    editedAt: string | null;
    withdrawnAt: string | null;
    entries: WorkItemHistoryEntry[];
  } | null;
}

export interface WorkDateSummary {
  date: string;
  people: PersonRef[];
  workTypes: string[];
}

export interface WorkItemHistory {
  workDates: WorkDateSummary[];
  events: WorkItemHistoryEvent[];
}

export interface WorkItemComment {
  id: string;
  body: string | null;
  author: PersonRef;
  createdAt: string;
  editedAt: string | null;
  withdrawnAt: string | null;
  withdrawnBy: PersonRef | null;
  canEdit: boolean;
  canWithdraw: boolean;
}

export interface WorkItemCapabilities {
  canEdit: boolean;
  canReassign: boolean;
  canTransition: boolean;
  canCreateBlocker: boolean;
  canResolveBlocker: boolean;
  canEditSubtasks: boolean;
  canComment: boolean;
  canArchive: boolean;
  canRestore: boolean;
}

export interface WorkItemDetail {
  id: string;
  displayId: string;
  title: string;
  description: string | null;
  status: StatusRef;
  area: NamedRef & { isActive: boolean };
  assignee: PersonRef | null;
  contributors: PersonRef[];
  labels: (NamedRef & { isActive: boolean })[];
  plannedStartDate: string | null;
  dueDate: string | null;
  figmaUrl: string | null;
  createdBy: PersonRef;
  createdAt: string;
  updatedAt: string;
  firstWorkedOn: string | null;
  lastWorkedOn: string | null;
  lastActivityAt: string;
  activeWorkDays: number;
  completedAt: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  subtasks: WorkItemSubtask[];
  completedSubtasks: number;
  totalSubtasks: number;
  activeBlocker: WorkItemBlocker | null;
  blockerHistory: WorkItemBlocker[];
  events: WorkItemEvent[];
  comments: WorkItemComment[];
  capabilities: WorkItemCapabilities;
}

export interface WorkItemOption {
  id: string;
  label: string;
  isActive?: boolean;
}
export interface WorkItemOptions {
  areas: WorkItemOption[];
  labels: WorkItemOption[];
  people: WorkItemOption[];
  statuses: { code: string; label: string }[];
}

export interface WorkItemFormValues {
  title: string;
  description: string;
  areaId: string;
  assigneeId: string;
  plannedStartDate: string;
  dueDate: string;
  figmaUrl: string;
  labelIds: string[];
}
