import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useCalendar,
} from "../hooks/useCalendar";

import CalendarHeader from "../components/calendar/CalendarHeader";
import WeekView from "../components/calendar/WeekView";
import MonthView from "../components/calendar/MonthView";
import EventModal from "../components/calendar/EventModal";
import ReminderToast from "../components/calendar/ReminderToast";

import {
  getSeedTodos,
} from "../services/eventService";

import {
  getUsers,
} from "../services/userService";

import {
  syncCalendarEvents,
} from "../services/syncService";

import {
  mapTodosToEvents,
} from "../utils/eventMapper";

import {
  loadCalendarData,
  saveCalendarData,
} from "../utils/storage";

import {
  snapToMinutes,
} from "../utils/timeUtils";

import {
  expandRecurringEvents,
} from "../utils/recurrenceUtils";

function CalendarPage() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();

  const {
    view,
    date,
    timezone,
    attendee,
    supportedTimezones,

    goToToday,
    goPrevious,
    goNext,

    changeView,
    changeTimezone,
    changeAttendee,
  } = useCalendar();

  // =========================
  // STATE
  // =========================

  const [
    events,
    setEvents,
  ] = useState([]);

  const [
    users,
    setUsers,
  ] = useState([]);

  const [
    eventsLoading,
    setEventsLoading,
  ] = useState(true);

  const [
    eventsError,
    setEventsError,
  ] = useState("");

  const [
    isEventModalOpen,
    setIsEventModalOpen,
  ] = useState(false);

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(null);

  const [
    eventToEdit,
    setEventToEdit,
  ] = useState(null);

  const [
    activeReminder,
    setActiveReminder,
  ] = useState(null);

  const [
    firedReminders,
    setFiredReminders,
  ] = useState(
    () => new Set()
  );

  // =========================
  // SYNC STATUS
  // =========================

  const [
    syncStatus,
    setSyncStatus,
  ] = useState("idle");

  // =========================
  // UNDO / REDO
  // =========================

  const [
    undoStack,
    setUndoStack,
  ] = useState([]);

  const [
    redoStack,
    setRedoStack,
  ] = useState([]);

  // =========================
  // REFS
  // =========================

  const eventsRef =
    useRef([]);

  // Used to identify the latest
  // fake API sync request.
  const syncRequestIdRef =
    useRef(0);

  useEffect(() => {
    eventsRef.current =
      events;
  }, [events]);

  // =========================
  // CLONE EVENTS
  // =========================

  const cloneEvents = (
    value
  ) => {
    return value.map(
      (event) => ({
        ...event,

        attendees:
          Array.isArray(
            event.attendees
          )
            ? [
                ...event.attendees,
              ]
            : [],
      })
    );
  };

  // =========================
  // SYNC + RACE PROTECTION
  // =========================

  const syncWithServer = async (
    updatedEvents,
    rollbackEvents = null
  ) => {
    // Generate a unique number
    // for this request.
    const requestId =
      ++syncRequestIdRef.current;

    setSyncStatus(
      "saving"
    );

    try {
      await syncCalendarEvents(
        updatedEvents
      );

      // If another request started
      // after this one, ignore this
      // old response.
      if (
        requestId !==
        syncRequestIdRef.current
      ) {
        return false;
      }

      setSyncStatus(
        "saved"
      );

      setTimeout(() => {
        // Only the latest request
        // can clear the status.
        if (
          requestId ===
          syncRequestIdRef.current
        ) {
          setSyncStatus(
            "idle"
          );
        }
      }, 2000);

      return true;
    } catch (error) {
      console.error(
        "Calendar sync failed:",
        error
      );

      // Ignore failure from an old
      // request. It must not rollback
      // newer calendar changes.
      if (
        requestId !==
        syncRequestIdRef.current
      ) {
        return false;
      }

      // Latest request failed,
      // so rollback.
      if (rollbackEvents) {
        const restoredEvents =
          cloneEvents(
            rollbackEvents
          );

        eventsRef.current =
          restoredEvents;

        setEvents(
          restoredEvents
        );

        saveCalendarData(
          restoredEvents
        );
      }

      setSyncStatus(
        "rollback"
      );

      setTimeout(() => {
        if (
          requestId ===
          syncRequestIdRef.current
        ) {
          setSyncStatus(
            "idle"
          );
        }
      }, 3000);

      return false;
    }
  };

  // =========================
  // APPLY EVENT CHANGE
  // =========================

  const applyEventChange = (
    updatedEvents
  ) => {
    const previousEvents =
      cloneEvents(
        eventsRef.current
      );

    const nextEvents =
      cloneEvents(
        updatedEvents
      );

    setUndoStack(
      (previous) => [
        ...previous,
        previousEvents,
      ]
    );

    // New action clears redo history.
    setRedoStack([]);

    eventsRef.current =
      nextEvents;

    setEvents(
      nextEvents
    );

    saveCalendarData(
      nextEvents
    );

    // Optimistic update.
    // Rollback if latest sync fails.
    syncWithServer(
      nextEvents,
      previousEvents
    );
  };

  // =========================
  // UNDO
  // =========================

  const handleUndo = () => {
    if (
      undoStack.length === 0
    ) {
      return;
    }

    const previousEvents =
      cloneEvents(
        undoStack[
          undoStack.length - 1
        ]
      );

    const currentEvents =
      cloneEvents(
        eventsRef.current
      );

    setUndoStack(
      (previous) =>
        previous.slice(
          0,
          -1
        )
    );

    setRedoStack(
      (previous) => [
        ...previous,
        currentEvents,
      ]
    );

    eventsRef.current =
      previousEvents;

    setEvents(
      previousEvents
    );

    saveCalendarData(
      previousEvents
    );

    syncWithServer(
      previousEvents,
      currentEvents
    );
  };

  // =========================
  // REDO
  // =========================

  const handleRedo = () => {
    if (
      redoStack.length === 0
    ) {
      return;
    }

    const nextEvents =
      cloneEvents(
        redoStack[
          redoStack.length - 1
        ]
      );

    const currentEvents =
      cloneEvents(
        eventsRef.current
      );

    setRedoStack(
      (previous) =>
        previous.slice(
          0,
          -1
        )
    );

    setUndoStack(
      (previous) => [
        ...previous,
        currentEvents,
      ]
    );

    eventsRef.current =
      nextEvents;

    setEvents(
      nextEvents
    );

    saveCalendarData(
      nextEvents
    );

    syncWithServer(
      nextEvents,
      currentEvents
    );
  };

  // =========================
  // KEYBOARD UNDO / REDO
  // =========================

  useEffect(() => {
    const handleKeyDown = (
      event
    ) => {
      const isModifier =
        event.metaKey ||
        event.ctrlKey;

      if (!isModifier) {
        return;
      }

      const key =
        event.key.toLowerCase();

      const activeElement =
        document.activeElement;

      const isTyping =
        activeElement?.tagName ===
          "INPUT" ||
        activeElement?.tagName ===
          "TEXTAREA" ||
        activeElement?.tagName ===
          "SELECT" ||
        activeElement?.isContentEditable;

      // Keep normal browser/text
      // undo while typing.
      if (isTyping) {
        return;
      }

      // Cmd/Ctrl + Z = Undo
      if (
        key === "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        handleUndo();

        return;
      }

      // Cmd/Ctrl + Shift + Z = Redo
      if (
        key === "z" &&
        event.shiftKey
      ) {
        event.preventDefault();

        handleRedo();

        return;
      }

      // Ctrl + Y = Redo
      if (
        key === "y" &&
        event.ctrlKey
      ) {
        event.preventDefault();

        handleRedo();
      }
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
  }, [
    undoStack,
    redoStack,
  ]);

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    let ignore = false;

    const loadEvents =
      async () => {
        setEventsLoading(
          true
        );

        setEventsError("");

        try {
          const storedEvents =
            loadCalendarData();

          if (storedEvents) {
            if (!ignore) {
              eventsRef.current =
                storedEvents;

              setEvents(
                storedEvents
              );
            }
          } else {
            const data =
              await getSeedTodos(
                100,
                0
              );

            const mappedEvents =
              mapTodosToEvents(
                data.todos || []
              );

            if (!ignore) {
              eventsRef.current =
                mappedEvents;

              setEvents(
                mappedEvents
              );

              saveCalendarData(
                mappedEvents
              );
            }
          }

          const usersData =
            await getUsers();

          if (!ignore) {
            setUsers(
              usersData.users ||
                []
            );
          }
        } catch (error) {
          if (!ignore) {
            setEventsError(
              error.message ||
                "Failed to load calendar data."
            );
          }
        } finally {
          if (!ignore) {
            setEventsLoading(
              false
            );
          }
        }
      };

    loadEvents();

    return () => {
      ignore = true;
    };
  }, []);

  // =========================
  // REMINDERS
  // =========================

  useEffect(() => {
    const checkReminders =
      () => {
        const now =
          Date.now();

        events.forEach(
          (
            calendarEvent
          ) => {
            if (
              !calendarEvent.reminder ||
              calendarEvent.reminder ===
                "none"
            ) {
              return;
            }

            const reminderMinutes =
              Number(
                calendarEvent.reminder
              );

            if (
              Number.isNaN(
                reminderMinutes
              )
            ) {
              return;
            }

            const eventStart =
              new Date(
                calendarEvent.start
              ).getTime();

            const reminderTime =
              eventStart -
              reminderMinutes *
                60 *
                1000;

            const reminderKey =
              `${calendarEvent.id}-${calendarEvent.start}-${calendarEvent.reminder}`;

            const shouldFire =
              now >=
                reminderTime &&
              now <
                eventStart &&
              !firedReminders.has(
                reminderKey
              );

            if (shouldFire) {
              setActiveReminder(
                calendarEvent
              );

              setFiredReminders(
                (
                  previous
                ) => {
                  const updated =
                    new Set(
                      previous
                    );

                  updated.add(
                    reminderKey
                  );

                  return updated;
                }
              );
            }
          }
        );
      };

    checkReminders();

    const intervalId =
      setInterval(
        checkReminders,
        30000
      );

    return () => {
      clearInterval(
        intervalId
      );
    };
  }, [
    events,
    firedReminders,
  ]);

  // =========================
  // RECURRENCE
  // =========================

  const rangeStart =
    new Date(
      date.getFullYear(),
      date.getMonth() - 1,
      1
    );

  const rangeEnd =
    new Date(
      date.getFullYear(),
      date.getMonth() + 2,
      0,
      23,
      59,
      59
    );

  const displayEvents =
    expandRecurringEvents(
      events,
      rangeStart,
      rangeEnd
    );

  // =========================
  // ATTENDEE FILTER
  // =========================

  const filteredEvents =
    attendee
      ? displayEvents.filter(
          (
            calendarEvent
          ) => {
            const organizerMatch =
              String(
                calendarEvent.organizerId
              ) ===
              String(
                attendee
              );

            const attendeeMatch =
              Array.isArray(
                calendarEvent.attendees
              ) &&
              calendarEvent.attendees.some(
                (id) =>
                  String(id) ===
                  String(
                    attendee
                  )
              );

            return (
              organizerMatch ||
              attendeeMatch
            );
          }
        )
      : displayEvents;

  // =========================
  // CREATE EVENT
  // =========================

  const handleCellClick = (
    clickedDate
  ) => {
    const snappedDate =
      snapToMinutes(
        clickedDate
      );
      
    setEventToEdit(null);

    setSelectedDate(
      snappedDate
    );

    setIsEventModalOpen(
      true
    );
  };
  const handleRangeSelect = (start, end) => {
  const snappedStart =
    snapToMinutes(start);

  const snappedEnd =
    snapToMinutes(end);

  setEventToEdit(null);

  setSelectedDate(
    snappedStart
  );

  setSelectedEndDate(
    snappedEnd
  );

  setIsEventModalOpen(true);
};

  // =========================
  // EDIT EVENT
  // =========================

  const handleEventClick = (
    calendarEvent
  ) => {
    setSelectedDate(null);

    if (
      calendarEvent.originalEventId
    ) {
      const originalEvent =
        events.find(
          (event) =>
            event.id ===
            calendarEvent.originalEventId
        );

      setEventToEdit(
        originalEvent ||
          calendarEvent
      );
    } else {
      setEventToEdit(
        calendarEvent
      );
    }

    setIsEventModalOpen(
      true
    );
  };

  // =========================
  // CLOSE MODAL
  // =========================

  const handleCloseModal =
    () => {
      setIsEventModalOpen(
        false
      );

      setSelectedDate(
        null
      );

      setEventToEdit(
        null
      );
    };

  // =========================
  // SAVE / UPDATE EVENT
  // =========================

  const handleSaveEvent = (
    eventData
  ) => {
    let updatedEvents;

    if (eventToEdit) {
      const originalId =
        eventToEdit.originalEventId ||
        eventToEdit.id;

      updatedEvents =
        events.map(
          (event) =>
            event.id ===
            originalId
              ? {
                  ...event,

                  title:
                    eventData.title,

                  start:
                    new Date(
                      eventData.start
                    ).toISOString(),

                  end:
                    new Date(
                      eventData.end
                    ).toISOString(),

                  attendees:
                    eventData.attendees ||
                    [],

                  recurrence:
                    eventData.recurrence ||
                    "none",

                  reminder:
                    eventData.reminder ||
                    "none",
                }
              : event
        );
    } else {
      const newEvent = {
        id: `local-${Date.now()}`,

        title:
          eventData.title,

        start:
          new Date(
            eventData.start
          ).toISOString(),

        end:
          new Date(
            eventData.end
          ).toISOString(),

        organizerId:
          user?.id ||
          null,

        attendees:
          eventData.attendees ||
          [],

        allDay: false,

        recurrence:
          eventData.recurrence ||
          "none",

        reminder:
          eventData.reminder ||
          "none",

        source: "local",
      };

      updatedEvents = [
        ...events,
        newEvent,
      ];
    }

    applyEventChange(
      updatedEvents
    );

    handleCloseModal();
  };

  // =========================
  // DELETE EVENT
  // =========================

  const handleDeleteEvent = (
    eventId
  ) => {
    const updatedEvents =
      events.filter(
        (event) =>
          event.id !==
          eventId
      );

    applyEventChange(
      updatedEvents
    );

    handleCloseModal();
  };

  // =========================
  // DRAG / MOVE EVENT
  // =========================

  const handleEventMove = (
    calendarEvent,
    minutes,
    dayDelta = 0
  ) => {
    const eventId =
      calendarEvent.originalEventId ||
      calendarEvent.id;

    const originalEvent =
      events.find(
        (event) =>
          event.id ===
          eventId
      );

    if (!originalEvent) {
      return;
    }

    const minuteMilliseconds =
      minutes *
      60 *
      1000;

    const dayMilliseconds =
      dayDelta *
      24 *
      60 *
      60 *
      1000;

    const totalMovement =
      minuteMilliseconds +
      dayMilliseconds;

    const oldStart =
      new Date(
        originalEvent.start
      ).getTime();

    const oldEnd =
      new Date(
        originalEvent.end
      ).getTime();

    const newStart =
      new Date(
        oldStart +
          totalMovement
      );

    const newEnd =
      new Date(
        oldEnd +
          totalMovement
      );

    const updatedEvents =
      events.map(
        (event) =>
          event.id ===
          eventId
            ? {
                ...event,

                start:
                  newStart.toISOString(),

                end:
                  newEnd.toISOString(),
              }
            : event
      );

    applyEventChange(
      updatedEvents
    );
  };

  // =========================
  // RESIZE EVENT
  // =========================

  const handleEventResize = (
  calendarEvent,
  minutes,
  edge = "end"
) => {
    const eventId =
      calendarEvent.originalEventId ||
      calendarEvent.id;

    const originalEvent =
      events.find(
        (event) =>
          event.id ===
          eventId
      );

    if (!originalEvent) {
      return;
    }

    const milliseconds =
      minutes *
      60 *
      1000;

    
      new Date(
        originalEvent.start
      ).getTime();

   const oldStartTime =
  new Date(
    originalEvent.start
  ).getTime();

const oldEndTime =
  new Date(
    originalEvent.end
  ).getTime();

const minimumDuration =
  15 *
  60 *
  1000;

let newStartTime =
  oldStartTime;

let newEndTime =
  oldEndTime;

if (edge === "start") {
  // Top-edge resize
  newStartTime =
    oldStartTime +
    milliseconds;

  // Event must remain at least
  // 15 minutes long.
  const maximumStartTime =
    oldEndTime -
    minimumDuration;

  if (
    newStartTime >
    maximumStartTime
  ) {
    newStartTime =
      maximumStartTime;
  }
} else {
  // Bottom-edge resize
  newEndTime =
    oldEndTime +
    milliseconds;

  // Event must remain at least
  // 15 minutes long.
  const minimumEndTime =
    oldStartTime +
    minimumDuration;

  if (
    newEndTime <
    minimumEndTime
  ) {
    newEndTime =
      minimumEndTime;
  }
}

    const updatedEvents =
      events.map(
        (event) =>
          event.id ===
          eventId
            ? {
    ...event,

    start:
      new Date(
        newStartTime
      ).toISOString(),

    end:
      new Date(
        newEndTime
      ).toISOString(),
  }
            : event
      );

    applyEventChange(
      updatedEvents
    );
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout =
    () => {
      logout();

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    };

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <div className="max-w-6xl mx-auto bg-white shadow rounded-xl p-6">

        {/* APPLICATION HEADER */}
        <div className="flex justify-between items-center">

          <div>
            <h1 className="text-2xl font-bold">
              Calendar Scheduler
            </h1>

            <p className="text-gray-500">
              Welcome{" "}
              {user?.firstName ||
                user?.username}
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>

        </div>

        {/* CALENDAR */}
        <div className="mt-8">

          <CalendarHeader
            view={view}
            date={date}
            timezone={
              timezone
            }
            timezones={
              supportedTimezones
            }
            attendee={
              attendee
            }
            users={users}
            onToday={
              goToToday
            }
            onPrevious={
              goPrevious
            }
            onNext={
              goNext
            }
            onViewChange={
              changeView
            }
            onTimezoneChange={
              changeTimezone
            }
            onAttendeeChange={
              changeAttendee
            }
          />

          {/* UNDO / REDO + SYNC STATUS */}
          <div className="mt-4 flex items-center gap-2">

            <button
              type="button"
              onClick={
                handleUndo
              }
              disabled={
                undoStack.length ===
                0
              }
              aria-label="Undo last calendar change"
              title="Undo (Command/Ctrl + Z)"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ↶ Undo

              <span className="ml-2 text-xs text-gray-400">
                ⌘Z
              </span>
            </button>

            <button
              type="button"
              onClick={
                handleRedo
              }
              disabled={
                redoStack.length ===
                0
              }
              aria-label="Redo last calendar change"
              title="Redo (Command/Ctrl + Shift + Z)"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ↷ Redo

              <span className="ml-2 text-xs text-gray-400">
                ⇧⌘Z
              </span>
            </button>

            {/* SYNC STATUS */}
            <div
              aria-live="polite"
              className="ml-2 text-sm font-medium"
            >
              {syncStatus ===
                "saving" && (
                <span className="text-blue-600">
                  Saving...
                </span>
              )}

              {syncStatus ===
                "saved" && (
                <span className="text-green-600">
                  ✓ Saved
                </span>
              )}

              {syncStatus ===
                "rollback" && (
                <span
                  role="alert"
                  className="text-red-600"
                >
                  ⚠ Sync failed — change rolled back
                </span>
              )}
            </div>

          </div>

          {/* LOADING */}
          {eventsLoading && (
            <div
              role="status"
              className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700"
            >
              Loading calendar
              data...
            </div>
          )}

          {/* ERROR */}
          {eventsError && (
            <div
              role="alert"
              className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {eventsError}
            </div>
          )}

          {/* EVENT COUNT */}
          {!eventsLoading &&
            !eventsError && (
              <div className="mt-4 text-sm text-gray-500">
                Showing{" "}
                {
                  filteredEvents.length
                }{" "}
                displayed events
                from{" "}
                {events.length}{" "}
                stored events
              </div>
            )}

          {/* WEEK / MONTH */}
          {view === "week" ? (
            <WeekView
              date={date}
              timezone={
                timezone
              }
              events={
                filteredEvents
              }
              onCellClick={
                handleCellClick
              }
              onEventClick={
                handleEventClick
              }
              onEventMove={
                handleEventMove
              }
              onEventResize={
                handleEventResize
              }
            />
          ) : (
            <MonthView
  date={date}
  timezone={timezone}
  events={filteredEvents}
  onCellClick={handleCellClick}
  onEventClick={handleEventClick}
/>
          )}

        </div>
      </div>

      {/* EVENT MODAL */}
      <EventModal
        isOpen={
          isEventModalOpen
        }
        onClose={
          handleCloseModal
        }
        onSave={
          handleSaveEvent
        }
        onDelete={
          handleDeleteEvent
        }
        initialDate={
          selectedDate
        }
        eventToEdit={
          eventToEdit
        }
        users={users}
      />

      {/* REMINDER */}
      <ReminderToast
        reminder={
          activeReminder
        }
        onClose={() =>
          setActiveReminder(
            null
          )
        }
      />

    </div>
  );
}

export default CalendarPage;