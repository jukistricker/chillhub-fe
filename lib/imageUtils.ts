import axios from "axios";

const IMAGE_WORKER_URL = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_WORKER;

export const imageService = {
  uploadImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      console.log("image worker:", IMAGE_WORKER_URL);
      
      const response = await axios.post<{ image_urls: string[] }>(
        IMAGE_WORKER_URL || '', 
        formData, 
        { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        }
      );
      
      
      return response.data.image_urls;
      
    } catch (error: any) {
      console.error("Upload thất bại:", error);
      throw new Error(error.response?.data?.error || "Lỗi upload ảnh");
    }
  }
}
//cuối cùng lại quay về axios gốc :)) cay vl :))))