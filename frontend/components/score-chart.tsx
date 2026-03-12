"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export function ScoreChart({ correct, incorrect }: { correct: number; incorrect: number }) {
  const data = [
    { name: "Correct", value: correct, color: "#0F9D7A" },
    { name: "Incorrect", value: incorrect, color: "#F08C3E" },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={100}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
