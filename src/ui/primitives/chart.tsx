import {
  createContext,
  useContext,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '../lib/cn';

export type ChartConfig = Record<string, { label: string; color?: string }>;
const ChartContext = createContext<ChartConfig>({});
const chartText = (value: unknown) =>
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'bigint'
    ? String(value)
    : '';
export function ChartContainer({
  config,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig;
  children: ReactNode;
}) {
  const style = Object.fromEntries(
    Object.entries(config).map(([key, item], index) => [
      `--color-${key}`,
      item.color ?? `var(--chart-series-${(index % 3) + 1})`,
    ]),
  ) as CSSProperties;
  return (
    <ChartContext.Provider value={config}>
      <div
        data-slot="chart"
        className={cn('h-64 w-full min-w-0 text-xs', className)}
        style={style}
        {...props}
      >
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}
export const ChartTooltip = Tooltip;
export const ChartLegend = Legend;
export function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: readonly { name?: string; value?: unknown; color?: string }[];
  label?: unknown;
}) {
  const config = useContext(ChartContext);
  if (!active || !payload?.length) return null;
  return (
    <div className="grid min-w-32 gap-1 rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-none">
      <strong>{chartText(label)}</strong>
      {payload.map((item) => (
        <span key={item.name} className="flex justify-between gap-3">
          <span>{config[item.name ?? '']?.label ?? item.name}</span>
          <strong>{chartText(item.value) || '—'}</strong>
        </span>
      ))}
    </div>
  );
}
export function ChartLegendContent({
  payload,
}: {
  payload?: readonly { value?: string; color?: string }[];
}) {
  const config = useContext(ChartContext);
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-2">
      {payload?.map((item) => (
        <span key={item.value} className="inline-flex items-center gap-2">
          <span
            className="size-2 rounded-sm"
            style={{ background: item.color }}
          />
          {config[item.value ?? '']?.label ?? item.value}
        </span>
      ))}
    </div>
  );
}
