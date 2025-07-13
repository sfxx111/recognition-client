<template>
  <div class="area-config">
    <el-card>
      <template #header>
        <span>危险区域配置</span>
      </template>

      <div class="config-content">
        <!-- 摄像头视频预览 -->
        <video ref="videoRef" autoplay playsinline class="video" />

        <!-- 绘图图层 -->
        <canvas
          ref="canvasRef"
          class="overlay-canvas"
          @mousedown="startDraw"
          @mousemove="draw"
          @mouseup="endDraw"
        />

        <!-- 操作按钮区域 -->
        <div class="toolbar">
          <el-button type="success" @click="startDrawingMode" :disabled="isDrawingMode">开始绘制</el-button>
          <el-button type="primary" @click="saveRegion" :disabled="!points.length">保存区域</el-button>
          <el-button type="danger" @click="clearCanvas">清除</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

let isDrawing = false;
const isDrawingMode = ref(false);
let points: { x: number; y: number }[] = [];

onMounted(() => {
  navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }
    resizeCanvasToVideo();
  });

  window.addEventListener("resize", resizeCanvasToVideo);
});

// 同步 canvas 尺寸到视频
function resizeCanvasToVideo() {
  if (videoRef.value && canvasRef.value) {
    canvasRef.value.width = videoRef.value.clientWidth;
    canvasRef.value.height = videoRef.value.clientHeight;
    redrawCanvas();
  }
}

// 开始绘图
function startDrawingMode() {
  isDrawingMode.value = true;
  points = [];
  redrawCanvas();
}

// 鼠标事件
function startDraw(e: MouseEvent) {
  if (!isDrawingMode.value) return;
  isDrawing = true;
  points = []; // 清空旧的
  addPoint(e);
}

function draw(e: MouseEvent) {
  if (!isDrawing || !isDrawingMode.value || !canvasRef.value) return;
  addPoint(e);
  redrawCanvas();
}

function endDraw() {
  isDrawing = false;
}

// 添加当前点
function addPoint(e: MouseEvent) {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  points.push({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  });
}

// 重新绘制区域
function redrawCanvas() {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);

  if (points.length === 0) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  // 自动闭合
  ctx.closePath();
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.stroke();

  // 填充透明红色区域
  ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
  ctx.fill();
}

// 清空区域
function clearCanvas() {
  isDrawingMode.value = false;
  points = [];
  redrawCanvas();
}

// 保存区域（可替换为 axios 发送后端）
function saveRegion() {
  console.log("✅ 区域已保存，点位坐标：", points);
  isDrawingMode.value = false;
}
</script>

<style scoped>
.area-config {
  padding: 16px;
}

.config-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.video {
  width: 640px;
  height: 480px;
  background: #000;
}

.overlay-canvas {
  position: absolute;
  top: 56px; /* header + margin */
  left: 0;
  width: 640px;
  height: 480px;
  z-index: 2;
  pointer-events: auto;
}

.toolbar {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}
</style>
