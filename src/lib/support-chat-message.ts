export type SupportMessageDateValue =
  | string
  | number
  | readonly number[]
  | Record<string, unknown>
  | null
  | undefined;

export type TimestampedSupportMessage = {
  id: string;
  createdAt?: SupportMessageDateValue;
  createdDate?: SupportMessageDateValue;
};

function fromDateParts(value: Record<string, unknown>): Date | null {
  const datePart = typeof value.date === "object" && value.date !== null
    ? value.date as Record<string, unknown>
    : value;
  const timePart = typeof value.time === "object" && value.time !== null
    ? value.time as Record<string, unknown>
    : value;
  const year = Number(datePart.year);
  const month = Number(datePart.monthValue ?? datePart.month);
  const day = Number(datePart.dayOfMonth ?? datePart.day);
  if (![year, month, day].every(Number.isFinite)) return null;

  const date = new Date(
    year,
    month - 1,
    day,
    Number(timePart.hour ?? 0),
    Number(timePart.minute ?? 0),
    Number(timePart.second ?? 0),
    Math.floor(Number(timePart.nano ?? 0) / 1_000_000),
  );
  return Number.isFinite(date.getTime()) ? date : null;
}

export function parseSupportMessageDate(value: SupportMessageDateValue): Date | null {
  if (Array.isArray(value)) {
    if (value.length < 3) return null;
    const [year, month, day, hour = 0, minute = 0, second = 0, nano = 0] = value.map(Number);
    if (![year, month, day, hour, minute, second, nano].every(Number.isFinite)) return null;
    return fromDateParts({ year, month, day, hour, minute, second, nano });
  }
  if (typeof value === "number") {
    const timestamp = Math.abs(value) < 1_000_000_000_000 ? value * 1000 : value;
    const date = new Date(timestamp);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  if (typeof value === "object" && value !== null) {
    return fromDateParts(value as Record<string, unknown>);
  }
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim().replace(" ", "T").replace(/(\.\d{3})\d+/, "$1");
  const date = new Date(normalized);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function normalizeSupportMessage<T extends TimestampedSupportMessage>(
  message: T,
  fallbackCreatedAt?: SupportMessageDateValue,
): T & { createdAt: string } {
  const createdAt = parseSupportMessageDate(message.createdAt ?? message.createdDate)
    ?? parseSupportMessageDate(fallbackCreatedAt);
  return {
    ...message,
    createdAt: createdAt?.toISOString() ?? "",
  };
}

export function sortSupportMessages<T extends TimestampedSupportMessage>(messages: readonly T[]): T[] {
  return [...messages].sort((left, right) => {
    const leftTime = parseSupportMessageDate(left.createdAt ?? left.createdDate)?.getTime();
    const rightTime = parseSupportMessageDate(right.createdAt ?? right.createdDate)?.getTime();
    if (leftTime === undefined && rightTime === undefined) return 0;
    if (leftTime === undefined) return 1;
    if (rightTime === undefined) return -1;
    return leftTime - rightTime;
  });
}

export function mergeSupportMessage<T extends TimestampedSupportMessage>(
  messages: readonly T[],
  incoming: T,
  fallbackCreatedAt: SupportMessageDateValue = Date.now(),
): T[] {
  const existingIndex = messages.findIndex((message) => message.id === incoming.id);
  const existingCreatedAt = existingIndex >= 0
    ? messages[existingIndex].createdAt ?? messages[existingIndex].createdDate
    : undefined;
  const normalizedIncoming = normalizeSupportMessage(
    incoming,
    existingCreatedAt ?? fallbackCreatedAt,
  );
  const next = existingIndex >= 0
    ? messages.map((message, index) => index === existingIndex ? normalizedIncoming : message)
    : [...messages, normalizedIncoming];
  return sortSupportMessages(next);
}
