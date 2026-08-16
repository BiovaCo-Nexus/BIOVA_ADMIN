export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: "National Holiday" | "Public Holiday" | "Company Holiday" | "Festival";
  category: "all" | "national" | "company" | "public";
  description?: string;
}

export const FINANCIAL_HOLIDAYS: Holiday[] = [
  // ─── 2025 Holidays ───
  { date: "2025-01-26", name: "Republic Day", type: "National Holiday", category: "national", description: "National Holiday • Office Closed" },
  { date: "2025-02-26", name: "Maha Shivratri", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2025-03-14", name: "Holi", type: "Festival", category: "public", description: "Festival of Colours • Office Closed" },
  { date: "2025-03-31", name: "Id-Ul-Fitr (Ramadan Eid)", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2025-04-10", name: "Shri Mahavir Jayanti", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2025-04-14", name: "Dr. B.R. Ambedkar Jayanti", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2025-04-18", name: "Good Friday", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2025-05-01", name: "Maharashtra Day / Labour Day", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2025-05-12", name: "Buddha Purnima", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2025-06-07", name: "Bakri Id (Eid-ul-Adha)", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2025-07-06", name: "Muharram", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2025-08-15", name: "Independence Day", type: "National Holiday", category: "national", description: "National Holiday • Office Closed" },
  { date: "2025-08-27", name: "Ganesh Chaturthi", type: "Festival", category: "public", description: "Festival Holiday • Office Closed" },
  { date: "2025-09-05", name: "Milad-un-Nabi", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2025-10-02", name: "Mahatma Gandhi Jayanti", type: "National Holiday", category: "national", description: "National Holiday • Office Closed" },
  { date: "2025-10-02", name: "Dussehra (Vijayadashami)", type: "Festival", category: "public", description: "Festival Holiday • Office Closed" },
  { date: "2025-10-21", name: "Diwali (Laxmi Pujan)", type: "Festival", category: "public", description: "Diwali Celebrations • Office Closed" },
  { date: "2025-10-22", name: "Diwali Balipratipada", type: "Festival", category: "public", description: "Diwali Holiday • Office Closed" },
  { date: "2025-11-05", name: "Guru Nanak Jayanti", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2025-12-25", name: "Christmas", type: "Public Holiday", category: "public", description: "Christmas Day • Office Closed" },

  // ─── 2026 Official Holidays ───
  { date: "2026-01-26", name: "Republic Day", type: "National Holiday", category: "national", description: "National Holiday • Office Closed" },
  { date: "2026-02-15", name: "Maha Shivaratri", type: "Public Holiday", category: "public", description: "Public Holiday • Weekend" },
  { date: "2026-03-03", name: "Holi", type: "Festival", category: "public", description: "Festival of Colours • Office Closed" },
  { date: "2026-03-21", name: "Id-Ul-Fitr", type: "Public Holiday", category: "public", description: "Public Holiday • Weekend" },
  { date: "2026-03-26", name: "Shri Ram Navami", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2026-03-31", name: "Shri Mahavir Jayanti", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2026-04-03", name: "Good Friday", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2026-04-14", name: "Dr. Ambedkar Jayanti", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2026-05-01", name: "Maharashtra Day / May Day", type: "Company Holiday", category: "company", description: "Labour Day • Office Closed" },
  { date: "2026-05-28", name: "Bakri Id (Eid-ul-Adha)", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2026-05-31", name: "Buddha Purnima", type: "Public Holiday", category: "public", description: "Public Holiday • Weekend" },
  { date: "2026-06-26", name: "Muharram", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2026-08-15", name: "Independence Day", type: "National Holiday", category: "national", description: "National Holiday • Office Closed" },
  { date: "2026-08-28", name: "Raksha Bandhan", type: "Festival", category: "company", description: "Festival Observance • Company Holiday" },
  { date: "2026-09-04", name: "Janmashtami", type: "Festival", category: "public", description: "Festival Holiday • Office Closed" },
  { date: "2026-09-14", name: "Ganesh Chaturthi", type: "Festival", category: "public", description: "Ganesh Chaturthi • Office Closed" },
  { date: "2026-09-25", name: "Eid-e-Milad", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2026-10-02", name: "Mahatma Gandhi Jayanti", type: "National Holiday", category: "national", description: "National Holiday • Office Closed" },
  { date: "2026-10-20", name: "Dussehra (Vijayadashami)", type: "Festival", category: "public", description: "Dussehra Holiday • Office Closed" },
  { date: "2026-11-08", name: "Diwali (Laxmi Pujan)", type: "Festival", category: "public", description: "Diwali Celebrations" },
  { date: "2026-11-10", name: "Diwali - Balipratipada", type: "Festival", category: "public", description: "Diwali Holiday • Office Closed" },
  { date: "2026-11-24", name: "Guru Nanak Jayanti", type: "Public Holiday", category: "public", description: "Guru Nanak Jayanti • Office Closed" },
  { date: "2026-12-25", name: "Christmas", type: "Public Holiday", category: "public", description: "Christmas Day • Office Closed" },

  // ─── 2027 Holidays ───
  { date: "2027-01-26", name: "Republic Day", type: "National Holiday", category: "national", description: "National Holiday • Office Closed" },
  { date: "2027-03-06", name: "Maha Shivratri", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2027-03-10", name: "Id-Ul-Fitr", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2027-03-23", name: "Holi", type: "Festival", category: "public", description: "Festival of Colours • Office Closed" },
  { date: "2027-03-26", name: "Good Friday", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2027-04-14", name: "Dr. Ambedkar Jayanti", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2027-04-16", name: "Ram Navami", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2027-04-20", name: "Mahavir Jayanti", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2027-05-01", name: "Maharashtra Day", type: "Company Holiday", category: "company", description: "Labour Day • Office Closed" },
  { date: "2027-05-17", name: "Bakri Id (Eid-ul-Adha)", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2027-06-16", name: "Muharram", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2027-08-15", name: "Independence Day", type: "National Holiday", category: "national", description: "National Holiday • Office Closed" },
  { date: "2027-09-04", name: "Ganesh Chaturthi", type: "Festival", category: "public", description: "Festival Holiday • Office Closed" },
  { date: "2027-10-02", name: "Gandhi Jayanti", type: "National Holiday", category: "national", description: "National Holiday • Office Closed" },
  { date: "2027-10-10", name: "Dussehra", type: "Festival", category: "public", description: "Festival Holiday • Office Closed" },
  { date: "2027-10-29", name: "Diwali (Laxmi Pujan)", type: "Festival", category: "public", description: "Diwali Celebrations" },
  { date: "2027-11-01", name: "Diwali Balipratipada", type: "Festival", category: "public", description: "Diwali Holiday • Office Closed" },
  { date: "2027-11-14", name: "Guru Nanak Jayanti", type: "Public Holiday", category: "public", description: "Public Holiday • Office Closed" },
  { date: "2027-12-25", name: "Christmas", type: "Public Holiday", category: "public", description: "Christmas Day • Office Closed" }
];

export const getTodayHoliday = (now: Date = new Date()): Holiday | undefined => {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;
  return FINANCIAL_HOLIDAYS.find(h => h.date === todayStr);
};

export const getNextHoliday = (now: Date = new Date()): { holiday: Holiday; daysRemaining: number } | null => {
  const nowMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  const futureHolidays = FINANCIAL_HOLIDAYS
    .map(h => {
      const hDate = new Date(h.date + "T00:00:00");
      const diffMs = hDate.getTime() - nowMs;
      const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return { holiday: h, daysRemaining: days, time: hDate.getTime() };
    })
    .filter(item => item.daysRemaining > 0)
    .sort((a, b) => a.time - b.time);

  if (futureHolidays.length === 0) return null;
  return { holiday: futureHolidays[0].holiday, daysRemaining: futureHolidays[0].daysRemaining };
};

export const getUpcomingHolidays = (now: Date = new Date(), limit: number = 6): Array<{ holiday: Holiday; daysRemaining: number }> => {
  const nowMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return FINANCIAL_HOLIDAYS
    .map(h => {
      const hDate = new Date(h.date + "T00:00:00");
      const diffMs = hDate.getTime() - nowMs;
      const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return { holiday: h, daysRemaining: days, time: hDate.getTime() };
    })
    .filter(item => item.daysRemaining >= 0)
    .sort((a, b) => a.time - b.time)
    .slice(0, limit);
};
