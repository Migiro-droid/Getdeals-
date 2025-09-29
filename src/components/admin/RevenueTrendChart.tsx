import React, { useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

// Order type subset to avoid importing full context types here
export interface RevenueOrderLike {
  date: string; // ISO
  total: number;
}

export interface RevenueTrendChartProps {
  orders: RevenueOrderLike[];
  range: '7d' | '30d' | 'all';
}

interface Point { key: string; label: string; value: number; }

// Helper: format Y values
const fmtY = (v: number) => v >= 1_000_000 ? `${Math.round(v/1_000_000)}M` : v >= 1000 ? `${Math.round(v/1000)}k` : String(v);

// Helper: label selection based on density
function buildBuckets(orders: RevenueOrderLike[], range: RevenueTrendChartProps['range']): Point[] {
  const today = new Date(); today.setHours(0,0,0,0);
  const maxDays = range === '7d' ? 7 : 30; // cap even for "all"
  const start = new Date(today); start.setDate(start.getDate() - (maxDays - 1));

  // Initialize buckets
  const map: Record<string, number> = {};
  for (let i=0;i<maxDays;i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    map[d.toISOString().slice(0,10)] = 0;
  }
  // Aggregate
  for (const o of orders) {
    const key = o.date.slice(0,10);
    if (map[key] != null) map[key] += o.total;
  }
  const formatter = (iso: string, idx: number, total: number) => {
    const d = new Date(iso);
    if (range === '7d') return d.toLocaleDateString(undefined, { weekday: 'short' });
    // For 30d: show every ~5th tick, plus first & last & any month boundary
    const day = d.getDate();
    const boundary = day === 1;
    if (boundary || idx === 0 || idx === total -1 || idx % 5 === 0) {
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    return '';
  };
  const keys = Object.keys(map); // chronological
  return keys.map((k, i) => ({ key: k, label: formatter(k, i, keys.length), value: map[k] }));
}

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({ orders, range }) => {
  // Stable reference reuse to avoid flicker
  const prevRef = useRef<Point[] | null>(null);
  const data = useMemo(() => {
    const nextRaw = buildBuckets(orders, range);
    const prev = prevRef.current || [];
    const next: Point[] = [];
    for (let i=0;i<nextRaw.length;i++) {
      const a = nextRaw[i];
      const b = prev[i];
      if (b && b.key === a.key && b.value === a.value && b.label === a.label) next.push(b); else next.push(a);
    }
    prevRef.current = next;
    return next;
  }, [orders, range]);

  const totalRevenue = useMemo(() => data.reduce((s,p)=>s+p.value,0), [data]);
  const avgPerDay = useMemo(() => data.length ? Math.round(totalRevenue / data.length) : 0, [totalRevenue, data.length]);
  const dayChange = useMemo(() => {
    if (data.length < 2) return null;
    const last = data[data.length-1].value;
    const prev = data[data.length-2].value || 0;
    if (prev === 0) return last>0?100:null;
    return Math.round(((last - prev)/prev)*100);
  }, [data]);

  const trendColor = dayChange == null ? 'text-muted-foreground' : dayChange > 0 ? 'text-green-600' : dayChange < 0 ? 'text-red-600' : 'text-blue-600';

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-base md:text-lg">Revenue Trend</CardTitle>
          <div className="flex items-center gap-6 text-xs md:text-sm">
            <div className="flex flex-col"><span className="text-muted-foreground">Total</span><span className="font-semibold text-emerald-600">KES {totalRevenue.toLocaleString()}</span></div>
            <div className="flex flex-col"><span className="text-muted-foreground">Avg / Day</span><span className="font-medium">KES {avgPerDay.toLocaleString()}</span></div>
            <div className="flex flex-col"><span className="text-muted-foreground">Last vs Prev</span><span className={`font-medium ${trendColor}`}>{dayChange==null? '—' : (dayChange>0? `+${dayChange}%`: `${dayChange}%`)}</span></div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-60 w-full">
          <ChartContainer config={{ revenue: { label: 'Revenue', color: 'hsl(var(--primary))' }}} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 12, left: 12, right: 12, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="key"
                  type="category"
                  ticks={data.map((d) => d.key)}
                  allowDuplicatedCategory={false}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  height={38}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(key: string) => {
                    const found = data.find(d => d.key === key);
                    return found?.label ?? '';
                  }}
                />
                <YAxis width={50} tickFormatter={fmtY} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [`KES ${Math.round(value).toLocaleString()}`, 'Revenue']}
                  labelFormatter={(label: string) => {
                    const found = data.find((d) => d.key === label);
                    return found?.label || label;
                  }}
                />
                <Line isAnimationActive={false} type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r:4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span>Stable date axis (no flicker). Labels condensed for range.</span>
          <span>Data points: {data.length}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueTrendChart;
