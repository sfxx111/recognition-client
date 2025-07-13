import request from "@/utils/request"

import type { AlarmLog } from '@/types/alarm'

export const getAlarmList = (params?: any): Promise<AlarmLog[]> => {
  return request.get('/alarm_logs/', { params })
}

export const getAlarmDetail = (id: number) => {
  return request.get(`/alarm_logs/${id}/`)
}

export const updateAlarmStatus = (id: number, status: string) => {
  return request.patch(`/alarm_logs/${id}/`, { status })
}

export const deleteAlarm = (id: number) => {
  return request.delete(`/alarm_logs/${id}/`)
}

export const getTodayAlarmCount = async (): Promise<number> =>{
  const res = await request.get('/alarm_logs/',{params:{today:true}})
  return res.length
}

export const getAlarmTrend = () => {
  return request.get('/alarm_logs/trend/')
}