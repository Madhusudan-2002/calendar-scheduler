export const eventsOverlap = (
  firstEvent,
  secondEvent
) => {
  const firstStart = new Date(
    firstEvent.start
  ).getTime();

  const firstEnd = new Date(
    firstEvent.end
  ).getTime();

  const secondStart = new Date(
    secondEvent.start
  ).getTime();

  const secondEnd = new Date(
    secondEvent.end
  ).getTime();

  return (
    firstStart < secondEnd &&
    secondStart < firstEnd
  );
};

export const calculateOverlapLayout = (
  events
) => {
  if (!events.length) {
    return [];
  }

  const sortedEvents = [
    ...events,
  ].sort(
    (a, b) =>
      new Date(a.start) -
      new Date(b.start)
  );

  const groups = [];

  let currentGroup = [];
  let groupEnd = null;

  sortedEvents.forEach(
    (calendarEvent) => {
      const eventStart =
        new Date(
          calendarEvent.start
        ).getTime();

      const eventEnd =
        new Date(
          calendarEvent.end
        ).getTime();

      if (
        currentGroup.length === 0
      ) {
        currentGroup.push(
          calendarEvent
        );

        groupEnd = eventEnd;

        return;
      }

      if (eventStart < groupEnd) {
        currentGroup.push(
          calendarEvent
        );

        groupEnd = Math.max(
          groupEnd,
          eventEnd
        );
      } else {
        groups.push(
          currentGroup
        );

        currentGroup = [
          calendarEvent,
        ];

        groupEnd = eventEnd;
      }
    }
  );

  if (currentGroup.length) {
    groups.push(currentGroup);
  }

  const result = [];

  groups.forEach((group) => {
    const columns = [];

    group.forEach(
      (calendarEvent) => {
        let columnIndex = 0;

        while (true) {
          if (!columns[columnIndex]) {
            columns[columnIndex] = [
              calendarEvent,
            ];

            break;
          }

          const hasOverlap =
            columns[
              columnIndex
            ].some(
              (existingEvent) =>
                eventsOverlap(
                  calendarEvent,
                  existingEvent
                )
            );

          if (!hasOverlap) {
            columns[
              columnIndex
            ].push(
              calendarEvent
            );

            break;
          }

          columnIndex += 1;
        }

        result.push({
          ...calendarEvent,

          overlapColumn:
            columnIndex,

          overlapColumns: 0,
        });
      }
    );

    const totalColumns =
      columns.length;

    const groupIds =
      new Set(
        group.map(
          (calendarEvent) =>
            calendarEvent.id
        )
      );

    result.forEach(
      (calendarEvent) => {
        if (
          groupIds.has(
            calendarEvent.id
          )
        ) {
          calendarEvent.overlapColumns =
            totalColumns;
        }
      }
    );
  });

  return result;
};