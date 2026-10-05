import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const START_HOUR = 7;
const END_HOUR = 21;

const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 48;

const SNAP_MINUTES = 15;
const PIXELS_PER_MINUTE =
  SLOT_HEIGHT / SLOT_MINUTES;

function WeekView({
  date,
  timezone,
  events = [],
  onCellClick,
  onRangeSelect,
  onEventClick,
  onEventMove,
  onEventResize,
}) {
  const [selection, setSelection] =
    useState(null);

  const selectionRef =
    useRef(null);

  const suppressClickRef =
    useRef(false);

  // =========================
  // WEEK DAYS
  // =========================

  const weekDays = useMemo(() => {
    const currentDate =
      new Date(date);

    const day =
      currentDate.getDay();

    const mondayOffset =
      day === 0
        ? -6
        : 1 - day;

    const monday =
      new Date(currentDate);

    monday.setDate(
      currentDate.getDate() +
        mondayOffset
    );

    monday.setHours(
      0,
      0,
      0,
      0
    );

    return Array.from(
      { length: 7 },
      (_, index) => {
        const weekDate =
          new Date(monday);

        weekDate.setDate(
          monday.getDate() +
            index
        );

        return weekDate;
      }
    );
  }, [date]);

  // =========================
  // TIME SLOTS
  // =========================

  const timeSlots =
    useMemo(() => {
      const slots = [];

      for (
        let hour = START_HOUR;
        hour < END_HOUR;
        hour++
      ) {
        slots.push({
          hour,
          minute: 0,
        });

        slots.push({
          hour,
          minute: 30,
        });
      }

      return slots;
    }, []);

  // =========================
  // FORMATTERS
  // =========================

  const formatDay = (day) =>
    new Intl.DateTimeFormat(
      "en-US",
      {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: timezone,
      }
    ).format(day);

  const formatTime = (
    hour,
    minute
  ) => {
    const tempDate =
      new Date();

    tempDate.setHours(
      hour,
      minute,
      0,
      0
    );

    return new Intl.DateTimeFormat(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    ).format(tempDate);
  };

  const formatEventTime = (
    value
  ) =>
    new Date(
      value
    ).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  // =========================
  // DATE HELPERS
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

  const createDateAtMinutes = (
    day,
    minutesFromMidnight
  ) => {
    const result =
      new Date(day);

    const hour =
      Math.floor(
        minutesFromMidnight /
          60
      );

    const minute =
      minutesFromMidnight %
      60;

    result.setHours(
      hour,
      minute,
      0,
      0
    );

    return result;
  };

  const snapMinutes = (
    minutes
  ) =>
    Math.round(
      minutes /
        SNAP_MINUTES
    ) * SNAP_MINUTES;

  // =========================
  // CELL CLICK
  // =========================

  const handleCellClick = (
    day,
    hour,
    minute
  ) => {
    if (
      suppressClickRef.current
    ) {
      suppressClickRef.current =
        false;

      return;
    }

    if (!onCellClick) {
      return;
    }

    const clickedDate =
      new Date(day);

    clickedDate.setHours(
      hour,
      minute,
      0,
      0
    );

    onCellClick(
      clickedDate
    );
  };

  // =========================
  // EMPTY RANGE SELECTION
  // =========================

  const getMinutesFromPointer = (
    mouseEvent,
    columnElement
  ) => {
    const rect =
      columnElement.getBoundingClientRect();

    const y =
      Math.max(
        0,
        Math.min(
          mouseEvent.clientY -
            rect.top,
          rect.height
        )
      );

    const minutesFromStart =
      y /
      PIXELS_PER_MINUTE;

    const absoluteMinutes =
      START_HOUR * 60 +
      minutesFromStart;

    const snapped =
      snapMinutes(
        absoluteMinutes
      );

    return Math.max(
      START_HOUR * 60,
      Math.min(
        END_HOUR * 60,
        snapped
      )
    );
  };

  const beginSelection = (
    mouseEvent,
    day
  ) => {
    // Left mouse button only.
    if (
      mouseEvent.button !== 0
    ) {
      return;
    }

    // Do not start empty-range
    // selection from an event.
    if (
      mouseEvent.target.closest(
        "[data-calendar-event='true']"
      )
    ) {
      return;
    }

    mouseEvent.preventDefault();

    const columnElement =
      mouseEvent.currentTarget;

    const startMinutes =
      getMinutesFromPointer(
        mouseEvent,
        columnElement
      );

    const initialSelection = {
      day,
      startMinutes,
      currentMinutes:
        startMinutes,
      moved: false,
    };

    selectionRef.current =
      initialSelection;

    setSelection(
      initialSelection
    );

    const handleMouseMove = (
      moveEvent
    ) => {
      const active =
        selectionRef.current;

      if (!active) {
        return;
      }

      const currentMinutes =
        getMinutesFromPointer(
          moveEvent,
          columnElement
        );

      const moved =
        currentMinutes !==
        active.startMinutes;

      const nextSelection = {
        ...active,
        currentMinutes,
        moved,
      };

      selectionRef.current =
        nextSelection;

      setSelection(
        nextSelection
      );
    };

    const finishSelection = (
      upEvent
    ) => {
      const active =
        selectionRef.current;

      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      window.removeEventListener(
        "mouseup",
        finishSelection
      );

      if (!active) {
        return;
      }

      const finalMinutes =
        getMinutesFromPointer(
          upEvent,
          columnElement
        );

      const hasDragged =
        active.moved ||
        finalMinutes !==
          active.startMinutes;

      selectionRef.current =
        null;

      setSelection(null);

      if (!hasDragged) {
        return;
      }

      suppressClickRef.current =
        true;

      let startMinutes =
        Math.min(
          active.startMinutes,
          finalMinutes
        );

      let endMinutes =
        Math.max(
          active.startMinutes,
          finalMinutes
        );

      // Minimum selectable
      // event = 15 minutes.
      if (
        startMinutes ===
        endMinutes
      ) {
        endMinutes +=
          SNAP_MINUTES;
      }

      endMinutes =
        Math.min(
          endMinutes,
          END_HOUR * 60
        );

      if (
        endMinutes <=
        startMinutes
      ) {
        return;
      }

      const startDate =
        createDateAtMinutes(
          day,
          startMinutes
        );

      const endDate =
        createDateAtMinutes(
          day,
          endMinutes
        );

      if (onRangeSelect) {
        onRangeSelect(
          startDate,
          endDate
        );
      } else if (
        onCellClick
      ) {
        // Fallback until
        // CalendarPage receives
        // Step 56.2.
        onCellClick(
          startDate
        );
      }
    };

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    window.addEventListener(
      "mouseup",
      finishSelection
    );
  };

  // =========================
  // ESC CANCELS SELECTION
  // =========================

  useEffect(() => {
    const handleKeyDown = (
      keyboardEvent
    ) => {
      if (
        keyboardEvent.key !==
        "Escape"
      ) {
        return;
      }

      if (
        !selectionRef.current
      ) {
        return;
      }

      selectionRef.current =
        null;

      setSelection(null);
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  // =========================
  // SELECTION PREVIEW
  // =========================

  const getSelectionStyle = (
    day
  ) => {
    if (
      !selection ||
      !isSameDay(
        selection.day,
        day
      )
    ) {
      return null;
    }

    const startMinutes =
      Math.min(
        selection.startMinutes,
        selection.currentMinutes
      );

    let endMinutes =
      Math.max(
        selection.startMinutes,
        selection.currentMinutes
      );

    if (
      endMinutes ===
      startMinutes
    ) {
      endMinutes =
        startMinutes +
        SNAP_MINUTES;
    }

    const calendarStart =
      START_HOUR * 60;

    return {
      top:
        (startMinutes -
          calendarStart) *
        PIXELS_PER_MINUTE,

      height: Math.max(
        SNAP_MINUTES *
          PIXELS_PER_MINUTE,
        (endMinutes -
          startMinutes) *
          PIXELS_PER_MINUTE
      ),

      startMinutes,
      endMinutes,
    };
  };

  // =========================
  // EVENT POSITION
  // =========================

  const getEventStyle = (
    calendarEvent
  ) => {
    const start =
      new Date(
        calendarEvent.start
      );

    const end =
      new Date(
        calendarEvent.end
      );

    const startMinutes =
      start.getHours() * 60 +
      start.getMinutes();

    const endMinutes =
      end.getHours() * 60 +
      end.getMinutes();

    const calendarStart =
      START_HOUR * 60;

    const topMinutes =
      startMinutes -
      calendarStart;

    const duration =
      Math.max(
        SNAP_MINUTES,
        endMinutes -
          startMinutes
      );

    return {
      top:
        topMinutes *
        PIXELS_PER_MINUTE,

      height:
        duration *
        PIXELS_PER_MINUTE,
    };
  };

  // =========================
  // EVENT DRAG START
  // =========================

  const handleDragStart = (
    dragEvent,
    calendarEvent
  ) => {
    dragEvent.stopPropagation();

    dragEvent.dataTransfer.effectAllowed =
      "move";

    dragEvent.dataTransfer.setData(
      "text/calendar-event-id",
      String(
        calendarEvent.id
      )
    );

    dragEvent.dataTransfer.setData(
      "text/calendar-event-start",
      calendarEvent.start
    );
  };

  // =========================
  // DROP EVENT
  // =========================

  const handleDrop = (
    dropEvent,
    targetDay,
    targetHour,
    targetMinute
  ) => {
    dropEvent.preventDefault();
    dropEvent.stopPropagation();

    const eventId =
      dropEvent.dataTransfer.getData(
        "text/calendar-event-id"
      );

    if (
      !eventId ||
      !onEventMove
    ) {
      return;
    }

    const calendarEvent =
      events.find(
        (event) =>
          String(event.id) ===
          String(eventId)
      );

    if (!calendarEvent) {
      return;
    }

    const oldStart =
      new Date(
        calendarEvent.start
      );

    const newStart =
      new Date(
        targetDay
      );

    newStart.setHours(
      targetHour,
      targetMinute,
      0,
      0
    );

    const oldDay =
      new Date(
        oldStart.getFullYear(),
        oldStart.getMonth(),
        oldStart.getDate()
      );

    const newDay =
      new Date(
        newStart.getFullYear(),
        newStart.getMonth(),
        newStart.getDate()
      );

    const dayDelta =
      Math.round(
        (newDay.getTime() -
          oldDay.getTime()) /
          86400000
      );

    const oldMinutes =
      oldStart.getHours() *
        60 +
      oldStart.getMinutes();

    const newMinutes =
      targetHour * 60 +
      targetMinute;

    const minuteDelta =
      newMinutes -
      oldMinutes;

    onEventMove(
      calendarEvent,
      minuteDelta,
      dayDelta
    );
  };

  // =========================
  // EXISTING BOTTOM RESIZE
  // =========================

  const handleResize = (
    mouseEvent,
    calendarEvent
  ) => {
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();

    if (!onEventResize) {
      return;
    }

    const startY =
      mouseEvent.clientY;

    const handleMouseUp = (
      upEvent
    ) => {
      const difference =
        upEvent.clientY -
        startY;

      const minutes =
        Math.round(
          difference /
            (PIXELS_PER_MINUTE *
              SNAP_MINUTES)
        ) * SNAP_MINUTES;

      if (minutes !== 0) {
        onEventResize(
          calendarEvent,
          minutes
        );
      }

      window.removeEventListener(
        "mouseup",
        handleMouseUp
      );
    };

    window.addEventListener(
      "mouseup",
      handleMouseUp
    );
  };

  // =========================
  // KEYBOARD EVENT OPEN
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
  // UI
  // =========================

  return (
    <div className="mt-6 overflow-x-auto">
      <div className="min-w-[900px]">

        {/* DAY HEADER */}
        <div className="grid grid-cols-[90px_repeat(7,1fr)] border-b border-gray-200">
          <div />

          {weekDays.map(
            (day) => (
              <div
                key={
                  day.toISOString()
                }
                className="border-l border-gray-200 p-3 text-center font-semibold text-gray-700"
              >
                {formatDay(day)}
              </div>
            )
          )}
        </div>

        {/* CALENDAR BODY */}
        <div className="grid grid-cols-[90px_repeat(7,1fr)]">

          {/* TIME COLUMN */}
          <div>
            {timeSlots.map(
              (slot) => (
                <div
                  key={`${slot.hour}-${slot.minute}`}
                  style={{
                    height:
                      SLOT_HEIGHT,
                  }}
                  className="border-b border-gray-200 pr-2 pt-1 text-right text-xs text-gray-500"
                >
                  {slot.minute === 0
                    ? formatTime(
                        slot.hour,
                        slot.minute
                      )
                    : ""}
                </div>
              )
            )}
          </div>

          {/* DAYS */}
          {weekDays.map(
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

              const preview =
                getSelectionStyle(
                  day
                );

              return (
                <div
                  key={
                    day.toISOString()
                  }
                  className="relative select-none border-l border-gray-200"
                  style={{
                    height:
                      timeSlots.length *
                      SLOT_HEIGHT,
                  }}
                  onMouseDown={(
                    mouseEvent
                  ) =>
                    beginSelection(
                      mouseEvent,
                      day
                    )
                  }
                >
                  {/* TIME CELLS */}
                  {timeSlots.map(
                    (slot) => (
                      <div
                        key={`${day.toISOString()}-${slot.hour}-${slot.minute}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`Create event at ${formatTime(
                          slot.hour,
                          slot.minute
                        )}`}
                        style={{
                          height:
                            SLOT_HEIGHT,
                        }}
                        className="border-b border-gray-200 hover:bg-blue-50"
                        onClick={() =>
                          handleCellClick(
                            day,
                            slot.hour,
                            slot.minute
                          )
                        }
                        onKeyDown={(
                          keyboardEvent
                        ) => {
                          if (
                            keyboardEvent.key ===
                              "Enter" ||
                            keyboardEvent.key ===
                              " "
                          ) {
                            keyboardEvent.preventDefault();

                            handleCellClick(
                              day,
                              slot.hour,
                              slot.minute
                            );
                          }
                        }}
                        onDragOver={(
                          dragEvent
                        ) => {
                          dragEvent.preventDefault();

                          dragEvent.dataTransfer.dropEffect =
                            "move";
                        }}
                        onDrop={(
                          dropEvent
                        ) =>
                          handleDrop(
                            dropEvent,
                            day,
                            slot.hour,
                            slot.minute
                          )
                        }
                      />
                    )
                  )}

                  {/* DRAG-CREATE PREVIEW */}
                  {preview && (
                    <div
                      aria-hidden="true"
                      style={{
                        position:
                          "absolute",
                        top:
                          preview.top,
                        height:
                          preview.height,
                        left: "4px",
                        right:
                          "4px",
                        zIndex: 20,
                        pointerEvents:
                          "none",
                      }}
                      className="rounded-md border-2 border-blue-500 bg-blue-200/70 px-2 py-1 text-xs font-semibold text-blue-900"
                    >
                      {formatTime(
                        Math.floor(
                          preview.startMinutes /
                            60
                        ),
                        preview.startMinutes %
                          60
                      )}

                      {" – "}

                      {formatTime(
                        Math.floor(
                          preview.endMinutes /
                            60
                        ) % 24,
                        preview.endMinutes %
                          60
                      )}
                    </div>
                  )}

                  {/* EVENTS */}
                  {dayEvents.map(
                    (
                      calendarEvent
                    ) => {
                      const {
                        top,
                        height,
                      } =
                        getEventStyle(
                          calendarEvent
                        );

                      return (
                        <div
                          key={`${calendarEvent.id}-${calendarEvent.start}`}
                          data-calendar-event="true"
                          role="button"
                          tabIndex={0}
                          aria-label={`Open event ${
                            calendarEvent.title ||
                            "Untitled"
                          }`}
                          draggable
                          onDragStart={(
                            dragEvent
                          ) =>
                            handleDragStart(
                              dragEvent,
                              calendarEvent
                            )
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
                          style={{
                            position:
                              "absolute",
                            top,
                            height,
                            left: "4px",
                            right:
                              "4px",
                            zIndex: 10,
                          }}
                          className="cursor-pointer overflow-hidden rounded-md bg-blue-600 px-2 py-1 text-xs text-white shadow hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                        >
                          <div className="truncate font-semibold">
                            {calendarEvent.title ||
                              "Untitled Event"}
                          </div>

                          <div className="truncate opacity-90">
                            {formatEventTime(
                              calendarEvent.start
                            )}

                            {" - "}

                            {formatEventTime(
                              calendarEvent.end
                            )}
                          </div>

                          {/* BOTTOM RESIZE HANDLE */}
                          <div
                            role="presentation"
                            aria-hidden="true"
                            onMouseDown={(
                              mouseEvent
                            ) =>
                              handleResize(
                                mouseEvent,
                                calendarEvent
                              )
                            }
                            className="absolute bottom-0 left-0 h-2 w-full cursor-ns-resize"
                          />
                        </div>
                      );
                    }
                  )}
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}

export default WeekView;