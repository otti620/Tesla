/**
 * Helper utility to determine whether current time falls within withdrawal operating hours.
 * Standard Hours (Monday - Saturday): 9:00 AM (09:00) to 5:00 PM (17:00) WAT.
 * Strict Sunday Hours: 2:00 PM (14:00) to 5:00 PM (17:00) WAT.
 */

export interface WATTimeDetails {
  date: Date;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayName: string;
  hours: number;
  minutes: number;
  seconds: number;
  formattedTime: string;
}

/**
 * Returns current date/time decomposed in Nigerian Time (WAT / Africa/Lagos, UTC+1).
 */
export function getWATTime(overrideNow?: Date | number): WATTimeDetails {
  const d = overrideNow instanceof Date ? overrideNow : new Date(overrideNow ?? Date.now());

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
      weekday: 'short',
    });

    const parts = formatter.formatToParts(d);
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    let weekdayStr = 'Sun';

    for (const part of parts) {
      if (part.type === 'hour') hours = parseInt(part.value, 10);
      if (part.type === 'minute') minutes = parseInt(part.value, 10);
      if (part.type === 'second') seconds = parseInt(part.value, 10);
      if (part.type === 'weekday') weekdayStr = part.value;
    }

    if (hours === 24) hours = 0;

    const daysMap: Record<string, { index: number; name: string }> = {
      Sun: { index: 0, name: 'Sunday' },
      Mon: { index: 1, name: 'Monday' },
      Tue: { index: 2, name: 'Tuesday' },
      Wed: { index: 3, name: 'Wednesday' },
      Thu: { index: 4, name: 'Thursday' },
      Fri: { index: 5, name: 'Friday' },
      Sat: { index: 6, name: 'Saturday' },
    };

    const dayInfo = daysMap[weekdayStr] || { index: d.getDay(), name: weekdayStr };
    const pad = (n: number) => n.toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayH = hours % 12 === 0 ? 12 : hours % 12;
    const formattedTime = `${pad(displayH)}:${pad(minutes)} ${period}`;

    return {
      date: d,
      dayOfWeek: dayInfo.index,
      dayName: dayInfo.name,
      hours,
      minutes,
      seconds,
      formattedTime,
    };
  } catch {
    // Fallback: UTC + 1 hour offset
    const utcTime = d.getTime() + d.getTimezoneOffset() * 60000;
    const watTime = new Date(utcTime + 3600000);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hours = watTime.getHours();
    const minutes = watTime.getMinutes();
    const seconds = watTime.getSeconds();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayH = hours % 12 === 0 ? 12 : hours % 12;
    const formattedTime = `${pad(displayH)}:${pad(minutes)} ${period}`;

    return {
      date: watTime,
      dayOfWeek: watTime.getDay(),
      dayName: dayNames[watTime.getDay()],
      hours,
      minutes,
      seconds,
      formattedTime,
    };
  }
}

export interface WithdrawalHoursResult {
  isAllowed: boolean;
  isSunday: boolean;
  dayName: string;
  effectiveStartHour: number;
  effectiveEndHour: number;
  currentHour: number;
  currentMinute: number;
  formattedCurrentTime: string;
  timeWindowString: string;
  scheduleSummary: string;
  statusText: string;
  errorMessage: string;
}

export function formatHourDisplay(h: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:00 ${period}`;
}

/**
 * Checks whether current time is within withdrawal operational hours.
 * Strict Sunday rules: 2:00 PM (14:00) to 5:00 PM (17:00).
 * Monday - Saturday: 9:00 AM (09:00) to 5:00 PM (17:00).
 */
export function isWithinWithdrawalHours(
  startHour: number = 9,
  endHour: number = 17,
  overrideNow?: Date | number,
  sundayStartHour: number = 14,
  sundayEndHour: number = 17
): WithdrawalHoursResult {
  const wat = getWATTime(overrideNow);
  const isSunday = wat.dayOfWeek === 0;

  const effectiveStartHour = isSunday ? sundayStartHour : startHour;
  const effectiveEndHour = isSunday ? sundayEndHour : endHour;

  // Strict window: from effectiveStartHour:00 up to effectiveEndHour:00 (i.e. strictly up to 17:00:00)
  const isAllowed =
    wat.hours >= effectiveStartHour &&
    (wat.hours < effectiveEndHour || (wat.hours === effectiveEndHour && wat.minutes === 0 && wat.seconds === 0));

  const timeWindowString = `${formatHourDisplay(effectiveStartHour)} - ${formatHourDisplay(effectiveEndHour)}`;
  const scheduleSummary = isSunday
    ? `Sunday Operating Window: ${formatHourDisplay(sundayStartHour)} – ${formatHourDisplay(sundayEndHour)} strictly`
    : `Operating Hours: ${formatHourDisplay(startHour)} – ${formatHourDisplay(endHour)} (Mon–Sat)`;

  let errorMessage = '';
  if (!isAllowed) {
    if (isSunday) {
      if (wat.hours < effectiveStartHour) {
        errorMessage = `Sunday withdrawals are strictly from ${formatHourDisplay(sundayStartHour)} to ${formatHourDisplay(sundayEndHour)}. Processing opens today at ${formatHourDisplay(sundayStartHour)} (Current time: ${wat.formattedTime} WAT).`;
      } else {
        errorMessage = `Sunday withdrawal processing closed at ${formatHourDisplay(sundayEndHour)}. Next withdrawal window opens Monday at ${formatHourDisplay(startHour)}.`;
      }
    } else {
      if (wat.hours < effectiveStartHour) {
        errorMessage = `Withdrawals are processed from ${formatHourDisplay(startHour)} to ${formatHourDisplay(endHour)} (Mon–Sat). Processing opens today at ${formatHourDisplay(startHour)} (Current time: ${wat.formattedTime} WAT).`;
      } else {
        const nextDayText = wat.dayOfWeek === 6 ? `Sunday at ${formatHourDisplay(sundayStartHour)}` : `tomorrow at ${formatHourDisplay(startHour)}`;
        errorMessage = `Daily withdrawal processing closed at ${formatHourDisplay(endHour)}. Next withdrawal window opens ${nextDayText}.`;
      }
    }
  }

  const statusText = isAllowed
    ? isSunday ? 'Sunday Open (2PM - 5PM Window)' : 'Open (9AM - 5PM Window)'
    : isSunday ? 'Sunday Closed' : 'Closed';

  return {
    isAllowed,
    isSunday,
    dayName: wat.dayName,
    effectiveStartHour,
    effectiveEndHour,
    currentHour: wat.hours,
    currentMinute: wat.minutes,
    formattedCurrentTime: wat.formattedTime,
    timeWindowString,
    scheduleSummary,
    statusText,
    errorMessage,
  };
}
