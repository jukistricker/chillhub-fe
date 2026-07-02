"use client";
import { useState, useRef, useEffect } from "react";
import { v7 as uuidv7 } from "uuid";
import { useAppDispatch, useAppSelector } from "@/store"; 
import { Button } from "@/components/ui/button"; 
import { getTargetResolutions } from "@/lib/utils";
import { MediaType } from "@/types/enum";
import { imageService } from "@/lib/imageUtils";
import { MediaCreateRequest } from "@/types/media";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import { Category } from "@/types/category";
import { fetchCategories } from "@/store/slices/categorySlice";
import { createPortal } from "react-dom";
import CategorySelect from "@/components/ui/CategorySelect";

// Giả định URL Worker Queue của bạn
const QUEUE_WORKER_URL = process.env.NEXT_PUBLIC_QUEUE_WORKER_URL||"";
const PRESIGNER_WORKER_URL = process.env.NEXT_PUBLIC_PRESIGNER_WORKER_URL||"";
const MAX_FILE_SIZE = 70 * 1024 * 1024;

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

const extractThumbnailFromVideo = (file: File, timeInSeconds: number = 2): Promise<File | null> => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    video.autoplay = false;
    video.muted = true;
    video.src = URL.createObjectURL(file);

    video.onloadeddata = () => {
      // Đảm bảo thời gian muốn lấy không vượt quá độ dài video
      // Nếu video ngắn hơn timeInSeconds, lấy frame ở giữa video
      video.currentTime = Math.min(timeInSeconds, video.duration / 2);
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Vẽ frame hiện tại của video lên canvas
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Chuyển canvas thành Blob, sau đó thành File object
      canvas.toBlob((blob) => {
        if (blob) {
          const fileName = `thumbnail-${Date.now()}.jpeg`;
          const generatedFile = new File([blob], fileName, { type: "image/jpeg" });
          resolve(generatedFile);
        } else {
          resolve(null);
        }
        URL.revokeObjectURL(video.src); // Xóa URL để giải phóng bộ nhớ
      }, "image/jpeg", 0.8); // 0.8 là chất lượng ảnh (80%)
    };

    video.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(video.src);
    };
  });
};



