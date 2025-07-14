<template>
  <div class="monitor-container">
    <div class="monitor-header">
      <div class="header-left">
        <el-button-group>
          <el-button :type="monitorStore.viewMode === 'grid' ? 'primary' : 'default'"
            @click="monitorStore.setViewMode('grid')">
            <el-icon>
              <Grid />
            </el-icon>
            网格视图
          </el-button>
          <el-button :type="monitorStore.viewMode === 'single' ? 'primary' : 'default'"
            @click="monitorStore.setViewMode('single')">
            <el-icon>
              <Monitor />
            </el-icon>
            单屏视图
          </el-button>
        </el-button-group>
        <el-select v-model="monitorStore.currentAiFunction" style="margin-left: 20px; width: 180px;">
          <el-option label="人体行为检测" value="person_detection" />
          <el-option label="人脸识别" value="face_recognition" />
          <el-option label="车辆检测" value="vehicle_detection" disabled />
        </el-select>
      </div>
      <div class="header-right">
        <el-button type="success" @click="addCameraDialogVisible = true">
          <el-icon>
            <Plus />
          </el-icon>
          添加摄像头
        </el-button>
        <el-select :model-value="monitorStore.selectedCameraId" @change="monitorStore.setSelectedCamera"
          placeholder="快速选择摄像头" style="width: 200px" filterable clearable>
          <el-option v-for="camera in monitorStore.cameraList" :key="camera.id" :label="camera.name"
            :value="camera.id" />
        </el-select>
      </div>
    </div>

    <div class="monitor-content">
      <div v-if="monitorStore.viewMode === 'grid'" class="video-grid" v-loading="monitorStore.loadingCameras">
        <div v-for="camera in monitorStore.cameraList" :key="camera.id" class="video-item"
          @click="selectAndSwitchView(camera.id)">
          <div class="video-wrapper">
            <video :src="`${monitorStore.streamBaseUrl}${monitorStore.currentAiFunction}/${camera.stream_key}`" controls
              muted class="video-player">
              您的浏览器不支持视频播放
            </video>
            <div class="video-overlay">
              <div class="camera-info">
                <h4>{{ camera.name }}</h4>
                <el-tag size="small" type="success">在线</el-tag>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-if="!monitorStore.loadingCameras && monitorStore.cameraList.length === 0"
          description="您还没有添加摄像头"></el-empty>
      </div>

      <div v-else class="single-view">
        <div class="main-video">
          <video v-if="monitorStore.currentCamera" :key="monitorStore.currentCamera.id"
            :src="`${monitorStore.streamBaseUrl}${monitorStore.currentAiFunction}/${monitorStore.currentCamera.stream_key}`"
            controls autoplay muted class="main-video-player">
            您的浏览器不支持视频播放
          </video>
          <div v-else class="no-video">
            <el-empty description="请从上方或网格视图中选择一个摄像头" />
          </div>
        </div>

        <div class="detection-panel">
          <el-card v-loading="monitorStore.loadingEvents">
            <template #header>
              <span>实时检测结果</span>
            </template>
            <div class="event-list-container">
              <el-timeline v-if="monitorStore.eventList.length > 0">
                <el-timeline-item v-for="event in monitorStore.eventList" :key="event.id" :timestamp="event.time"
                  :type="getDetectionType(event.level)">
                  <strong>{{ event.event_type }}</strong>
                  <p>{{ event.description }}</p>
                  <div class="detection-actions">
                    <el-button size="small" @click="viewDetectionDetail(event)">查看详情</el-button>
                    <el-button size="small" type="warning" @click="createAlarm(event)">生成告警</el-button>
                  </div>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="暂无检测结果" />
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <el-dialog v-model="addCameraDialogVisible" title="添加新摄像头" width="500px" @closed="resetForm">
      <el-form :model="newCameraForm" label-width="100px" ref="cameraFormRef">
        <el-form-item label="名称" prop="name" required><el-input v-model="newCameraForm.name" /></el-form-item>
        <el-form-item label="物理地址" prop="location"><el-input v-model="newCameraForm.location" /></el-form-item>
        <el-form-item label="摄像头类型" prop="camera_type"><el-input v-model="newCameraForm.camera_type" /></el-form-item>
        <el-form-item label="推流地址"><el-input :value="monitorStore.streamBaseUrl" disabled /></el-form-item>
        <el-form-item label="推流码" prop="stream_key" required><el-input
            v-model="newCameraForm.stream_key" /></el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addCameraDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddNewCamera" :loading="isSubmitting">确认添加</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMonitorStore } from '@/store/monitor';
import type { DetectionEvent } from '@/types/monitor'; // 确保类型文件已创建
// --- 这是需要修改的部分 ---
import { ElMessage } from 'element-plus'; // 新增导入
// --- 修改结束 ---

