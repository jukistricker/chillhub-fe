"use client";
import { useState, useRef } from "react";
import { v7 as uuidv7 } from "uuid";
import { useAppSelector } from "@/store"; 
import { Button } from "@/components/ui/button"; 
import { getTargetResolutions } from "@/lib/utils";
import { MediaType } from "@/types/enum";
import { imageService } from "@/lib/imageUtils";
import { MediaCreateRequest } from "@/types/media";

// Giả định URL Worker Queue của bạn
const QUEUE_WORKER_URL = process.env.NEXT_PUBLIC_QUEUE_WORKER_URL||"";
const PRESIGNER_WORKER_URL = process.env.NEXT_PUBLIC_PRESIGNER_WORKER_URL||"";

const getVideoMetadata = (file: File): Promise<{ width: number; height: number; duration: number }> => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      });
    };
    video.src = URL.createObjectURL(file);
  });
};



export default function UploadVideo() {
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null); 
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>(MediaType.Video);
  
  // Xử lý Upload
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const ffmpegRef = useRef<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Lấy dữ liệu user từ Redux
  const { user } = useAppSelector(state => state.auth);
  console.log("user",user)

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMsg = `[${timestamp}] ${msg}`;
    console.log(logMsg);
    setLogs(prev => [logMsg, ...prev].slice(0, 5));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const processAndUpload = async (e: React.FormEvent, file: File | undefined) => {
    e.preventDefault();
    if (!file) {
      return setError("Vui lòng chọn video để tải lên.");
    }
    if (!user) {
      return setError("Bạn cần đăng nhập để tải lên video.");
    }
    
    setIsUploading(true);
    const startTime = performance.now();
    try {
      setError("");
      setProgress(0);
      addLog(`Bắt đầu xử lý file: ${file.name}`);

      // 1. Metadata & Phân giải
      setStatus("Đang phân tích video...");
      const metadata = await getVideoMetadata(file);
      const durationInMs = Math.round(metadata.duration * 1000);
      const folderId = uuidv7();
      const resolutions = getTargetResolutions(Number(metadata.height));

      // 2. Khởi tạo FFmpeg
      if (!ffmpegRef.current) {
        addLog("Đang tải FFmpeg Core...");
        const { createFFmpeg } = await import("@ffmpeg/ffmpeg");
        ffmpegRef.current = createFFmpeg({
          corePath: `${window.location.origin}/ffmpeg-v11/ffmpeg-core.js`,
          log: false,
        });
      }
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg.isLoaded()) await ffmpeg.load();

      ffmpeg.setProgress(({ ratio }: { ratio: number }) => {
        setProgress(Math.round(ratio * 100));
      });

      // 3. Transcode
      setStatus("Đang Transcode...");
      const { fetchFile } = await import("@ffmpeg/ffmpeg");
      ffmpeg.FS("writeFile", "input_video", await fetchFile(file));
      
      for (let i = 0; i < resolutions.length; i++) {
        try { ffmpeg.FS("mkdir", `res_${i}`); } catch (e) {}
      }

      const ffmpegArgs = [
        "-i", "input_video",
        "-threads", "2",
        "-preset", "ultrafast",
        "-g", "48",
        "-sc_threshold", "0"
      ];

      resolutions.forEach((res, index) => {
        const height = parseInt(res);
        const width = Math.round((height * metadata.width) / metadata.height);
        const safeWidth = width % 2 === 0 ? width : width + 1;
        
        ffmpegArgs.push(
          "-map", "0:v", "-map", "0:a",
          `-s:v:${index}`, `${safeWidth}x${height}`,
          `-c:v:${index}`, "libx264",
          `-b:v:${index}`, `${index === 0 ? "800k" : "1500k"}`,
          `-crf:${index}`, "28"
        );
      });

      ffmpegArgs.push(
        "-f", "hls", "-hls_time", "6", "-hls_list_size", "0",
        "-master_pl_name", "master.m3u8",
        "-var_stream_map", resolutions.map((_, i) => `v:${i},a:${i}`).join(" "),
        "res_%v/index.m3u8"
      );

      await ffmpeg.run(...ffmpegArgs);

      let thumbnailUrl = null;
      if (thumbnailFile) {
        setStatus("Đang upload ảnh bìa...");
        const urls = await imageService.uploadImages([thumbnailFile]);
        thumbnailUrl = urls[0];
      }

      // 4. Lấy URL từ Presigner Worker
      setStatus("Đang lấy vé upload...");
      const presignResponse = await fetch(PRESIGNER_WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId, duration: durationInMs, resolutions }),
      });

      const rawData = await presignResponse.json();
      const urlsToUpload = rawData.presignedData || [];
      if (urlsToUpload.length === 0) throw new Error("Không nhận được presigned URLs");

      // 5. Upload lên R2
      setStatus("Đang đẩy dữ liệu lên R2...");
      let successCount = 0;

      for (const item of urlsToUpload) {
        const parts = item.key.split('/');
        const fileName = parts[parts.length - 1];
        const resDir = parts[parts.length - 2];
        
        let fsPath = fileName === "master.m3u8" ? "master.m3u8" : `res_${resDir.replace("res_", "")}/${fileName}`;

        try {
          const fileData = ffmpeg.FS("readFile", fsPath);
          const uploadRes = await fetch(item.url, {
            method: "PUT",
            body: fileData,
            headers: {
              "Content-Type": item.key.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/MP2T",
            },
          });

          if (!uploadRes.ok) throw new Error(`HTTP ${uploadRes.status}`);
          ffmpeg.FS("unlink", fsPath);
          successCount++;
          setProgress(Math.round((successCount / urlsToUpload.length) * 100));
        } catch (e) {
          addLog(`Lỗi tải lên phần tử: ${fsPath}`);
        }
      }

      // 6. Gửi Metadata vào Queue sau khi Upload R2 thành công
      setStatus("Đang lưu thông tin hệ thống...");

      const payload: MediaCreateRequest = {
        title: title,
        description: description,
        thumbnail: thumbnailUrl,
        duration: durationInMs,
        userId: user.id,
        folderId: folderId,
        type: MediaType.Video,
        categoryIds: [] // Có thể thêm logic chọn category ở đây
      };

      const queueResponse = await fetch(QUEUE_WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!queueResponse.ok) throw new Error("Lỗi khi gửi thông tin vào Queue");

      setStatus("Hoàn tất!");
      setIsUploading(false);
      setProgress(100);

    } catch (err: any) {
      setError(err.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10 border border-border rounded-xl bg-background shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Tải video lên</h1>
      
      <form onSubmit={(e) => {
        const fileInput = document.getElementById("video-file") as HTMLInputElement;
        processAndUpload(e, fileInput?.files?.[0]);
      }} className="space-y-6">
        
        <div>
          <label className="block text-sm font-medium mb-2">Tiêu đề</label>
          <input
            type="text"
            required
            disabled={isUploading}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 rounded-md bg-muted border border-border outline-none focus:ring-2 focus:ring-primary"
            placeholder="Nhập tiêu đề video..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Mô tả</label>
          <textarea
            disabled={isUploading}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded-md bg-muted border border-border outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
            placeholder="Mô tả nội dung video của bạn..."
          />
        </div>

        <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Loại nội dung</label>
        <select
          value={mediaType}
          onChange={(e) => setMediaType(Number(e.target.value))}
          disabled={isUploading}
          className="w-full p-3 rounded-md bg-muted border border-border outline-none focus:ring-2 focus:ring-primary"
        >
          <option value={MediaType.Video}>Video</option>
          <option value={MediaType.Movie}>Movie</option>
          <option value={MediaType.Reel}>Reel</option>
        </select>
      </div>

        <div className="mt-4">
      <label className="block text-sm font-medium mb-2">Ảnh bìa (Thumbnail)</label>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleThumbnailChange}
        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:bg-primary file:text-primary-foreground rounded-lg"
      />
      {thumbnailPreview && (
        <img src={thumbnailPreview} alt="Preview" className="mt-2 w-32 h-20 object-cover rounded" />
      )}
    </div>

        <div className="p-8 border-2 border-dashed border-neutral-700 rounded-xl text-center bg-black/20">
          <input
            id="video-file"
            type="file" 
            accept="video/*"
            disabled={isUploading}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
          />
        </div>

        <Button 
          type="submit" 
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? "Đang xử lý..." : "Bắt đầu tải lên"}
        </Button>
      </form>

      {/* Progress Tracker UI */}
      {progress > 0 && (
        <div className="mt-8 animate-in fade-in duration-500">
          <div className="flex justify-between mb-2">
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">{status}</span>
            <span className="text-[10px] font-mono text-blue-400">{progress}%</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 bg-red-950/30 border border-red-700 rounded-lg p-4">
          <p className="text-red-400 text-sm font-bold">Lỗi:</p>
          <p className="text-red-300 text-xs mt-1 break-all">{error}</p>
        </div>
      )}
    </div>
  );
}