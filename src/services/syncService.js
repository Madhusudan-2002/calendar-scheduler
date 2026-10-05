// Simulates saving calendar data to a backend API.

export const syncCalendarEvents = (
  events
) => {
  return new Promise(
    (resolve, reject) => {
      setTimeout(() => {
        // 20% failure rate so rollback
        // is easier to test.
        const shouldFail =
  Math.random() < 0.2;
        if (shouldFail) {
          reject(
            new Error(
              "Server failed to save calendar changes."
            )
          );

          return;
        }

        resolve({
          success: true,
          events,
          syncedAt:
            new Date().toISOString(),
        });
      }, 800);
    }
  );
};