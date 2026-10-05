import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import {
  addDays,
  addMonths,
  formatDateForUrl,
  parseDateFromUrl,
} from "../utils/dateUtils";

const SUPPORTED_TIMEZONES = [
  "Asia/Kolkata",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export function useCalendar() {
  const [searchParams, setSearchParams] = useSearchParams();

  // -----------------------------
  // VIEW
  // -----------------------------
  const viewParam = searchParams.get("view");

  const view =
    viewParam === "week" || viewParam === "month"
      ? viewParam
      : "week";

  // -----------------------------
  // DATE
  // -----------------------------
  const date = parseDateFromUrl(searchParams.get("date"));

  // -----------------------------
  // TIMEZONE
  // -----------------------------
  const browserTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const timezoneParam = searchParams.get("timezone");

  const defaultTimezone = SUPPORTED_TIMEZONES.includes(browserTimezone)
    ? browserTimezone
    : "UTC";

  const timezone =
    timezoneParam && SUPPORTED_TIMEZONES.includes(timezoneParam)
      ? timezoneParam
      : defaultTimezone;

  // -----------------------------
  // ATTENDEE FILTER
  // -----------------------------
  const attendee = searchParams.get("attendee") || "";

  // -----------------------------
  // Ensure required values exist
  // in the URL
  // -----------------------------
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    let changed = false;

    if (params.get("view") !== view) {
      params.set("view", view);
      changed = true;
    }

    const validDate = formatDateForUrl(date);

    if (params.get("date") !== validDate) {
      params.set("date", validDate);
      changed = true;
    }

    if (params.get("timezone") !== timezone) {
      params.set("timezone", timezone);
      changed = true;
    }

    // Keep attendee filter represented in URL.
    if (!params.has("attendee")) {
      params.set("attendee", "");
      changed = true;
    }

    if (changed) {
      setSearchParams(params, {
        replace: true,
      });
    }
  }, [
    searchParams,
    setSearchParams,
    view,
    date,
    timezone,
  ]);

  // -----------------------------
  // Generic URL updater
  // -----------------------------
  const updateParams = (changes) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(changes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });

    setSearchParams(params);
  };

  // -----------------------------
  // Navigation
  // -----------------------------
  const goToToday = () => {
    updateParams({
      date: formatDateForUrl(new Date()),
    });
  };

  const goPrevious = () => {
    const newDate =
      view === "week"
        ? addDays(date, -7)
        : addMonths(date, -1);

    updateParams({
      date: formatDateForUrl(newDate),
    });
  };

  const goNext = () => {
    const newDate =
      view === "week"
        ? addDays(date, 7)
        : addMonths(date, 1);

    updateParams({
      date: formatDateForUrl(newDate),
    });
  };

  // -----------------------------
  // View
  // -----------------------------
  const changeView = (newView) => {
    if (newView !== "week" && newView !== "month") {
      return;
    }

    updateParams({
      view: newView,
    });
  };

  // -----------------------------
  // Timezone
  // -----------------------------
  const changeTimezone = (newTimezone) => {
    if (!SUPPORTED_TIMEZONES.includes(newTimezone)) {
      return;
    }

    updateParams({
      timezone: newTimezone,
    });
  };

  // -----------------------------
  // Attendee
  // -----------------------------
  const changeAttendee = (attendeeId) => {
    updateParams({
      attendee: attendeeId || "",
    });
  };

  return {
    view,
    date,
    timezone,
    attendee,

    supportedTimezones: SUPPORTED_TIMEZONES,

    goToToday,
    goPrevious,
    goNext,

    changeView,
    changeTimezone,
    changeAttendee,

    updateParams,
  };
}