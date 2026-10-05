import { formatMonthYear } from "../../utils/dateUtils";

function CalendarHeader({
  view,
  date,
  timezone,
  timezones,
  attendee,
  users,
  onToday,
  onPrevious,
  onNext,
  onViewChange,
  onTimezoneChange,
  onAttendeeChange,
}) {
  return (
    <div className="border-b pb-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToday}
            className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            Today
          </button>

          <button
            type="button"
            onClick={onPrevious}
            aria-label="Previous"
            className="border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            ←
          </button>

          <button
            type="button"
            onClick={onNext}
            aria-label="Next"
            className="border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            →
          </button>
        </div>

        <h2 className="text-xl font-semibold text-gray-800">
          {formatMonthYear(date)}
        </h2>

        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => onViewChange("week")}
            className={`px-4 py-2 ${
              view === "week"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Week
          </button>

          <button
            type="button"
            onClick={() => onViewChange("month")}
            className={`px-4 py-2 ${
              view === "month"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Month
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-4">
        <div className="flex items-center gap-2">
          <label
            htmlFor="attendee"
            className="text-sm font-medium text-gray-600"
          >
            Attendee
          </label>

          <select
            id="attendee"
            value={attendee}
            onChange={(event) =>
              onAttendeeChange(event.target.value)
            }
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
          >
            <option value="">All attendees</option>

            {users.map((user) => (
              <option
                key={user.id}
                value={String(user.id)}
              >
                {user.firstName} {user.lastName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="timezone"
            className="text-sm font-medium text-gray-600"
          >
            Timezone
          </label>

          <select
            id="timezone"
            value={timezone}
            onChange={(event) =>
              onTimezoneChange(event.target.value)
            }
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
          >
            {timezones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default CalendarHeader;