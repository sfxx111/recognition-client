// src/store/monitor.ts
import { defineStore } from 'pinia';
import { ElMessage } from 'element-plus';
import axios from 'axios';

// This would typically be your backend's public IP or domain
const API_BASE_URL = 'http://YOUR_BACKEND_SERVER_IP/api'; // <--- 请确保这个 URL 是正确的，替换为你的实际后端地址

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // 你会在这里配置认证头，例如用于 JWT token
  // headers: {
  //   Authorization: `Bearer ${localStorage.getItem('yourAuthToken')}` // 假设使用 Bearer Token
  // }
});

// --- Data Structures (Interfaces) ---
export interface DetectionEvent {
  id: number;
  event_type: string;
  level: 'high' | 'medium' | 'low';
  description: string;
  time: string;
}

// --- 这是需要修改的部分 ---
// 确保这里的 Camera 接口与后端模型字段保持一致，用于数据接收和类型提示
export interface Camera {
  id: number;
  name: string;
  location?: string;
  camera_type?: string;
  stream_key: string; // 这是前端表单使用的字段名
  status?: 'online' | 'offline'; // 这可能是前端自定义的状态，如果后端不返回可以设为可选
  url: string; // 对应后端模型的 'url'
  password?: string; // 对应后端模型的 'password'，从 stream_key 映射而来
  is_active: boolean; // 对应后端模型的 'is_active'
  user?: number; // 对应后端模型的 user_id，如果后端返回用户ID的话
}
// --- 修改结束 ---

// --- Store Definition ---
export const useMonitorStore = defineStore('monitor', {
  // State: All the data for our component
  state: () => ({
    cameraList: [] as Camera[],
    eventList: [] as DetectionEvent[],
    selectedCameraId: null as number | null,
    loading: false,
    viewMode: 'grid' as 'grid' | 'single',
    streamBaseUrl: 'http://127.0.0.1:5000/stream/', // 从你的 index.vue 代码中推断出的
  }),

  // Getters: Computed properties derived from state
  getters: {
    currentCamera(state): Camera | undefined {
      return state.cameraList.find(camera => camera.id === state.selectedCameraId);
    },
  },

  // Actions: Methods that contain business logic and can be asynchronous
  actions: {
    // Fetches all cameras from the backend
    async fetchCameras() {
      this.loading = true;
      try {
        const response = await apiClient.get<Camera[]>('/cameras/');
        this.cameraList = response.data;
        
        // Auto-select the first camera if the list is not empty
        if (this.cameraList.length > 0 && !this.selectedCameraId) {
          this.setSelectedCamera(this.cameraList[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch cameras:", error);
        ElMessage.error('获取摄像头列表失败');
      } finally {
        this.loading = false;
      }
    },

    // Fetches events for a specific camera
    async fetchEventsForSelectedCamera() {
      if (!this.selectedCameraId) {
        this.eventList = [];
        return;
      }
      try {
        const response = await apiClient.get<DetectionEvent[]>(`/events/?camera_id=${this.selectedCameraId}`);
        this.eventList = response.data;
      } catch (error) {
        console.error(`Failed to fetch events for camera ${this.selectedCameraId}:`, error);
        ElMessage.error('获取事件列表失败');
      }
    },

    // Creates a new camera
    // --- 这是需要修改的部分 ---
    // 这里的 cameraData 类型与 index.vue 中构造的 cameraDataToSend 类型一致
    async createCamera(cameraData: { name: string; location?: string; camera_type?: string; url: string; password: string; is_active: boolean }): Promise<boolean> {
      try {
        await apiClient.post('/cameras/', cameraData); 
        // ElMessage.success('摄像头添加成功！'); // 成功消息由 index.vue 统一处理
        await this.fetchCameras(); // 刷新摄像头列表
        return true; // 表示成功
      } catch (error: any) { // 明确指定 error 类型为 any，以便访问 response 属性
        console.error("Failed to create camera:", error);
        let errorMessage = '添加摄像头失败，请检查输入！';
        if (error.response && error.response.data) {
          // 尝试从后端错误响应中提取详细信息
          if (typeof error.response.data === 'object' && !Array.isArray(error.response.data)) {
            // 如果后端返回的是 { "field_name": ["error message"] } 这样的对象
            // 或者 { "detail": "..." } 这样的
            errorMessage = Object.entries(error.response.data)
                              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                              .join('; ');
          } else if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (Array.isArray(error.response.data)) {
            // 如果后端返回的是 ["error message"] 这样的数组
            errorMessage = error.response.data.join('; ');
          }
        } else if (error.message) {
            errorMessage = error.message;
        }
        ElMessage.error(errorMessage); // 显示具体的错误消息
        return false; // 表示失败
      }
    },
    // --- 修改结束 ---

    // Action to update the selected camera ID and fetch its events
    setSelectedCamera(cameraId: number) {
      this.selectedCameraId = cameraId;
      this.fetchEventsForSelectedCamera();
    },

    // Action to switch view mode
    setViewMode(mode: 'grid' | 'single') {
        this.viewMode = mode;
    }
  },
});