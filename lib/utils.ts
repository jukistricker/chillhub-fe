import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTargetResolutions(originalHeight: number): string[] {
  // Ưu tiên các chuẩn phổ biến
  const allRes = [240, 480, 720];
  
  // Lọc: Không upscale video
  let targets = allRes.filter(res => res <= originalHeight);
  
  // Nếu video gốc cực thấp (dưới 240p), vẫn giữ bản thấp nhất để hệ thống không trống rỗng
  if (targets.length === 0) {
    targets = [240];
  }
  
  return targets.map(String);
}