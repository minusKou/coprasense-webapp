import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { gradeColors } from "@/lib/copraGrading";

export function GradeBarChart({ counts }) {
  const data = [
    { name: "Grade 1", value: counts[1] || 0 },
    { name: "Grade 2", value: counts[2] || 0 },
    { name: "Grade 3", value: counts[3] || 0 },
  ];
  return (
    <div className="w-full h-[190px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#E1DFD5" />
          <XAxis dataKey="name" tick={{ fill: "#8B978E", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: "#8B978E", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "#EFEEE8" }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
            {data.map((_, i) => (
              <Cell key={i} fill={[gradeColors[1], gradeColors[2], gradeColors[3]][i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GradeDoughnut({ counts }) {
  const data = [
    { name: "Grade 1", value: counts[1] || 0 },
    { name: "Grade 2", value: counts[2] || 0 },
    { name: "Grade 3", value: counts[3] || 0 },
  ].filter((d) => d.value > 0);
  const colors = [gradeColors[1], gradeColors[2], gradeColors[3]];
  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={62} outerRadius={88} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % 3]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendChart({ byDay }) {
  const data = Object.keys(byDay)
    .sort()
    .map((d) => ({ name: new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" }), batches: byDay[d] }));
  return (
    <div className="w-full h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#E1DFD5" />
          <XAxis dataKey="name" tick={{ fill: "#8B978E", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: "#8B978E", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "#EFEEE8" }} />
          <Bar dataKey="batches" fill={gradeColors[1]} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}