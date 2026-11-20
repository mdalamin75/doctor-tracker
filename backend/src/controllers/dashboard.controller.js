import { config } from "../config.js";
import { Doctor } from "../models/Doctor.js";
import { CONDITIONS, GENDERS, Patient } from "../models/Patient.js";
import { cached } from "../utils/cache.js";

const DAY = 86_400_000;
const tz = config.timezone;
const dayKey = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

/** Last `n` month keys ("YYYY-MM") in the app timezone, oldest first. */
function lastMonths(n) {
  const [y, m] = dayKey(new Date()).split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

/** Turns [{_id:key,count}] into a gap-free series over `keys`. */
const fill = (keys, rows) => {
  const map = new Map(rows.map((r) => [r._id, r.count]));
  return keys.map((k) => map.get(k) ?? 0);
};

const groupByDate = (field, format, since) => [
  { $match: { [field]: { $gte: since } } }, // index range scan on admittedOn / createdAt
  { $group: { _id: { $dateToString: { format, date: `$${field}`, timezone: tz } }, count: { $sum: 1 } } },
];

/**
 * GET /api/dashboard/stats?months=6
 *
 * Every metric is its own query and they all run in parallel. Counts use
 * index COUNT_SCANs and date series start with an index range $match.
 * (A single $facet would be one round trip, but sub-pipelines inside $facet
 * cannot use indexes, so every metric would scan the whole collection.)
 * The result is cached for 30 s and dropped on any write.
 */
export async function getStats(req, res) {
  const { months } = req.valid.query;
  const stats = await cached(`stats:${months}`, 30_000, () => computeStats(months));
  res.set("Cache-Control", "private, max-age=15");
  res.json(stats);
}

/** Index-backed COUNT_SCANs: one per enum value, much faster than a $group over the collection. */
const countBy = (field, values) =>
  Promise.all(values.map((v) => Patient.countDocuments({ [field]: v }))).then((counts) =>
    values.map((v, i) => ({ _id: v, count: counts[i] })).filter((r) => r.count > 0).sort((a, b) => b.count - a.count)
  );

async function computeStats(months) {
  const monthKeys = lastMonths(months);
  const [fy, fm] = monthKeys[0].split("-").map(Number);
  const monthsSince = new Date(Date.UTC(fy, fm - 1, 1) - 14 * 3_600_000); // tz-safe lower bound
  const dayKeys = Array.from({ length: 30 }, (_, i) => dayKey(new Date(Date.now() - (29 - i) * DAY)));
  const daysSince = new Date(Date.now() - 31 * DAY);

  const [
    totalDoctors,
    totalPatients,
    byCondition,
    byGender,
    ageGroups,
    admissionsMonthly,
    doctorsMonthly,
    admissionsDaily,
    [doctorBreakdown],
  ] = await Promise.all([
    Doctor.estimatedDocumentCount(),
    Patient.estimatedDocumentCount(),
    countBy("condition", CONDITIONS),
    countBy("gender", GENDERS),
    Patient.aggregate([
      { $bucket: { groupBy: "$age", boundaries: [0, 18, 35, 50, 65, 131], default: "unknown", output: { count: { $sum: 1 } } } },
    ]),
    Patient.aggregate(groupByDate("admittedOn", "%Y-%m", monthsSince)),
    Doctor.aggregate(groupByDate("createdAt", "%Y-%m", monthsSince)),
    Patient.aggregate(groupByDate("admittedOn", "%Y-%m-%d", daysSince)),
    Patient.aggregate([
      { $group: { _id: "$doctor", count: { $sum: 1 }, critical: { $sum: { $cond: [{ $eq: ["$condition", "critical"] }, 1, 0] } } } },
      { $lookup: { from: "doctors", localField: "_id", foreignField: "_id", as: "d", pipeline: [{ $project: { name: 1, specialization: 1 } }] } },
      { $unwind: "$d" },
      {
        $facet: {
          // Operates on ≤ #doctors grouped rows, so no index is needed here.
          top: [
            { $sort: { count: -1, "d.name": 1 } },
            { $limit: 10 },
            { $project: { _id: 0, doctorId: "$_id", name: "$d.name", specialization: "$d.specialization", count: 1, critical: 1 } },
          ],
          bySpecialization: [
            { $group: { _id: "$d.specialization", patients: { $sum: "$count" }, doctors: { $sum: 1 } } },
            { $sort: { patients: -1 } },
            { $project: { _id: 0, specialization: "$_id", patients: 1, doctors: 1 } },
          ],
        },
      },
    ]),
  ]);

  const conditionMap = Object.fromEntries(byCondition.map((c) => [c._id, c.count]));
  const daily = fill(dayKeys, admissionsDaily);
  const ageLabels = { 0: "0–17", 18: "18–34", 35: "35–49", 50: "50–64", 65: "65+" };

  return {
    totals: {
      doctors: totalDoctors,
      patients: totalPatients,
      avgPatientsPerDoctor: totalDoctors ? +(totalPatients / totalDoctors).toFixed(1) : 0,
      critical: conditionMap.critical ?? 0,
      admittedLast30Days: daily.reduce((a, b) => a + b, 0),
    },
    byCondition: byCondition.map((c) => ({ condition: c._id, count: c.count })),
    byGender: byGender.map((g) => ({ gender: g._id, count: g.count })),
    ageGroups: ageGroups.map((a) => ({ range: ageLabels[a._id] ?? "Unknown", count: a.count })),
    patientsPerDoctor: doctorBreakdown?.top ?? [],
    bySpecialization: doctorBreakdown?.bySpecialization ?? [],
    monthly: monthKeys.map((month, i) => ({
      month,
      admissions: fill(monthKeys, admissionsMonthly)[i],
      newDoctors: fill(monthKeys, doctorsMonthly)[i],
    })),
    daily: dayKeys.map((date, i) => ({ date, admissions: daily[i] })),
    generatedAt: new Date().toISOString(),
    timezone: tz,
  };
}
