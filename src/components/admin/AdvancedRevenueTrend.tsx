import React, { useMemo, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ComposedChart, ReferenceLine } from 'recharts';
import { cn } from '@/lib/utils';

export interface RevenueOrderLike { date: string; total: number; }
export type RevenueRange = '7d' | '30d' | '90d' | 'ytd';

interface Point { key: string; label: string; value: number; avg: number; }

interface AdvancedRevenueTrendProps {
  orders: RevenueOrderLike[];
  initialRange?: RevenueRange;
  onRangeChange?: (r: RevenueRange) => void;
  className?: string;
}

// Helper produce stable ISO day list from start->today inclusive
function buildDayKeys(range: RevenueRange): string[] {
  const today = new Date(); today.setHours(0,0,0,0);
  let days: number;
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

const fmtShort = (iso: string, idx: number, total: number, range: RevenueRange) => {
  const d = new Date(iso);
  if(range==='7d') return d.toLocaleDateString(undefined,{ weekday:'short'});
  if(range==='30d' || range==='90d'){
    // show roughly every 5th plus boundaries & month start
    const day=d.getDate();
    if(idx===0||idx===total-1||day===1||idx%5===0) return d.toLocaleDateString(undefined,{ month:'short', day:'numeric'});
    return '';
  }
  // ytd: show month initials at first day of month + first/last
  if(d.getDate()===1 || idx===0 || idx===total-1) return d.toLocaleDateString(undefined,{ month:'short'});
  return '';
};

export const AdvancedRevenueTrend: React.FC<AdvancedRevenueTrendProps> = ({ orders, initialRange='30d', onRangeChange, className }) => {
  const [range, setRange] = useState<RevenueRange>(initialRange);
  const handleRange = (r: RevenueRange) => { setRange(r); onRangeChange?.(r); };

  // Aggregate once per range into stable map; reuse point object references to kill flicker
  const prevPointsRef = useRef<Point[] | null>(null);
  const data = useMemo(()=>{
    const keys = buildDayKeys(range);
    const base: Record<string, number> = Object.fromEntries(keys.map(k=>[k,0]));
    for(const o of orders){
      const k = o.date.slice(0,10);
      if(k in base) base[k]+= o.total;
    }
    const values = keys.map(k=>base[k]);
    const avgs = movingAverage(values, range==='7d'?3:7); // shorter window for short range
    const prev = prevPointsRef.current || [];
    const next: Point[] = keys.map((k,i)=>{
      const label = fmtShort(k,i,keys.length,range);
      const value = base[k];
      const avg = avgs[i];
      const prevPoint = prev[i];
      if(prevPoint && prevPoint.key===k && prevPoint.value===value && prevPoint.avg===avg && prevPoint.label===label) return prevPoint;
      return { key:k,label,value,avg };
    });
    prevPointsRef.current = next;
    return next;
  },[orders, range]);

  const totals = useMemo(()=>{
    const total = data.reduce((s,p)=>s+p.value,0);
    const latest = data[data.length-1]?.value||0;
    const prev = data[data.length-2]?.value||0;
    const deltaPct = prev===0? null : Math.round(((latest-prev)/prev)*100);
    const avgDay = data.length? Math.round(total / data.length):0;
    return { total, latest, prev, deltaPct, avgDay };
  },[data]);

  const chartConfig = { revenue: { label:'Revenue', color:'hsl(var(--primary))' }, avg: { label:'7d Avg', color:'hsl(var(--chart-2, var(--secondary)))' } };

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className='pb-2'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <CardTitle className='text-base md:text-lg'>Revenue Performance</CardTitle>
          <div className='flex items-center gap-2'>
            {(['7d','30d','90d','ytd'] as RevenueRange[]).map(r=>{
              const active = r===range;
              return (
                <button key={r} onClick={()=>handleRange(r)} className={cn('px-2 py-1 rounded text-xs border transition', active? 'bg-primary text-primary-foreground border-primary':'hover:bg-muted border-border')}>{r.toUpperCase()}</button>
              );
            })}
          </div>
        </div>
        <div className='mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs'>
          <div className='flex flex-col'><span className='text-muted-foreground'>Total</span><span className='font-semibold text-emerald-600'>KES {totals.total.toLocaleString()}</span></div>
          <div className='flex flex-col'><span className='text-muted-foreground'>Avg / Day</span><span className='font-medium'>KES {totals.avgDay.toLocaleString()}</span></div>
          <div className='flex flex-col'><span className='text-muted-foreground'>Latest Day</span><span className='font-medium'>KES {totals.latest.toLocaleString()}</span></div>
          <div className='flex flex-col'><span className='text-muted-foreground'>Change vs Prev</span><span className={cn('font-medium', totals.deltaPct==null?'text-muted-foreground': totals.deltaPct>0?'text-green-600': totals.deltaPct<0?'text-red-600':'text-blue-600')}>{totals.deltaPct==null?'—': (totals.deltaPct>0?`+${totals.deltaPct}%`:`${totals.deltaPct}%`)}</span></div>
        </div>
      </CardHeader>
      <CardContent className='flex-1 flex flex-col'>
        <div className='w-full h-64'>
          <ChartContainer config={chartConfig} className='w-full h-full'>
            <ComposedChart data={data} margin={{ top: 10, left: 12, right: 12, bottom: 6 }}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis dataKey='key' tickLine={false} axisLine={false} height={38} tickMargin={10} allowDuplicatedCategory={false}
                     tick={{ fontSize:11 }} tickFormatter={(k:string)=> data.find(d=>d.key===k)?.label || ''} />
              <YAxis width={55} tick={{ fontSize:11 }} tickFormatter={(v:number)=> v>=1_000_000? `${Math.round(v/1_000_000)}M`: v>=1000? `${Math.round(v/1000)}k`: v} />
              <ReferenceLine y={0} stroke='var(--border)' />
              <Bar dataKey='value' fill='hsl(var(--primary)/0.25)' radius={[4,4,0,0]} />
              <Line type='monotone' dataKey='value' stroke='hsl(var(--primary))' strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r:4 }} />
              <Line type='monotone' dataKey='avg' stroke='hsl(var(--chart-2,var(--secondary)))' strokeDasharray='4 4' strokeWidth={2} dot={false} isAnimationActive={false} />
              <ChartTooltip cursor={{ stroke: 'hsl(var(--primary)/0.3)' }} content={<ChartTooltipContent hideLabel />}
                formatter={(v:number,name:string)=> {
                  if(name==='avg') return [ `KES ${Math.round(v).toLocaleString()}`, '7d Avg'];
                  return [ `KES ${Math.round(v).toLocaleString()}`, 'Revenue'];
                }}
                labelFormatter={(label:string)=> {
                  const found = data.find(d=>d.key===label);
                  if(!found) return label;
                  const d = new Date(found.key);
                  return d.toLocaleDateString(undefined,{ year:'numeric', month:'short', day:'numeric'});
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