export default function UploadVideo() {
  const router = useRouter();
  const dispatch = useAppDispatch();
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
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

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
  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Nếu người dùng CHƯA chọn ảnh thumbnail, tự động lấy từ giây thứ 2 của video
    if (!thumbnailFile) {
      try {
        const generatedThumbnail = await extractThumbnailFromVideo(file, 2); 
        if (generatedThumbnail) {
          setThumbnailFile(generatedThumbnail);
          setThumbnailPreview(URL.createObjectURL(generatedThumbnail));
        }
      } catch (error) {
        console.error("Lỗi khi tạo thumbnail tự động:", error);
      }
    }
  };

  const processAndUpload = async (e: React.FormEvent, file: File | undefined) => {
    e.preventDefault();
    if (!file) {
      return setError("Please select video.");
    }
    if (file.size > MAX_FILE_SIZE) {
      return setError("File size exceeds the 70MB limit. Please choose a smaller video.");
    }
    if (!user) {
      return setError("You have to login to upload.");
    }
    
    setIsUploading(true);
    const startTime = performance.now();
    try {
      setError("");
      setProgress(0);
      addLog(`Bắt đầu xử lý file: ${file.name}`);

      // 1. Metadata & Phân giải
      setStatus("Processing video...");
      const metadata = await getVideoMetadata(file);
      const durationInMs = Math.round(metadata.duration * 1000);
      const folderId = uuidv7();
      const resolutions = getTargetResolutions(Number(metadata.height));

      // 2. Khởi tạo FFmpeg
      if (!ffmpegRef.current) {
        addLog("Loading FFmpeg Core...");
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
      setStatus("Transcoding...");
      const { fetchFile } = await import("@ffmpeg/ffmpeg");
      ffmpeg.FS("writeFile", "input_video", await fetchFile(file));
      
      for (let i = 0; i < resolutions.length; i++) {
        try { ffmpeg.FS("mkdir", `res_${i}`); } catch (e) {}
      }

     const ffmpegArgs = [
  "-i", "input_video",
  "-threads", "2",
  "-preset", "superfast", 
  "-g", "48",
  "-sc_threshold", "0"
];

// Giả sử mảng đầu vào của bạn như thế này:
// const resolutions = ["240", "480", "720"];

resolutions.forEach((res, index) => {
  const height = parseInt(res);
  const width = Math.round((height * metadata.width) / metadata.height);
  const safeWidth = width % 2 === 0 ? width : width + 1;
  
  // Tính toán bitrate tối ưu riêng cho từng mốc 240p, 480p, 720p linh hoạt
  let targetBitrate, maxBitrate, bufSize;
  
  if (height <= 240) {
    targetBitrate = "400k";
    maxBitrate = "600k";
    bufSize = "800k";
  } else if (height <= 480) {
    targetBitrate = "1000k";
    maxBitrate = "1500k";
    bufSize = "2000k";
  } else { // Cho 720p hoặc cao hơn
    targetBitrate = "2200k";
    maxBitrate = "3000k";
    bufSize = "4400k";
  }

  ffmpegArgs.push(
    "-map", "0:v", "-map", "0:a",
    `-s:v:${index}`, `${safeWidth}x${height}`,
    `-c:v:${index}`, "libx264",
    `-b:v:${index}`, targetBitrate,
    `-maxrate:v:${index}`, maxBitrate,
    `-bufsize:v:${index}`, bufSize,
    `-profile:v:${index}`, "main",
    // Đã sửa: Thêm chỉ số :${index} để FFmpeg mapping chính xác cho từng phân giải
    `-pix_fmt:v:${index}`, "yuv420p" 
  );
});

ffmpegArgs.push(
  "-f", "hls", 
  "-hls_time", "6", 
  "-hls_list_size", "0",
  "-master_pl_name", "master.m3u8",
  "-var_stream_map", resolutions.map((_, i) => `v:${i},a:${i}`).join(" "),
  "res_%v/index.m3u8"
);

      await ffmpeg.run(...ffmpegArgs);

      let thumbnailUrl = null;
      if (thumbnailFile) {
        setStatus("Uploading thumbnail...");
        const urls = await imageService.uploadImages([thumbnailFile]);
        thumbnailUrl = urls[0];
      }

      // 4. Lấy URL từ Presigner Worker
      setStatus("Receiving resources...");
      const presignResponse = await fetch(PRESIGNER_WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId, duration: metadata.duration, resolutions }),
      });

      const rawData = await presignResponse.json();
      const urlsToUpload = rawData.presignedData || [];
      if (urlsToUpload.length === 0) throw new Error("Could not receive resources"); //presign urls

      // 5. Upload lên R2
      setStatus("Uploading video...");
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
      setStatus("Saving metadata...");

      const payload: MediaCreateRequest = {
        title: title,
        description: description,
        thumbnail: thumbnailUrl,
        duration: durationInMs,
        userId: user.id,
        folderId: folderId,
        type: MediaType.Video,
        categoryIds: selectedCategoryIds 
      };

      const queueResponse = await fetch(`${QUEUE_WORKER_URL}/api/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!queueResponse.ok) throw new Error("Error when sending data to queue");

      setStatus("Done!");
      setIsUploading(false);
      setProgress(100);

      toast.success("Upload success! Please wait some minutes", { duration: 6000 });

      router.push("/");

    } catch (err: any) {
      setError(err.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10 border border-border rounded-xl bg-background shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Upload video</h1>
      
      <form onSubmit={(e) => {
        const fileInput = document.getElementById("video-file") as HTMLInputElement;
        processAndUpload(e, fileInput?.files?.[0]);
      }} className="space-y-6">
        
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            required
            disabled={isUploading}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 rounded-md bg-muted border border-border outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter video title..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            disabled={isUploading}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded-md bg-muted border border-border outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
            placeholder="Your video description..."
          />
        </div>

        <div className="mb-6">
        {user?.username=="admin"&&(
          <div>
            <label className="block text-sm font-medium mb-2">Media Type</label>
        <select
          value={mediaType}
          onChange={(e) => setMediaType(Number(e.target.value))}
          disabled={isUploading}
          className="w-full p-3 rounded-md bg-muted border border-border outline-none focus:ring-2 focus:ring-primary"
        >
          <option value={MediaType.Video}>Video</option>
          <option value={MediaType.Movie}>Movie</option>
          {/* <option value={MediaType.Reel}>Reel</option> */}
        </select>
          </div>
        )}
      </div>

        <div className="mt-4">
      <label className="block text-sm font-medium mb-2">Thumbnail</label>
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
            onChange={handleVideoChange}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
          />
        </div>
        <CategorySelect value={selectedCategoryIds} onChange={setSelectedCategoryIds} />

        <Button 
          type="submit" 
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? "Uploading..." : "Start upload"}
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
              className="bg-amber-500 h-full rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
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