export interface DailyData {
  date: string;
  tMean: number;
  cumulativeDD: number;
}

export interface ModelData {
  data: DailyData[];
  todayDD: number;
  futureDD: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
}

const THRESHOLD = 106.8;
const BASE_TEMP = 8.0;

export async function fetchDegreeDays(targetYear?: number): Promise<ModelData> {
  const lat = 45.6578;
  const lon = 13.8466;
  const currentYear = new Date().getFullYear();
  const year = targetYear || currentYear;

  let archiveEndStr = '';
  let fetchForecast = false;

  if (year === currentYear) {
    const archiveEnd = new Date();
    archiveEnd.setDate(archiveEnd.getDate() - 10);
    archiveEndStr = archiveEnd.toISOString().split('T')[0];
    fetchForecast = true;
  } else {
    archiveEndStr = `${year}-12-31`;
    fetchForecast = false;
  }

  const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${year}-01-01&end_date=${archiveEndStr}&daily=temperature_2m_mean&timezone=auto`;

  const promises = [fetch(archiveUrl).then((r) => r.json())];

  if (fetchForecast) {
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&past_days=10&forecast_days=12&daily=temperature_2m_mean&timezone=auto`;
    promises.push(fetch(forecastUrl).then((r) => r.json()));
  }

  const results = await Promise.all(promises);

  const dates: string[] = [];
  const temps: number[] = [];

  const processPayload = (payload: any) => {
    if (!payload.daily) return;
    payload.daily.time.forEach((dateStr: string, index: number) => {
      if (!dates.includes(dateStr)) {
        dates.push(dateStr);
        temps.push(payload.daily.temperature_2m_mean[index]);
      }
    });
  };

  results.forEach(processPayload);

  const combined = dates.map((d, i) => ({ date: d, temp: temps[i] })).sort((a, b) => a.date.localeCompare(b.date));

  let currentSum = 0;
  const dailyData: DailyData[] = [];

  const todayStr = new Date().toISOString().split('T')[0];
  let todayDD = 0;
  let futureDD = 0;

  for (let i = 0; i < combined.length; i++) {
    const tMean = combined[i].temp;
    if (tMean && tMean > BASE_TEMP) {
      currentSum += (tMean - BASE_TEMP);
    }
    dailyData.push({ date: combined[i].date, tMean: tMean || 0, cumulativeDD: Number(currentSum.toFixed(2)) });

    if (combined[i].date === todayStr) todayDD = currentSum;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    if (combined[i].date === futureDate.toISOString().split('T')[0]) futureDD = currentSum;
  }

  let status: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
  if (todayDD >= THRESHOLD) {
    status = 'RED';
  } else if (todayDD < THRESHOLD && futureDD >= THRESHOLD) {
    status = 'YELLOW';
  }

  return { data: dailyData, todayDD, futureDD, status };
}