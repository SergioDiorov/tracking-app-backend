export const getSecondsFromTime = (date: Date) =>
  date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
