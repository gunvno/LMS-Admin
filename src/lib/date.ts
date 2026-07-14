type JavaDateTimeArray = readonly number[];

type JavaDateTimeObject = {
  year?: number;
  month?: number;
  monthValue?: number;
  day?: number;
  dayOfMonth?: number;
  hour?: number;
  minute?: number;
  second?: number;
  nano?: number;
  date?: JavaDateTimeObject;
  time?: JavaDateTimeObject;
};

function fromParts(parts: JavaDateTimeObject): Date | null {
  const datePart = parts.date || parts;
  const timePart = parts.time || parts;
  const year = Number(datePart.year);
  const month = Number(datePart.monthValue ?? datePart.month);
  const day = Number(datePart.dayOfMonth ?? datePart.day);

  if (![year, month, day].every(Number.isFinite)) return null;

  const date = new Date(
    year,
    month - 1,
    day,
    Number(timePart.hour || 0),
    Number(timePart.minute || 0),
    Number(timePart.second || 0),
    Math.floor(Number(timePart.nano || 0) / 1_000_000),
  );
  return Number.isFinite(date.getTime()) ? date : null;
}

export function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }

  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0, nano = 0] =
      value as JavaDateTimeArray;
    return fromParts({ year, month, day, hour, minute, second, nano });
  }

  if (typeof value === "number") {
    const timestamp = Math.abs(value) < 1_000_000_000_000 ? value * 1000 : value;
    const date = new Date(timestamp);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  if (typeof value === "object" && value !== null) {
    return fromParts(value as JavaDateTimeObject);
  }

  if (typeof value !== "string" || !value.trim()) return null;

  const input = value.trim();
  if (/^-?\d+$/.test(input)) {
    return parseDateValue(Number(input));
  }

  const normalized = input
    .replace(" ", "T")
    .replace(/(\.\d{3})\d+/, "$1");
  const date = new Date(normalized);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatDate(value: unknown, fallback = "-") {
  const date = parseDateValue(value);
  return date ? date.toLocaleDateString("vi-VN") : fallback;
}

export function formatDateTime(value: unknown, fallback = "-") {
  const date = parseDateValue(value);
  return date
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date)
    : fallback;
}

export function getDateTimestamp(value: unknown) {
  return parseDateValue(value)?.getTime() ?? 0;
}
