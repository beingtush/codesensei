"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SkillRadarProps {
  tracks: {
    name: string;
    accuracy: number;
    level: number;
    color: string;
  }[];
}

export default function SkillRadar({ tracks }: SkillRadarProps) {
  const data = tracks.map((t) => ({
    subject: t.name,
    accuracy: t.accuracy,
    level: t.level * 10, // scale level (1-10) to 0-100 range for the chart
    fullMark: 100,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Complete challenges to see your skill radar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#94A3B8", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "#475569", fontSize: 10 }}
          axisLine={false}
        />
        <Radar
          name="Accuracy"
          dataKey="accuracy"
          stroke="#22C55E"
          fill="#22C55E"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Radar
          name="Level"
          dataKey="level"
          stroke="#FBBF24"
          fill="#FBBF24"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1E293B",
            border: "1px solid #334155",
            borderRadius: "12px",
            fontSize: 12,
          }}
          labelStyle={{ color: "#CBD5E1" }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
