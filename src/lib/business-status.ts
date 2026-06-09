const dayAliases: Record<string, number> = {
  dom: 0,
  domingo: 0,
  lun: 1,
  lunes: 1,
  mar: 2,
  martes: 2,
  mie: 3,
  miercoles: 3,
  jue: 4,
  jueves: 4,
  vie: 5,
  viernes: 5,
  sab: 6,
  sabado: 6
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function parseTimeToMinutes(value: string) {
  const [hours, minutes = '0'] = value.split(':');
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);

  if (!Number.isFinite(parsedHours) || !Number.isFinite(parsedMinutes)) return null;
  return parsedHours * 60 + parsedMinutes;
}

function isDayInsideRange(currentDay: number, startDay: number, endDay: number) {
  if (startDay <= endDay) return currentDay >= startDay && currentDay <= endDay;
  return currentDay >= startDay || currentDay <= endDay;
}

function matchesCurrentDay(text: string, currentDay: number) {
  if (!text.trim()) return true;

  const normalized = normalizeText(text);
  const rangeMatch = normalized.match(/\b([a-z]+)\s+a\s+([a-z]+)\b/);

  if (rangeMatch) {
    const startDay = dayAliases[rangeMatch[1]];
    const endDay = dayAliases[rangeMatch[2]];
    if (startDay !== undefined && endDay !== undefined) return isDayInsideRange(currentDay, startDay, endDay);
  }

  const mentionedDays = Object.entries(dayAliases)
    .filter(([alias]) => normalized.includes(alias))
    .map(([, day]) => day);

  return mentionedDays.length === 0 || mentionedDays.includes(currentDay);
}

export function isBusinessOpenNow(schedule?: string | null, now = new Date()) {
  if (!schedule) return false;

  const normalizedSchedule = normalizeText(schedule);
  if (normalizedSchedule.includes('24')) return true;
  if (normalizedSchedule.includes('cerrado')) return false;

  const timeMatch = normalizedSchedule.match(/(\d{1,2}:\d{2})\s*[-a]\s*(\d{1,2}:\d{2})/);
  if (!timeMatch) return false;

  const opensAt = parseTimeToMinutes(timeMatch[1]);
  const closesAt = parseTimeToMinutes(timeMatch[2]);
  if (opensAt === null || closesAt === null) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const matchesDay = matchesCurrentDay(normalizedSchedule, now.getDay());
  if (!matchesDay) return false;

  if (opensAt <= closesAt) return currentMinutes >= opensAt && currentMinutes <= closesAt;
  return currentMinutes >= opensAt || currentMinutes <= closesAt;
}
