// src/api/report.ts
import request from '@/utils/request'

export const generateDailyReport = () => {
  return request.post('/generate_daily_report/')
}
