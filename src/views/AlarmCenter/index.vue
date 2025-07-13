<template>
  <div class="alarm-center">
    <!-- 四个统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="(item, index) in statsList" :key="index">
        <el-card class="stat-card">
          <div class="stat-content">
            <div :class="['stat-icon', item.iconClass]">
              <el-icon>
                <component :is="item.icon"/>
              </el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ item.value }}</h3>
              <p>{{ item.label }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 告警记录表格 -->
    <el-card class="table-card" style="margin-top: 30px;">
      <template #header>
        <div class="card-header">
          <span>告警记录</span>
          <el-button type="primary" @click="handleRefresh" :loading="alarmStore.loading">
            <el-icon>
              <Refresh/>
            </el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <el-table
          :data="alarmStore.alarmLogs"
          v-loading="alarmStore.loading"
          row-key="id"
          style="width: 100%"
          border
      >
        <el-table-column prop="id" label="ID" width="100"/>
        <el-table-column prop="event_type" label="事件类型" width="180"/>
        <el-table-column prop="event_id" label="事件ID" width="150"/>
        <el-table-column prop="time" label="告警时间" width="200"/>
        <el-table-column prop="status" label="处理状态" width="150">
          <template #default="{ row }">
            <el-tag :type="statusTagType[row.status]" effect="light">
              {{ statusLabel[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更改处理状态" width="200">
          <template #default="{ row }">
            <el-select
                v-model="row.status"
                size="small"
                placeholder="选择状态"
                @change="val => handleStatusChange(row.id, val)"
                style="width: 100%"
            >
              <el-option
                  v-for="item in statusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>


<script setup lang="ts">
import {onMounted, computed} from 'vue'
import {ElMessage} from 'element-plus'
import {Refresh, Bell, List, Clock, Check} from '@element-plus/icons-vue'
import {useAlarmStore} from '@/store/alarm'
import {updateAlarmStatus} from '@/api/alarm'

const alarmStore = useAlarmStore()

const handleRefresh = async () => {
  try {
    await alarmStore.fetchAlarmLogs()
    ElMessage.success('刷新成功')
  } catch {
    ElMessage.error('获取告警记录失败')
  }
}

const handleStatusChange = async (id: number, status: number) => {
  try {
    await updateAlarmStatus(id, status)
    ElMessage.success('状态更新成功')
  } catch {
    ElMessage.error('状态更新失败')
  }
}

onMounted(() => {
  alarmStore.fetchAlarmLogs()
})

// 状态映射
const statusOptions = [
  {label: '未处理', value: 0},
  {label: '处理中', value: 1},
  {label: '已处理', value: 2}
]

const statusLabel = {
  0: '未处理',
  1: '处理中',
  2: '已处理'
}

const statusTagType = {
  0: 'danger',
  1: 'warning',
  2: 'success'
}

// 卡片数据
const statsList = computed(() => {
  const total = alarmStore.alarmLogs.length
  const unhandled = alarmStore.alarmLogs.filter(log => log.status === 0).length
  const handling = alarmStore.alarmLogs.filter(log => log.status === 1).length
  const handled = alarmStore.alarmLogs.filter(log => log.status === 2).length
  return [
    {label: '告警总数', value: total, icon: Bell, iconClass: 'online'},
    {label: '未处理', value: unhandled, icon: List, iconClass: 'danger'},
    {label: '处理中', value: handling, icon: Clock, iconClass: 'warning'},
    {label: '已处理', value: handled, icon: Check, iconClass: 'success'}
  ]
})

onMounted(() => {
  alarmStore.fetchAlarmLogs()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card {
  border-radius: 16px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  font-size: 24px;
  margin-right: 16px;
  padding: 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-icon.online {
  background-color: #409EFF;
}

.stat-icon.danger {
  background-color: #F56C6C;
}

.stat-icon.warning {
  background-color: #E6A23C;
}

.stat-icon.success {
  background-color: #67C23A;
}

.stat-info h3 {
  margin: 0;
  font-size: 20px;
}

.stat-info p {
  margin: 0;
  color: #999;
}

.stat-card {
  height: 120px;
  border-radius: 12px; /* 圆角小一点 */
}

.table-card {
  margin-top: 30px; /* 拉开卡片与表格距离 */
}

</style>
