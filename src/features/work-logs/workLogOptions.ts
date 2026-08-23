import type { WorkLogContext } from './workLogsApi';

export const ticketWorkTypes = [
  ['planning_alignment', 'Planning & alignment'],
  ['discovery_research', 'Discovery & research'],
  ['mapping_information_architecture', 'Mapping & information architecture'],
  ['ideation_wireframing', 'Ideation & wireframing'],
  ['ui_visual_design', 'UI & visual design'],
  ['prototyping_interaction', 'Prototyping & interaction'],
  ['design_system', 'Design system'],
  ['testing_validation', 'Testing & validation'],
  ['review_iteration', 'Review & iteration'],
  ['documentation_handoff', 'Documentation & handoff'],
  ['design_qa_implementation_support', 'Design QA & implementation support'],
  ['team_support_collaboration', 'Team support & collaboration'],
  ['other', 'Other'],
] as const;

export const visualWorkTypes = [
  ['new_visual_asset', 'New visual asset'],
  ['resizing_adaptation', 'Resizing & adaptation'],
  ['presentation_support', 'Presentation support'],
  ['image_editing', 'Image editing'],
  ['illustration_iconography', 'Illustration & iconography'],
  ['other_visual_work', 'Other visual work'],
] as const;

export function workTypesForContext(context: WorkLogContext) {
  return context === 'ticket' ? ticketWorkTypes : visualWorkTypes;
}
