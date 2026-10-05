function ReminderToast({
  reminder,
  onClose,
}) {
  if (!reminder) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 right-6 z-[100] w-80 rounded-xl border border-blue-200 bg-white p-4 shadow-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Event Reminder
          </p>

          <h3 className="mt-1 font-bold text-gray-900">
            {reminder.title}
          </h3>

          <p className="mt-1 text-sm text-gray-600">
            Starts at{" "}
            {new Date(
              reminder.start
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss reminder"
          className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default ReminderToast;