const router = useRouter();
const monitorStore = useMonitorStore();

// --- Dialog State ---
const addCameraDialogVisible = ref(false);
const isSubmitting = ref(false);
const newCameraForm = ref({
  name: '',
  location: '',
  camera_type: '',
  stream_key: '', // 这个字段会用于前端输入
  // --- 这是需要修改的部分 ---
  // is_active: false // 从这里移除，因为将在 handleAddNewCamera 构造数据时传入 true
  // --- 修改结束 ---
});

// --- Lifecycle Hook ---
onMounted(() => {
  monitorStore.fetchCameras();
});

// --- Methods ---
const handleAddNewCamera = async () => {
  if (!newCameraForm.value.name || !newCameraForm.value.stream_key) {
    ElMessage.warning('请填写名称和推流码');
    return;
  }

  isSubmitting.value = true;

  // --- 这是需要修改的部分 ---
  // 构造发送到后端的数据对象，映射前端字段到后端期望的字段
  const cameraDataToSend = {
    name: newCameraForm.value.name,
    location: newCameraForm.value.location,
    camera_type: newCameraForm.value.camera_type,
    url: monitorStore.streamBaseUrl, // 后端模型中的 'url' 对应前端的“推流地址”
    password: newCameraForm.value.stream_key, // 后端模型中的 'password' 对应前端的“推流码”
    is_active: true, // 默认设置为 true，表示摄像头是活动的
  };

  // 调用 store 中的 createCamera 方法，传入构造好的数据
  // 注意：这里的 success 依赖于 monitorStore.createCamera 的返回
  const success = await monitorStore.createCamera(cameraDataToSend);
  // --- 修改结束 ---

  isSubmitting.value = false;
  if (success) {
    addCameraDialogVisible.value = false;
    // --- 这是需要修改的部分 ---
    ElMessage.success('摄像头添加成功！'); // 添加成功提示
    resetForm(); // 添加成功后重置表单
    // --- 修改结束 ---
  } else {
    // 假设 monitorStore.createCamera 在失败时已经显示了 ElMessage 错误提示
    // 所以这里可以不用重复显示错误
  }
};

const resetForm = () => {
  newCameraForm.value = { name: '', location: '', camera_type: '', stream_key: '' };
};

const selectAndSwitchView = (cameraId: number) => {
  monitorStore.setSelectedCamera(cameraId);
  monitorStore.setViewMode('single');
};

const getDetectionType = (level: string) => {
  if (level === 'high') return 'danger';
  if (level === 'medium') return 'warning';
  return 'primary';
};

const viewDetectionDetail = (detection: DetectionEvent) => {
  router.push({ name: 'BehaviorDetectionRecord', query: { event_id: detection.id } });
};

const createAlarm = (detection: DetectionEvent) => {
  router.push({ name: 'CreateAlarm', state: { detectionData: detection } });
};
</script>

<style scoped>
/* 样式部分保持不变 */
.monitor-container {
  height: calc(100vh - 90px);
  display: flex;
  flex-direction: column;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
}


.monitor-content {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
  height: 100%;
  overflow-y: auto;
}

.video-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;
}

.video-item:hover {
  transform: translateY(-2px);
}

.video-wrapper {
  position: relative;
  height: 300px;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #000;
  /* Add a black background for loading */
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
  padding: 12px;
  color: white;
}

.camera-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.camera-info h4 {
  margin: 0;
  font-size: 14px;
}

.status {
  font-weight: bold;
}

.status.online {
  color: #67C23A;
}

.status.offline {
  color: #F56C6C;
}

.detection-info {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.single-view {
  display: flex;
  gap: 16px;
  height: 100%;
}

.main-video {
  flex: 1;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.main-video-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #000;
}

.no-video {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detection-panel {
  width: 350px;
  flex-shrink: 0;
}

.detection-item {
  padding: 12px;
  border: 1px solid #EBEEF5;
  border-radius: 6px;
  margin-bottom: 12px;
}

.detection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.detection-time {
  font-size: 12px;
  color: #909399;
}

.detection-desc {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}

.detection-actions {
  display: flex;
  gap: 8px;
}

.header-left,
.header-right {
  display: flex;
  gap: 16px;
  align-items: center;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
  height: 100%;
  overflow-y: auto;
}

.video-wrapper,
.main-video {
  background: #000;
  border-radius: 4px;
  overflow: hidden;
}

.video-player,
.main-video-player {
  width: 100%;
  height: 100%;
  display: block;
}

.video-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  padding: 8px;
  color: white;
}

.camera-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.single-view {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 16px;
  height: 100%;
}

.detection-panel .el-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detection-panel .el-card :deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
}

.detection-item {
  margin-bottom: 12px;
}

.detection-actions {
  margin-top: 8px;
}
</style>