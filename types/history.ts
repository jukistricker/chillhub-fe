export interface MediaHistoryFilterRequest {
  cursor?: string | null;
  isDescending?: boolean;
  pageSize?: number;
  search?: string;
  id?: string;
}

export interface MediaHistory {
  id: string;
  progress: number;
  userId: string;
  mediaId: string;
  title: string;
  thumbnail: string;
  duration: number;
  username: string;
  fullName: string;
  avatarUrl:string;
}