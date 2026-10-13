const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Human-readable age for the admin activity feed.
 *
 * Relative labels ("3 min ago") read far better than a bare clock time for a
 * feed that is mostly events from today. Past a week the exact day matters more
 * than the delta, so it switches to an absolute date. Clock skew (a timestamp
 * slightly in the future) is tolerated as "just now" rather than a negative age.
 *
 * Pure and dependency-free so it can be unit-tested with a fixed `now` and used
 * from a server component without a client boundary.
 */
export const formatRelativeTime = (
  date: Date,
  now: Date = new Date(),
): string => {
  const delta = now.getTime() - date.getTime();

  if (delta < MINUTE) {
    return "just now";
  }
  if (delta < HOUR) {
    const minutes = Math.floor(delta / MINUTE);
    return `${minutes} min ago`;
  }
  if (delta < DAY) {
    const hours = Math.floor(delta / HOUR);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  if (delta < WEEK) {
    const days = Math.floor(delta / DAY);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
