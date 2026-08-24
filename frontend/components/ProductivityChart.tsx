"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface ProductivityChartProps {
  data: { date: string; completed: number }[];
}

export function ProductivityChart({ data }: ProductivityChartProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-[400px]">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Productivity Overview</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(val) => format(parseISO(val), 'MMM d')} 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelFormatter={(val) => format(parseISO(val as string), 'MMMM d, yyyy')}
            />
            <Line 
              type="monotone" 
              dataKey="completed" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} 
              activeDot={{ r: 6 }} 
              name="Tasks Completed"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ProductivityChartSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-[400px] animate-pulse flex flex-col">
      <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
      <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full"></div>
    </div>
  );
}
