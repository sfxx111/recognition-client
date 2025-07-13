import { aiRequest } from '@/utils/request';
// 它会自动请求 https://8.152.101.217/api/ai/recognize-frame
export const recognizeFrameAPI = (imageData: string) => {
  return aiRequest.post('/recognize-frame', { image_data: imageData });
};