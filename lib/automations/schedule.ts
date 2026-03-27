const dayMap: Record<string, number> = {
  dimanche: 0,
  sunday: 0,
  lundi: 1,
  monday: 1,
  mardi: 2,
  tuesday: 2,
  mercredi: 3,
  wednesday: 3,
  jeudi: 4,
  thursday: 4,
  vendredi: 5,
  friday: 5,
  samedi: 6,
  saturday: 6,
};

export function computeNextWeeklyRun(config: { day?: string; time?: string }) {
  if (!config.day || !config.time) return null;
  const dayKey = config.day.toLowerCase();
  const targetDay = dayMap[dayKey];
  if (targetDay === undefined) return null;

  const [hourRaw, minuteRaw] = config.time.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw ?? 0);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);

  while (next.getDay() !== targetDay || next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}
