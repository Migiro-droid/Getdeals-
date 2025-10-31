import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ComposedChart, ReferenceLine } from 'recharts';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

export interface RevenueOrderLike { date: string; total: number; }
export type RevenueRange = '7d' | '30d' | '90d' | 'ytd' | 'total';

interface AdvancedRevenueTrendProps {
  orders: RevenueOrderLike[];
  initialRange?: RevenueRange;
  onRangeChange?: (r: RevenueRange) => void;
  className?: string;
}

// Helper produce stable ISO day list from start->today inclusive
function buildDayKeys(range: RevenueRange, orders: RevenueOrderLike[]): string[] {
  const today = new Date(); today.setHours(0,0,0,0);
  let days: number;
  
  if (range === 'total') {
    // For "total" range, show all days from first order to today
    if (orders.length === 0) {
      days = 30; // Default to 30 days if no orders
    } else {
      const firstOrderDate = new Date(Math.min(...orders.map(o => new Date(o.date).getTime())));
      firstOrderDate.setHours(0,0,0,0);
      days = Math.floor((today.getTime() - firstOrderDate.getTime()) / 86400000) + 1;
      // Cap at 365 days for performance
      days = Math.min(days, 365);
    }
  } else {
    switch(range){
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      case 'ytd': {
        const startYear = new Date(today.getFullYear(),0,1);
        days = Math.floor((today.getTime()-startYear.getTime())/86400000)+1;
        break;
      }
      default: days = 30;
    }
  }
  
  const out: string[] = [];
  for(let i=days-1;i>=0;i--){
    const d = new Date(today); d.setDate(d.getDate()-i);
    out.push(d.toISOString().slice(0,10));
  }
  return out;
}

function movingAverage(values: number[], windowSize: number): number[] {
  if(windowSize<=1) return values.slice();
  const out:number[]=[]; let sum=0; const q:number[]=[];
  for(let i=0;i<values.length;i++){
    q.push(values[i]); sum+=values[i];
    if(q.length>windowSize){ sum-=q.shift()!; }
    out.push(Math.round(sum / q.length));
  }
  return out;
}

