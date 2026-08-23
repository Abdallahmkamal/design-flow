export const DUE_DATE_LABEL = 'Due Date';
export const DAYS_ACTIVE_LABEL = 'Days Active';

const statusLabels: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  paused: 'Paused',
  done: 'Done',
};

const workTypeLabels: Record<string, string> = {
  planning_alignment: 'Planning & alignment',
  discovery_research: 'Discovery & research',
  mapping_information_architecture: 'Mapping & information architecture',
  ideation_wireframing: 'Ideation & wireframing',
  ui_visual_design: 'UI & visual design',
  prototyping_interaction: 'Prototyping & interaction',
  design_system: 'Design system',
  testing_validation: 'Testing & validation',
  review_iteration: 'Review & iteration',
  documentation_handoff: 'Documentation & handoff',
  design_qa_implementation_support: 'Design QA & implementation support',
  team_support_collaboration: 'Team support & collaboration',
  other: 'Other',
  new_visual_asset: 'New visual asset',
  resizing_adaptation: 'Resizing & adaptation',
  presentation_support: 'Presentation support',
  image_editing: 'Image editing',
  illustration_iconography: 'Illustration & iconography',
  other_visual_work: 'Other visual work',
};

export function formatDomainDate(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
    : 'Not set';
}

export function formatDomainDateTime(value: string | null): string {
  return value
    ? `${new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
      }).format(new Date(value))} UTC`
    : 'Not set';
}

export function formatStatusLabel(code: string | null): string {
  return code ? (statusLabels[code] ?? 'Unknown status') : 'Not set';
}

export function formatWorkTypeLabel(code: string): string {
  return workTypeLabels[code] ?? 'Other work';
}

export function formatDomainFieldLabel(field: string): string {
  return field === 'Due date' || field === 'due_date' ? DUE_DATE_LABEL : field;
}
