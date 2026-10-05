import {
  useEffect,
  useRef,
  useState,
} from "react";

function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialDate,
  initialEndDate,
  eventToEdit,
  users = [],
}) {
  const [title, setTitle] =
    useState("");

  const [start, setStart] =
    useState("");

  const [end, setEnd] =
    useState("");

  const [
    attendees,
    setAttendees,
  ] = useState([]);

  const [
    recurrence,
    setRecurrence,
  ] = useState("none");

  const [
    reminder,
    setReminder,
  ] = useState("none");

  const [error, setError] =
    useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  // Ref gives immediate protection against
  // multiple clicks before React re-renders.
  const submittingRef =
    useRef(false);

  // =========================
  // DATE FORMATTER
  // =========================

  const toDateTimeLocal = (
    dateValue
  ) => {
    if (!dateValue) {
      return "";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    const pad = (value) =>
      String(value).padStart(
        2,
        "0"
      );

    return (
      `${date.getFullYear()}-` +
      `${pad(
        date.getMonth() + 1
      )}-` +
      `${pad(
        date.getDate()
      )}T` +
      `${pad(
        date.getHours()
      )}:` +
      `${pad(
        date.getMinutes()
      )}`
    );
  };

  // =========================
  // LOAD EVENT INTO FORM
  // =========================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError("");
    setIsSubmitting(false);
    submittingRef.current =
      false;

    // EDIT MODE
    if (eventToEdit) {
      setTitle(
        eventToEdit.title ||
          ""
      );

      setStart(
        toDateTimeLocal(
          eventToEdit.start
        )
      );

      setEnd(
        toDateTimeLocal(
          eventToEdit.end
        )
      );

      setAttendees(
        Array.isArray(
          eventToEdit.attendees
        )
          ? eventToEdit.attendees.map(
              (id) =>
                String(id)
            )
          : []
      );

      setRecurrence(
        eventToEdit.recurrence ||
          "none"
      );

      setReminder(
        eventToEdit.reminder ||
          "none"
      );

      return;
    }

    // CREATE MODE
    setTitle("");

    const startDate =
      initialDate
        ? new Date(
            initialDate
          )
        : new Date();

   const endDate =
  initialEndDate
    ? new Date(initialEndDate)
    : new Date(
        startDate.getTime() +
          60 * 60 * 1000
      );

    setStart(
      toDateTimeLocal(
        startDate
      )
    );

    setEnd(
      toDateTimeLocal(
        endDate
      )
    );

    setAttendees([]);
    setRecurrence("none");
    setReminder("none");
 }, [
  isOpen,
  eventToEdit,
  initialDate,
  initialEndDate,
]);

  // =========================
  // ATTENDEE CHANGE
  // =========================

  const handleAttendeeChange =
    (event) => {
      const selectedValues =
        Array.from(
          event.target
            .selectedOptions
        ).map(
          (option) =>
            option.value
        );

      setAttendees(
        selectedValues
      );
    };

  // =========================
  // SAVE
  // =========================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      // Double-submit protection
      if (
        submittingRef.current
      ) {
        return;
      }

      setError("");

      const trimmedTitle =
        title.trim();

      if (!trimmedTitle) {
        setError(
          "Event title is required."
        );

        return;
      }

      if (!start || !end) {
        setError(
          "Start and end time are required."
        );

        return;
      }

      const startDate =
        new Date(start);

      const endDate =
        new Date(end);

      if (
        Number.isNaN(
          startDate.getTime()
        ) ||
        Number.isNaN(
          endDate.getTime()
        )
      ) {
        setError(
          "Please enter valid event dates."
        );

        return;
      }

      if (
        endDate <= startDate
      ) {
        setError(
          "End time must be after start time."
        );

        return;
      }

      submittingRef.current =
        true;

      setIsSubmitting(true);

      const eventData = {
        title:
          trimmedTitle,

        start:
          startDate,

        end:
          endDate,

        attendees,

        recurrence,

        reminder,
      };

      try {
        await Promise.resolve(
          onSave(eventData)
        );
      } catch (saveError) {
        console.error(
          "Failed to save event:",
          saveError
        );

        setError(
          "Unable to save the event. Please try again."
        );
      } finally {
        submittingRef.current =
          false;

        setIsSubmitting(
          false
        );
      }
    };

  // =========================
  // DELETE
  // =========================

  const handleDelete =
    async () => {
      if (
        submittingRef.current ||
        !eventToEdit ||
        !onDelete
      ) {
        return;
      }

      const eventId =
        eventToEdit.originalEventId ||
        eventToEdit.id;

      submittingRef.current =
        true;

      setIsSubmitting(true);
      setError("");

      try {
        await Promise.resolve(
          onDelete(eventId)
        );
      } catch (
        deleteError
      ) {
        console.error(
          "Failed to delete event:",
          deleteError
        );

        setError(
          "Unable to delete the event. Please try again."
        );
      } finally {
        submittingRef.current =
          false;

        setIsSubmitting(
          false
        );
      }
    };

  // =========================
  // CLOSE WITH ESCAPE
  // =========================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (
      event
    ) => {
      if (
        event.key ===
          "Escape" &&
        !submittingRef.current
      ) {
        onClose();
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
    isOpen,
    onClose,
  ]);

  // =========================
  // DON'T RENDER WHEN CLOSED
  // =========================

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">

        {/* HEADER */}
        <div className="mb-5 flex items-center justify-between">

          <h2
            id="event-modal-title"
            className="text-xl font-bold text-gray-900"
          >
            {eventToEdit
              ? "Edit Event"
              : "Create Event"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={
              isSubmitting
            }
            aria-label="Close event modal"
            className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>

        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-4"
        >

          {/* TITLE */}
          <div>
            <label
              htmlFor="event-title"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Title
            </label>

            <input
              id="event-title"
              type="text"
              value={title}
              onChange={(
                event
              ) =>
                setTitle(
                  event.target
                    .value
                )
              }
              disabled={
                isSubmitting
              }
              placeholder="Enter event title"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              autoFocus
            />
          </div>

          {/* START */}
          <div>
            <label
              htmlFor="event-start"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Start
            </label>

            <input
              id="event-start"
              type="datetime-local"
              value={start}
              onChange={(
                event
              ) =>
                setStart(
                  event.target
                    .value
                )
              }
              disabled={
                isSubmitting
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            />
          </div>

          {/* END */}
          <div>
            <label
              htmlFor="event-end"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              End
            </label>

            <input
              id="event-end"
              type="datetime-local"
              value={end}
              onChange={(
                event
              ) =>
                setEnd(
                  event.target
                    .value
                )
              }
              disabled={
                isSubmitting
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            />
          </div>

          {/* ATTENDEES */}
          <div>
            <label
              htmlFor="event-attendees"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Attendees
            </label>

            <select
              id="event-attendees"
              multiple
              value={
                attendees
              }
              onChange={
                handleAttendeeChange
              }
              disabled={
                isSubmitting
              }
              className="min-h-28 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            >
              {users.map(
                (calendarUser) => (
                  <option
                    key={
                      calendarUser.id
                    }
                    value={
                      calendarUser.id
                    }
                  >
                    {calendarUser.firstName ||
                      calendarUser.username ||
                      calendarUser.email ||
                      `User ${calendarUser.id}`}
                    {calendarUser.lastName
                      ? ` ${calendarUser.lastName}`
                      : ""}
                  </option>
                )
              )}
            </select>

            <p className="mt-1 text-xs text-gray-500">
              Hold Command on
              Mac or Ctrl on
              Windows to select
              multiple attendees.
            </p>
          </div>

          {/* RECURRENCE */}
          <div>
            <label
              htmlFor="event-recurrence"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Repeat
            </label>

            <select
              id="event-recurrence"
              value={
                recurrence
              }
              onChange={(
                event
              ) =>
                setRecurrence(
                  event.target
                    .value
                )
              }
              disabled={
                isSubmitting
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            >
              <option value="none">
                Does not repeat
              </option>

              <option value="daily">
                Daily
              </option>

              <option value="weekly">
                Weekly
              </option>

              <option value="monthly">
                Monthly
              </option>
            </select>
          </div>

          {/* REMINDER */}
          <div>
            <label
              htmlFor="event-reminder"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Reminder
            </label>

            <select
              id="event-reminder"
              value={
                reminder
              }
              onChange={(
                event
              ) =>
                setReminder(
                  event.target
                    .value
                )
              }
              disabled={
                isSubmitting
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            >
              <option value="none">
                No reminder
              </option>

              <option value="5">
                5 minutes before
              </option>

              <option value="10">
                10 minutes before
              </option>

              <option value="15">
                15 minutes before
              </option>

              <option value="30">
                30 minutes before
              </option>

              <option value="60">
                1 hour before
              </option>
            </select>
          </div>

          {/* ERROR */}
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* BUTTONS */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">

            <div>
              {eventToEdit &&
                onDelete && (
                  <button
                    type="button"
                    onClick={
                      handleDelete
                    }
                    disabled={
                      isSubmitting
                    }
                    className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Please wait..."
                      : "Delete Event"}
                  </button>
                )}
            </div>

            <div className="flex gap-2">

              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  isSubmitting
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  isSubmitting
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "Saving..."
                  : eventToEdit
                  ? "Update Event"
                  : "Create Event"}
              </button>

            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

export default EventModal;