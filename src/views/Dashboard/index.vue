<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon online">
              <el-icon>
                <User/>
              </el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stats.onlineUsers }}</h3>
              <p>注册用户</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon alarm">
              <el-icon>
                <Bell/>
              </el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stats.todayAlarms }}</h3>
              <p>今日告警</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon camera">
              <el-icon>
                <VideoCamera/>
              </el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stats.cameraCount }}</h3>
              <p>监控设备</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon status">
              <el-icon>
                <CircleCheck/>
              </el-icon>
            </div>
            <div class="stat-info">
              <h3>正常</h3>
              <p>系统状态</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>告警趋势</span>
              <el-button 
                type="primary" 
                size="small" 
                @click="handleGenerateReport"
                :loading="isReportLoading"
              >
                生成日报
              </el-button>
            </div>
          </template>
          <div class="chart-container">
            <v-chart :option="alarmTrendOption"/>
          </div>
        </el-card>
      </el-col>
    </el-row>
  <el-dialog
    v-model="reportDialogVisible"
    title="今日AI监控日报"
    width="60%"
    top="10vh"
  >
    <pre class="report-content">{{ currentReportContent }}</pre>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="reportDialogVisible = false">关闭</el-button>
        <el-button type="success" @click="handleDownloadReport">
          <el-icon><Download /></el-icon>
          下载为 .txt 文件
        </el-button>
      </span>
    </template>
  </el-dialog>


    <!-- 最新告警 -->
    <el-row class="recent-alarms">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最新告警</span>
              <el-button type="primary" size="small" @click="$router.push('/alarm-center')">
                查看全部
              </el-button>
            </div>
          </template>
          <el-table :data="recentAlarms" style="width: 100%">
            <el-table-column prop="title" label="告警标题"/>
            <el-table-column prop="level" label="告警级别">
              <template #default="{ row }">
                <el-tag :type="getAlarmLevelType(row.level)">
                  {{ getAlarmLevelText(row.level) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="位置"/>
            <el-table-column prop="time" label="时间"/>
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {use} from 'echarts/core'
import {CanvasRenderer} from 'echarts/renderers'
import {LineChart, PieChart} from 'echarts/charts'
import {GridComponent, LegendComponent, TooltipComponent} from 'echarts/components'
import VChart from 'vue-echarts'
import {getAlarmTrend, getTodayAlarmCount} from "@/api/alarm.ts";
import {Bell, CircleCheck, User, VideoCamera} from "@element-plus/icons-vue";
import {getUserCount} from "@/api/users.ts";
import {getCameraCount} from "@/api/camera.ts";
import {ElMessage} from "element-plus";
import {generateDailyReport} from "@/api/report.ts";

use([CanvasRenderer, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent])

// 统计数据
const stats = ref({
  onlineUsers: 0,
  todayAlarms: 0,
  cameraCount: 0,
  systemStatus: '正常'
})

// 最新告警数据
const recentAlarms = ref([
  {
    id: 1,
    title: '危险区域入侵告警',
    level: 'high',
    location: '站台A区',
    time: '2024-01-15 14:30:25',
    status: 'unprocessed'
  },
  {
    id: 2,
    title: '异常行为检测',
    level: 'medium',
    location: '候车大厅',
    time: '2024-01-15 14:25:18',
    status: 'processing'
  },
  {
    id: 3,
    title: '身份认证失败',
    level: 'high',
    location: '安检口1',
    time: '2024-01-15 14:20:42',
    status: 'processed'
  }
])

// 告警趋势图表配置
const alarmTrendOption = ref<{
  title: { text: string }
  tooltip: { trigger: string }
  xAxis: { type: string; data: string[] }
  yAxis: { type: string }
  series: {
    data: number[]
    type: string
    smooth: boolean
    itemStyle: { color: string }
  }[]
}>({
  title: {text: '近7天告警趋势'},
  tooltip: {trigger: 'axis'},
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: {type: 'value'},
  series: [
    {
      data: [],
      type: 'line',
      smooth: true,
      itemStyle: {color: '#409EFF'}
    }
  ]
})

// 获取告警级别类型
const getAlarmLevelType = (level: string) => {
  const types: Record<string, string> = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return types[level] || 'info'
}

// 获取告警级别文本
const getAlarmLevelText = (level: string) => {
  const texts: Record<string, string> = {
    high: '高危',
    medium: '中等',
    low: '低危'
  }
  return texts[level] || '未知'
}

// 获取状态类型
const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    unprocessed: 'danger',
    processing: 'warning',
    processed: 'success'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    unprocessed: '未处理',
    processing: '处理中',
    processed: '已处理'
  }
  return texts[status] || '未知'
}

const updateTrendData = (trendData: { dates: string[]; counts: number[] }) => {
  alarmTrendOption.value.xAxis.data = trendData.dates
  alarmTrendOption.value.series[0].data = trendData.counts
}


const isReportLoading = ref(false);
const reportDialogVisible = ref(false);
const currentReportContent = ref('');

const handleGenerateReport = async () => {
  isReportLoading.value = true;
  try {
    const res = await generateDailyReport();
    // 将API成功返回的报告内容存储起来
    currentReportContent.value = res.content;
    // 显示弹窗
    reportDialogVisible.value = true;
    ElMessage.success('日报生成成功！');
  } catch (error) {
    // 错误已由 request.ts 统一处理，这里只是为了调试
    console.error("生成日报失败:", error);
  } finally {
    isReportLoading.value = false;
  }
};

/**
 * 处理“下载”按钮的点击事件
 */
const handleDownloadReport = () => {
  if (!currentReportContent.value) {
    ElMessage.warning('报告内容为空，无法下载。');
    return;
  }

  // 1. 获取当前日期作为文件名的一部分
  const today = new Date();
  const dateString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const filename = `AI监控日报-${dateString}.txt`;

  // 2. 将报告内容（字符串）转换为Blob对象
  const blob = new Blob([currentReportContent.value], { type: 'text/plain;charset=utf-8' });

  // 3. 创建一个隐藏的<a>标签来触发下载
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob); // 创建一个指向Blob的URL
  link.download = filename; // 设置下载文件的名称
  
  // 4. 触发点击并清理
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href); // 释放URL对象
};


onMounted(async () => {
  try {
    // 拿到告警趋势
    const nums = await getAlarmTrend()
    updateTrendData(nums)
    // 拿到今日告警数量
    stats.value.todayAlarms = await getTodayAlarmCount()
    // 拿到用户数量
    const users = await getUserCount()
    stats.value.onlineUsers = users.count
    // 拿到摄像头数量
    const cam = await getCameraCount()
    stats.value.cameraCount = cam.count
  } catch (e) {
    console.error('获取失败', e)
  }
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
  color: white;
}

.stat-icon.online {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.alarm {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.camera {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.status {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info h3 {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 5px 0;
  color: #303133;
}

.stat-info p {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recent-alarms {
  margin-bottom: 20px;
}
</style>
