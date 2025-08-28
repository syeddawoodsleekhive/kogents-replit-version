"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const queueData = [
  { name: "Queue 1", value: 120 },
  { name: "Queue 2", value: 100 },
  { name: "Queue 3", value: 80 },
  { name: "Queue 4", value: 60 },
  { name: "Queue 5", value: 40 },
];

export function MonitorQueueStats() {
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="font-semibold mb-2">Queue Size</div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={queueData} layout="vertical">
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" />
          <Tooltip />
          <Bar dataKey="value" fill="#6B7280" barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
