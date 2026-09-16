/**
 * Helper utility to determine whether current time falls within withdrawal operating hours.
 * Defaults to 9:00 AM (09:00) to 5:00 PM (17:00).
 */
export function isWithinWithdrawalHours(
  startHour: number = 9,
  endHour: number = 17,
  overrideNow?: Date
): {
  isAllowed: boolean;
  currentHour: number;
  currentMinute: number;
  formattedCurrentTime: string;
  timeWindowString: string;
} {
  const now = overrideNow || new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Allow from startHour:00 up to endHour:00 (i.e., strictly before 17:00)
  const isAllowed = currentHour >= startHour && (currentHour < endHour || (currentHour === endHour && currentMinute === 0));

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:00 ${period}`;
  };

  const pad = (n: number) => n.toString().padStart(2, '0');
  const period = currentHour >= 12 ? 'PM' : 'AM';
  const displayH = currentHour % 12 === 0 ? 12 : currentHour % 12;
  const formattedCurrentTime = `${pad(displayH)}:${pad(currentMinute)} ${period}`;

  return {
    isAllowed,
    currentHour,
    currentMinute,
    formattedCurrentTime,
    timeWindowString: `${formatHour(startHour)} - ${formatHour(endHour)}`,
  };
}
