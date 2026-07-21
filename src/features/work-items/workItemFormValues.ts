import type { WorkItemDetail, WorkItemFormValues } from './workItemTypes';

export function valuesFromDetail(item: WorkItemDetail): WorkItemFormValues {
  return {
    title: item.title,
    description: item.description ?? '',
    areaId: item.area.id,
    assigneeId: item.assignee?.id ?? '',
    plannedStartDate: item.plannedStartDate ?? '',
    dueDate: item.dueDate ?? '',
    figmaUrl: item.figmaUrl ?? '',
    labelIds: item.labels.map((label) => label.id),
  };
}
