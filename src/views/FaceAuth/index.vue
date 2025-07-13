<template>
  <div class="face-auth">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>身份认证管理</span>
          <el-switch
            v-model="isRecognizing"
            active-text="开始识别"
            inactive-text="停止识别"
          />
        </div>
      </template>

      <div class="auth-top">
        <div class="camera-box">
          <video ref="videoRef" autoplay playsinline muted></video>
        </div>

        <div class="info-box">
          <p class="info-title">实时识别结果</p>
          <div class="info-content" v-loading="isLoading">
            <div v-if="recognitionResult.length">
              <div v-for="(person, index) in recognitionResult" :key="index" class="result-item" :class="getPersonStatusClass(person)">
                <p><strong>姓名:</strong> {{ person.identity === 'Stranger' ? '陌生人' : person.identity }}</p>
                <p><strong>状态:</strong> {{ getPersonStatusText(person) }}</p>
                <p><strong>相似度:</strong> {{ (1 - person.distance).toFixed(2) }}</p>
              </div>
            </div>
            <el-empty v-else :description="statusText" />
          </div>
        </div>
      </div>

      <div class="auth-bottom">
        <p class="info-title">识别历史记录 (最近10条)</p>
        <el-table :data="historyLog" height="250px" stripe>
          <el-table-column prop="identity" label="识别姓名" />
          <el-table-column prop="statusText" label="状态" />
          <el-table-column prop="confidence" label="置信度" >
             <template #default="{ row }">
              {{ row.confidence.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="timestamp" label="识别时间" />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useFaceAuthStore } from '@/store/faceAuth'; // 1. 导入您的Pinia Store
import { ElMessage } from 'element-plus';

// --- 设置Store ---
const faceAuthStore = useFaceAuthStore();
// 2. 使用storeToRefs将store中的state解构为响应式引用，以便在模板中使用
const { isLoading, statusText, recognitionResult, historyLog } = storeToRefs(faceAuthStore);
// 3. 从store中解构出需要用到的actions和getters
const { startRecognition, stopRecognition, getPersonStatusText } = faceAuthStore;

// --- 本地状态定义 ---
const videoRef = ref<HTMLVideoElement | null>(null);
// 这个isRecognizing作为UI开关的本地状态
const isRecognizing = ref(false); 

// --- 核心逻辑 ---
// 4. 监听UI开关的变化，并调用store中定义的actions来执行真正的业务逻辑
watch(isRecognizing, (newValue) => {
  if (newValue) {
    startRecognition(videoRef.value); // 调用action启动识别
  } else {
    stopRecognition(); // 调用action停止识别
  }
});

// --- 辅助函数 ---
// 用于根据识别结果返回不同的CSS类名以显示颜色
const getPersonStatusClass = (person: any) => {
  if (person.identity === 'Stranger') return 'status-stranger';
  if (person.person_state === 1) return 'status-danger';
  return 'status-known';
};

// --- 生命周期函数 ---
onMounted(() => {
  // 启用摄像头的逻辑保持不变
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (videoRef.value) {
          videoRef.value.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("无法访问摄像头:", err);
        ElMessage.error('无法访问摄像头，请检查设备和浏览器权限！');
        statusText.value = '摄像头访问失败';
      });
  } else {
    ElMessage.error('您的浏览器不支持摄像头访问功能！');
    statusText.value = '浏览器不支持';
  }
});

onUnmounted(() => {
  // 组件销毁时，确保调用store中的stopRecognition来清理定时器
  stopRecognition();
  // 并释放摄像头资源
  if (videoRef.value && videoRef.value.srcObject) {
    const stream = videoRef.value.srcObject as MediaStream;
    stream.getTracks().forEach(track => track.stop());
  }
});
</script>

<style scoped>
.face-auth {
  padding: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.auth-top {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}
.camera-box,
.info-box {
  flex: 1;
  min-height: 320px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}
video {
  width: 100%;
  height: auto;
  border-radius: 8px;
  background: #000;
}
.info-title {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 16px;
  color: #303133;
}
.info-content {
  flex-grow: 1;
}
.result-item {
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
  border-left: 4px solid;
}
.status-known {
  border-color: #67c23a;
  background-color: #f0f9eb;
}
.status-stranger {
  border-color: #e6a23c;
  background-color: #fdf6ec;
}
.status-danger {
  border-color: #f56c6c;
  background-color: #fef0f0;
}
.auth-bottom {
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}
</style>