export const AdvancedRevenueTrend: React.FC<AdvancedRevenueTrendProps> = ({ orders, initialRange='30d', onRangeChange, className }) => {
  const [range, setRange] = useState<RevenueRange>(initialRange);
  const handleRange = (r: RevenueRange) => { setRange(r); onRangeChange?.(r); };

  // Build stable chart data - completely memoized to prevent any flickering
  const chartData = useMemo(()=>{
    const keys = buildDayKeys(range, orders);
    const revenueByDay: Record<string, number> = Object.fromEntries(keys.map(k=>[k,0]));
    
    // Aggregate orders by day
    for(const o of orders){
      const dayKey = o.date.slice(0,10);
      if(dayKey in revenueByDay) revenueByDay[dayKey] += o.total;
    }
    
    const dailyValues = keys.map(k => revenueByDay[k]);
    const movingAvgs = movingAverage(dailyValues, range==='7d'?3:7);
    
    // Create stable data points with consistent labels
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return keys.map((dayKey, idx) => {
      const date = new Date(dayKey);
      let displayLabel = '';
      
      if(range === '7d') {
        displayLabel = weekdays[date.getDay()];
      } else if(range === '30d' || range === '90d') {
        const day = date.getDate();
        if(idx === 0 || idx === keys.length-1 || day === 1 || idx % 5 === 0) {
          displayLabel = `${months[date.getMonth()]} ${day}`;
        }
      } else {
        if(date.getDate() === 1 || idx === 0 || idx === keys.length-1) {
          displayLabel = months[date.getMonth()];
        }
      }
      
      return {
        date: dayKey,
        label: displayLabel,
        revenue: revenueByDay[dayKey],
        avg: movingAvgs[idx],
        fullDate: date.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
      };
    });
  }, [orders, range]);

  const totals = useMemo(()=>{
    const total = chartData.reduce((s,p)=>s+p.revenue,0);
    const latest = chartData[chartData.length-1]?.revenue || 0;
    const prev = chartData[chartData.length-2]?.revenue || 0;
    const deltaPct = prev===0? null : Math.round(((latest-prev)/prev)*100);
    const avgDay = chartData.length ? Math.round(total / chartData.length) : 0;
    return { total, latest, prev, deltaPct, avgDay };
  },[chartData]);

  const chartConfig = useMemo(() => ({ 
    revenue: { label:'Revenue', color:'hsl(var(--primary))' }, 
    avg: { label:'Moving Avg', color:'hsl(var(--chart-2, var(--secondary)))' } 
  }), []);

  // Create label map to avoid .find() on every render
  const labelMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const point of chartData) {
      map[point.date] = point.label;
    }
    return map;
  }, [chartData]);

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className='pb-2'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-2'>
            <DollarSign className='w-5 h-5 text-emerald-600' />
            <CardTitle className='text-base md:text-lg'>Revenue Performance</CardTitle>
          </div>
          <div className='flex items-center gap-2'>
            {(['7d','30d','90d','ytd','total'] as RevenueRange[]).map(r=>{
              const active = r===range;
              return (
                <button 
                  key={r} 
                  onClick={()=>handleRange(r)} 
                  className={cn(
                    'px-3 py-1.5 rounded text-xs font-medium border transition-all',
                    active 
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                      : 'hover:bg-muted border-border hover:border-primary/50'
                  )}
                >
                  {r === 'ytd' ? 'YTD' : r === 'total' ? 'Total' : r.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
        <div className='mt-4 grid grid-cols-2 md:grid-cols-4 gap-4'>
          {/* Total Revenue */}
          <div className='flex flex-col gap-1 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800'>
            <span className='text-xs text-muted-foreground flex items-center gap-1'>
              <Calendar className='w-3 h-3' />
              Total Revenue
            </span>
            <span className='font-bold text-lg text-emerald-600'>
              KES {totals.total.toLocaleString()}
            </span>
          </div>
          
          {/* Average per Day */}
          <div className='flex flex-col gap-1 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800'>
            <span className='text-xs text-muted-foreground'>Avg / Day</span>
            <span className='font-semibold text-lg text-blue-600'>
              KES {totals.avgDay.toLocaleString()}
            </span>
          </div>
          
          {/* Latest Day */}
          <div className='flex flex-col gap-1 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800'>
            <span className='text-xs text-muted-foreground'>Latest Day</span>
            <span className='font-semibold text-lg text-purple-600'>
              KES {totals.latest.toLocaleString()}
            </span>
          </div>
          
          {/* Change vs Previous */}
          <div className='flex flex-col gap-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800'>
            <span className='text-xs text-muted-foreground'>Change vs Prev</span>
            <span className={cn(
              'font-semibold text-lg flex items-center gap-1',
              totals.deltaPct === null 
                ? 'text-muted-foreground' 
                : totals.deltaPct > 0 
                  ? 'text-green-600' 
                  : totals.deltaPct < 0 
                    ? 'text-red-600' 
                    : 'text-blue-600'
            )}>
              {totals.deltaPct === null ? (
                '—'
              ) : (
                <>
                  {totals.deltaPct > 0 ? <TrendingUp className='w-4 h-4' /> : totals.deltaPct < 0 ? <TrendingDown className='w-4 h-4' /> : null}
                  {totals.deltaPct > 0 ? `+${totals.deltaPct}%` : `${totals.deltaPct}%`}
                </>
              )}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className='flex-1 flex flex-col'>
        <div className='w-full h-64'>
          <ChartContainer config={chartConfig} className='w-full h-full'>
            <ComposedChart data={chartData} margin={{ top: 10, left: 12, right: 12, bottom: 6 }}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='hsl(var(--border))' opacity={0.3} />
              <XAxis 
                dataKey='date' 
                tickLine={false} 
                axisLine={false} 
                height={38} 
                tickMargin={10}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                tickFormatter={(dateKey: string) => labelMap[dateKey] || ''} 
              />
              <YAxis 
                width={55} 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => {
                  if (v >= 1_000_000) return `${Math.round(v/1_000_000)}M`;
                  if (v >= 1000) return `${Math.round(v/1000)}k`;
                  return `${v}`;
                }} 
              />
              <ReferenceLine y={0} stroke='hsl(var(--border))' />
              <Bar 
                dataKey='revenue' 
                fill='hsl(var(--primary))' 
                fillOpacity={0.2}
                radius={[4,4,0,0]} 
              />
              <Line 
                type='monotone' 
                dataKey='revenue' 
                stroke='hsl(var(--primary))' 
                strokeWidth={2.5} 
                dot={false} 
                isAnimationActive={false}
              />
              <Line 
                type='monotone' 
                dataKey='avg' 
                stroke='hsl(var(--chart-2,var(--secondary)))' 
                strokeDasharray='5 5' 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={false}
              />
              <ChartTooltip 
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }} 
                content={<ChartTooltipContent />}
                formatter={(value: number, name: string) => {
                  const label = name === 'avg' ? 'Moving Avg' : 'Revenue';
                  return [`KES ${Math.round(value).toLocaleString()}`, label];
                }}
                labelFormatter={(label: string) => {
                  const point = chartData.find(d => d.date === label);
                  return point?.fullDate || label;
                }}
              />
            </ComposedChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedRevenueTrend;
