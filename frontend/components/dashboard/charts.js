"use client";
// Chart conventions (see README → Data visualisation):
// one validated series hue, thin marks with 4px rounded data-ends, hairline
// horizontal grid only, no dual axes, a tooltip on every chart, and status
// colours reserved for patient condition (always shown with a label).
import Link from "next/link";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { CONDITION_MAP, GENDER_MAP } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

const SERIES = "var(--series-1)";
const axis = { tick: { fontSize: 12, fill: "var(--color-muted-foreground)" }, axisLine: false, tickLine: false };
const grid = <CartesianGrid stroke="var(--grid)" vertical={false} />;
const monthLabel = (m) => format(parseISO(`${m}-01`), "MMM ''yy");

function TooltipBox({ active, payload, label, labelFormatter = (l) => l, unit = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{labelFormatter(label, payload[0]?.payload)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: p.payload?.fill ?? p.color }} aria-hidden />
          <span className="font-semibold text-foreground tabular">{formatNumber(p.value)}</span> {unit}
        </p>
      ))}
    </div>
  );
}

export function AdmissionsTrend({ data }) {
  return (
    <ResponsiveContainer>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
        <defs>
          <linearGradient id="admFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES} stopOpacity={0.22} />
            <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
          </linearGradient>
        </defs>
        {grid}
        <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} minTickGap={12} />
        <YAxis allowDecimals={false} {...axis} width={44} />
        <Tooltip content={<TooltipBox labelFormatter={(m) => format(parseISO(`${m}-01`), "MMMM yyyy")} unit="admissions" />} cursor={{ stroke: "var(--color-muted-foreground)", strokeWidth: 1 }} />
        <Area type="monotone" dataKey="admissions" stroke={SERIES} strokeWidth={2} fill="url(#admFill)" activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--color-card)" }} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DailyAdmissions({ data }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 8, right: 0, left: -4, bottom: 0 }} barCategoryGap={2}>
        {grid}
        <XAxis dataKey="date" tickFormatter={(d) => format(parseISO(d), "d MMM")} {...axis} interval={6} />
        <YAxis allowDecimals={false} {...axis} width={44} />
        <Tooltip content={<TooltipBox labelFormatter={(d) => format(parseISO(d), "EEE, d MMM")} unit="admitted" />} cursor={{ fill: "var(--color-muted)" }} />
        <Bar dataKey="admissions" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function NewDoctorsChart({ data }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 8, right: 0, left: -4, bottom: 0 }}>
        {grid}
        <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} minTickGap={8} />
        <YAxis allowDecimals={false} {...axis} width={44} />
        <Tooltip content={<TooltipBox labelFormatter={(m) => format(parseISO(`${m}-01`), "MMMM yyyy")} unit="doctors joined" />} cursor={{ fill: "var(--color-muted)" }} />
        <Bar dataKey="newDoctors" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Ranked horizontal bars with the value printed at the end of each bar. */
export function RankedBars({ rows, unit, max }) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              {r.dot && <span className="size-2 shrink-0 rounded-full" style={{ background: r.dot }} aria-hidden />}
              {r.href ? <Link href={r.href} className="truncate hover:text-primary hover:underline">{r.label}</Link> : <span className="truncate">{r.label}</span>}
              {r.sub && <span className="hidden truncate text-xs text-muted-foreground sm:inline">{r.sub}</span>}
            </span>
            <span className="shrink-0 font-medium tabular">
              {formatNumber(r.value)} <span className="text-xs font-normal text-muted-foreground">{r.suffix ?? unit}</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted" title={`${r.label}: ${r.value} ${unit}`}>
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(r.value / top) * 100}%`, background: r.color ?? SERIES }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ConditionBars({ data, total }) {
  const rows = data.map((c) => {
    const meta = CONDITION_MAP[c.condition];
    return { key: c.condition, label: meta?.label ?? c.condition, value: c.count, color: meta?.color, dot: meta?.color, suffix: `· ${Math.round((c.count / (total || 1)) * 100)}%` };
  });
  return <RankedBars rows={rows} unit="patients" max={total} />;
}

export function AgeChart({ data }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 8, right: 0, left: -4, bottom: 0 }}>
        {grid}
        <XAxis dataKey="range" {...axis} />
        <YAxis allowDecimals={false} {...axis} width={44} />
        <Tooltip content={<TooltipBox labelFormatter={(r) => `Age ${r}`} unit="patients" />} cursor={{ fill: "var(--color-muted)" }} />
        <Bar dataKey="count" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Gender is identity, not magnitude → first three validated categorical slots.
const GENDER_COLORS = { female: "#2a78d6", male: "#eb6834", other: "#1baf7a" };

export function GenderSplit({ data, total }) {
  const rows = ["female", "male", "other"].map((g) => ({ g, count: data.find((d) => d.gender === g)?.count ?? 0 })).filter((r) => r.count);
  return (
    <div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Gender split">
        {rows.map((r) => <span key={r.g} style={{ width: `${(r.count / (total || 1)) * 100}%`, background: GENDER_COLORS[r.g] }} />)}
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-2">
        {rows.map((r) => (
          <li key={r.g}>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2 rounded-full" style={{ background: GENDER_COLORS[r.g] }} aria-hidden />{GENDER_MAP[r.g].label}</p>
            <p className="mt-0.5 font-display text-xl font-semibold tabular">{Math.round((r.count / (total || 1)) * 100)}%</p>
            <p className="text-xs text-muted-foreground tabular">{formatNumber(r.count)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

