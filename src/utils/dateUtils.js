// Convert Date object into YYYY-MM-DD format for URL
export const formatDateForUrl = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Convert YYYY-MM-DD from URL back into a Date object.
// Invalid values safely fall back to today's date.
export const parseDateFromUrl = (value) => {
  if (!value) {
    return new Date();
  }

  const parts = value.split("-");

  if (parts.length !== 3) {
    return new Date();
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  const date = new Date(year, month - 1, day);

  // JavaScript automatically changes invalid dates such as
  // 2026-02-31 into another date, so validate each part.
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return new Date();
  }

  return date;
};

// Add or subtract days
export const addDays = (date, days) => {
  const result = new Date(date);

  result.setDate(result.getDate() + days);

  return result;
};

// Add or subtract months
export const addMonths = (date, months) => {
  const result = new Date(date);

  result.setMonth(result.getMonth() + months);

  return result;
};

// Find Monday of the week containing the given date
export const getStartOfWeek = (date) => {
  const result = new Date(date);

  const day = result.getDay();

  // JavaScript:
  // Sunday = 0
  // Monday = 1
  // ...
  // Saturday = 6

  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);
  result.setHours(0, 0, 0, 0);

  return result;
};

// Example:
// October 2026
export const formatMonthYear = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
};
// Return all 7 dates of the week (Monday - Sunday)
export const getWeekDays = (date) => {
  const startOfWeek = getStartOfWeek(date);

  return Array.from({ length: 7 }, (_, index) =>
    addDays(startOfWeek, index)
  );
};

// Example: Mon
export const formatDayName = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(date);
};

// Example: 12
export const formatDayNumber = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
  }).format(date);
};

// Check whether a date is today
export const isToday = (date) => {
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};
export const getMonthCalendarDays = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  // First day of selected month
  const firstDayOfMonth = new Date(year, month, 1);

  // Start calendar from Monday of that week
  const calendarStart = getStartOfWeek(firstDayOfMonth);

  // 6 weeks x 7 days = 42 cells
  return Array.from({ length: 42 }, (_, index) =>
    addDays(calendarStart, index)
  );
};

export const isSameMonth = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
};