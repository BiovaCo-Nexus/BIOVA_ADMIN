import { useState, useMemo } from 'react';
import { subDays, subMonths, subYears, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export type TimeFilter = '7days' | '30days' | '6months' | '1year' | 'all';

export function useTimeFilter() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30days');

  const dateRange = useMemo(() => {
    const end = endOfDay(new Date());
    let start;

    switch (timeFilter) {
      case '7days':
        start = startOfDay(subDays(end, 7));
        break;
      case '30days':
        start = startOfDay(subDays(end, 30));
        break;
      case '6months':
        start = startOfDay(subMonths(end, 6));
        break;
      case '1year':
        start = startOfDay(subYears(end, 1));
        break;
      case 'all':
      default:
        start = new Date(0); // Epoch
    }

    return { start, end };
  }, [timeFilter]);

  const filterDataByDate = <T extends any>(data: T[], dateField: keyof T): T[] => {
    return data.filter((item) => {
      if (!item[dateField]) return false;
      const itemDate = new Date(item[dateField] as string);
      return isWithinInterval(itemDate, { start: dateRange.start, end: dateRange.end });
    });
  };

  return { timeFilter, setTimeFilter, dateRange, filterDataByDate };
}
