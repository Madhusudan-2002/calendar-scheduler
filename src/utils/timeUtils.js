export const SNAP_MINUTES = 15;

export const snapToMinutes = (
  date,
  interval = SNAP_MINUTES
) => {
  const snappedDate = new Date(date);

  const minutes = snappedDate.getMinutes();

  const snappedMinutes =
    Math.round(minutes / interval) * interval;

  snappedDate.setMinutes(
    snappedMinutes,
    0,
    0
  );

  return snappedDate;
};

export const addMinutes = (
  date,
  minutes
) => {
  return new Date(
    new Date(date).getTime() +
      minutes * 60 * 1000
  );
};