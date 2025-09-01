export function formatTimestamp(timestamp) {
  const timestampDate = new Date(timestamp);
  let hours = timestampDate.getHours();
  const minutes = timestampDate.getMinutes();
  let dayOrNight = "";
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const currentDay = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDay + (currentDay === 0 ? -6 : 1));

  if (hours >= 12) {
    dayOrNight = "PM";
  }
  if (hours === 0 || hours < 12) {
    dayOrNight = "AM";
  }
  if (hours === 0) {
    hours = 12;
  }

  const timeOfMessage = `${hours}:${String(minutes).padStart(
    2,
    "0"
  )} ${dayOrNight}`;
  if (timestampDate >= todayStart) {
    return timeOfMessage;
  } else if (timestampDate >= yesterdayStart) {
    return "Yesterday";
  } else if (timestampDate >= startOfWeek) {
    const dayOfWeek = timestampDate.toLocaleString("en-US", {
      weekday: "long",
    });
    return `${dayOfWeek} at ${timeOfMessage}`;
  } else {
    return timestampDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}
