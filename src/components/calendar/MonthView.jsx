import { useMemo } from "react";

function MonthView({
  date,
  timezone,
  events = [],
  onCellClick,
  onEventClick,
}) {
  // =========================
  // MONTH CALENDAR DAYS
  // =========================

  const calendarDays = useMemo(() => {
    const currentDate =
      new Date(date);

    const year =
      currentDate.getFullYear();

    const month =
      currentDate.getMonth();

    const firstDayOfMonth =
      new Date(
        year,
        month,
        1
      );

    const lastDayOfMonth =
      new Date(
        year,
        month + 1,
        0
      );

    // Monday = first column
    const firstWeekDay =
      firstDayOfMonth.getDay();

    const daysBefore =
      firstWeekDay === 0
        ? 6
        : firstWeekDay - 1;

    const startDate =
      new Date(
        firstDayOfMonth
      );

    startDate.setDate(
      firstDayOfMonth.getDate() -
        daysBefore
    );

    const lastWeekDay =
      lastDayOfMonth.getDay();

    const daysAfter =
      lastWeekDay === 0
        ? 0
        : 7 - lastWeekDay;

    const endDate =
      new Date(
        lastDayOfMonth
      );

    endDate.setDate(
      lastDayOfMonth.getDate() +
        daysAfter
    );

    const days = [];

    const cursor =
      new Date(startDate);

    while (
      cursor <= endDate
    ) {
      days.push(
        new Date(cursor)
      );

      cursor.setDate(
        cursor.getDate() + 1
      );
    }

    return days;
  }, [date]);

  // =========================
  // HELPERS
  // =========================

  const isSameDay = (
    firstDate,
    secondDate
  ) => {
    const first =
      new Date(firstDate);

    const second =
      new Date(secondDate);

    return (
      first.getFullYear() ===
        second.getFullYear() &&
      first.getMonth() ===
        second.getMonth() &&
      first.getDate() ===
        second.getDate()
    );
  };

  const isToday = (
    day
  ) => {
    return isSameDay(
      day,
      new Date()
    );
  };

  const isCurrentMonth = (
    day
  ) => {
    const currentDate =
      new Date(date);

    return (
      day.getMonth() ===
        currentDate.getMonth() &&
      day.getFullYear() ===
        currentDate.getFullYear()
    );
  };

  const formatTime = (
    dateValue
  ) => {
    try {
      return new Intl.DateTimeFormat(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
          timeZone: timezone,
        }
      ).format(
        new Date(dateValue)
      );
    } catch {
      return "";
    }
  };

  const formatDateLabel = (
    day
  ) => {
    try {
      return new Intl.DateTimeFormat(
        "en-US",
        {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          timeZone: timezone,
        }
      ).format(day);
    } catch {
      return day.toDateString();
    }
  };

  // =========================
  // CREATE EVENT
  // =========================

  const handleDayClick = (
    day
  ) => {
    if (!onCellClick) {
      return;
    }

    const selectedDate =
      new Date(day);

    // Default new month-view
    // event to 9 AM.
    selectedDate.setHours(
      9,
      0,
      0,
      0
    );

    onCellClick(
      selectedDate
    );
  };

  // =========================
  // EVENT KEYBOARD SUPPORT
  // =========================

  const handleEventKeyDown = (
    keyboardEvent,
    calendarEvent
  ) => {
    if (
      keyboardEvent.key ===
        "Enter" ||
      keyboardEvent.key ===
        " "
    ) {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();

      onEventClick?.(
        calendarEvent
      );
    }
  };

  // =========================
  // WEEKDAY HEADER
  // =========================

  const weekdays = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  // =========================
  // UI
  // =========================

  return (
    <div className="mt-6 overflow-x-auto">

      <div className="min-w-[800px]">

        {/* WEEKDAY HEADER */}
        <div className="grid grid-cols-7 border-b border-gray-200">

          {weekdays.map(
            (weekday) => (
              <div
                key={
                  weekday
                }
                className="border-l border-gray-200 p-3 text-center text-sm font-semibold text-gray-700 first:border-l-0"
              >
                {weekday}
              </div>
            )
          )}

        </div>

        {/* MONTH GRID */}
        <div className="grid grid-cols-7 border-l border-gray-200">

          {calendarDays.map(
            (day) => {
              const dayEvents =
                events.filter(
                  (
                    calendarEvent
                  ) =>
                    isSameDay(
                      calendarEvent.start,
                      day
                    )
                );

              return (
                <div
                  key={
                    day.toISOString()
                  }
                  role={
                    onCellClick
                      ? "button"
                      : undefined
                  }
                  tabIndex={
                    onCellClick
                      ? 0
                      : undefined
                  }
                  aria-label={
                    onCellClick
                      ? `Create event on ${formatDateLabel(
                          day
                        )}`
                      : undefined
                  }
                  onClick={() =>
                    handleDayClick(
                      day
                    )
                  }
                  onKeyDown={(
                    keyboardEvent
                  ) => {
                    if (
                      !onCellClick
                    ) {
                      return;
                    }

                    if (
                      keyboardEvent.key ===
                        "Enter" ||
                      keyboardEvent.key ===
                        " "
                    ) {
                      keyboardEvent.preventDefault();

                      handleDayClick(
                        day
                      );
                    }
                  }}
                  className={`min-h-[130px] border-b border-r border-gray-200 p-2 align-top ${
                    isCurrentMonth(
                      day
                    )
                      ? "bg-white"
                      : "bg-gray-50"
                  } ${
                    onCellClick
                      ? "cursor-pointer hover:bg-blue-50"
                      : ""
                  }`}
                >

                  {/* DAY NUMBER */}
                  <div className="mb-2 flex justify-end">

                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                        isToday(
                          day
                        )
                          ? "bg-blue-600 font-semibold text-white"
                          : isCurrentMonth(
                              day
                            )
                          ? "text-gray-900"
                          : "text-gray-400"
                      }`}
                    >
                      {day.getDate()}
                    </span>

                  </div>

                  {/* EVENTS */}
                  <div className="space-y-1">

                    {dayEvents.map(
                      (
                        calendarEvent
                      ) => (
                        <div
                          key={`${calendarEvent.id}-${calendarEvent.start}`}
                          role="button"
                          tabIndex={0}
                          aria-label={`Open event ${
                            calendarEvent.title ||
                            "Untitled"
                          }`}
                          title={
                            calendarEvent.title ||
                            "Untitled Event"
                          }
                          onClick={(
                            clickEvent
                          ) => {
                            clickEvent.stopPropagation();

                            onEventClick?.(
                              calendarEvent
                            );
                          }}
                          onKeyDown={(
                            keyboardEvent
                          ) =>
                            handleEventKeyDown(
                              keyboardEvent,
                              calendarEvent
                            )
                          }
                          className="cursor-pointer truncate rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                        >
                          <span className="font-medium">
                            {formatTime(
                              calendarEvent.start
                            )}
                          </span>

                          {" "}

                          <span>
                            {calendarEvent.title ||
                              "Untitled Event"}
                          </span>
                        </div>
                      )
                    )}

                  </div>

                </div>
              );
            }
          )}

        </div>

      </div>
    </div>
  );
}

export default MonthView;