const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

export const timeAgo = (input) => {
  if (!input) {return '';}
  const then = new Date(input).getTime();
  if (isNaN(then)) {return '';}
  const diffSec = Math.max(1, Math.floor((Date.now() - then) / 1000));

  if (diffSec < MINUTE) {return 'just now';}
  if (diffSec < HOUR) {
    const m = Math.floor(diffSec / MINUTE);
    return `${m} minute${m === 1 ? '' : 's'} ago`;
  }
  if (diffSec < DAY) {
    const h = Math.floor(diffSec / HOUR);
    return `${h} hour${h === 1 ? '' : 's'} ago`;
  }
  const d = Math.floor(diffSec / DAY);
  return `${d} day${d === 1 ? '' : 's'} ago`;
};
