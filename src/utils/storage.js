const STORAGE_KEY = "calendarSchedulerData";
const SCHEMA_VERSION = 1;

export const saveCalendarData = (events) => {
  try {
    const data = {
      version: SCHEMA_VERSION,
      events,
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );
  } catch (error) {
    console.error("Failed to save calendar data:", error);
  }
};

export const loadCalendarData = () => {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);

    if (!rawData) {
      return null;
    }

    const data = JSON.parse(rawData);

    if (
      data.version !== SCHEMA_VERSION ||
      !Array.isArray(data.events)
    ) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return data.events;
  } catch (error) {
    console.error("Corrupted calendar data:", error);

    localStorage.removeItem(STORAGE_KEY);

    return null;
  }
};

export const clearCalendarData = () => {
  localStorage.removeItem(STORAGE_KEY);
};