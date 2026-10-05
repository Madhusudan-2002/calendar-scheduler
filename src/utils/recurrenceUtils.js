import { addDays } from "./dateUtils";

export const RECURRENCE_OPTIONS = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export const generateRecurringEvents = (
  event,
  rangeStart,
  rangeEnd
) => {
  if (!event.recurrence || event.recurrence === "none") {
    return [event];
  }

  const occurrences = [];

  const originalStart = new Date(event.start);
  const originalEnd = new Date(event.end);

  const duration =
    originalEnd.getTime() - originalStart.getTime();

  let currentStart = new Date(originalStart);

  while (currentStart <= rangeEnd) {
    if (currentStart >= rangeStart) {
      const currentEnd = new Date(
        currentStart.getTime() + duration
      );

      occurrences.push({
        ...event,
        id: `${event.id}-${currentStart.toISOString()}`,
        originalEventId: event.id,
        start: currentStart.toISOString(),
        end: currentEnd.toISOString(),
        isOccurrence: true,
      });
    }

    if (event.recurrence === "daily") {
      currentStart = addDays(currentStart, 1);
    } else if (event.recurrence === "weekly") {
      currentStart = addDays(currentStart, 7);
    } else if (event.recurrence === "monthly") {
      const next = new Date(currentStart);
      next.setMonth(next.getMonth() + 1);
      currentStart = next;
    } else {
      break;
    }
  }

  return occurrences;
};

export const expandRecurringEvents = (
  events,
  rangeStart,
  rangeEnd
) => {
  return events.flatMap((event) =>
    generateRecurringEvents(
      event,
      rangeStart,
      rangeEnd
    )
  );
};