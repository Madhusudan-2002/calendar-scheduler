const pad = (value) => String(value).padStart(2, "0");

const toUtcIso = (year, month, day, hour, minute = 0) => {
  return new Date(
    Date.UTC(year, month, day, hour, minute)
  ).toISOString();
};

export const mapTodoToEvent = (todo) => {
  /*
   * DummyJSON todos don't contain calendar dates.
   *
   * We therefore derive the date/time entirely from todo.id.
   * The same todo id always produces the same event time.
   */

  const baseYear = 2026;

  // Spread events across all 12 months.
  const month = (todo.id - 1) % 12;

  // Safe range 1-28 avoids invalid month-end dates.
  const day = ((todo.id - 1) % 28) + 1;

  // Events between 8 AM and 5 PM UTC.
  const hour = 8 + ((todo.id - 1) % 10);

  // Alternate between :00 and :30.
  const minute = todo.id % 2 === 0 ? 0 : 30;

  const start = toUtcIso(
    baseYear,
    month,
    day,
    hour,
    minute
  );

  const endDate = new Date(start);

  // Seed events are one hour long.
  endDate.setUTCMinutes(
    endDate.getUTCMinutes() + 60
  );

  return {
    id: `seed-${todo.id}`,
    sourceId: todo.id,
    title: todo.todo,
    organizerId: todo.userId,

    start,
    end: endDate.toISOString(),

    allDay: false,
    attendees: [],
    recurrence: null,
    reminder: null,

    source: "seed",
    completed: todo.completed,
  };
};

export const mapTodosToEvents = (todos = []) => {
  return todos.map(mapTodoToEvent);
};