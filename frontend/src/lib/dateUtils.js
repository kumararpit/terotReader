import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

export const getUserTimezone = () => {
    return dayjs.tz.guess();
};

export const toUTC = (dateStr) => {
    return dayjs(dateStr).utc().format();
};

export const formatInTimeZone = (dateStr, tz, formatStr) => {
    return dayjs.utc(dateStr).tz(tz).format(formatStr);
};

export default dayjs;
