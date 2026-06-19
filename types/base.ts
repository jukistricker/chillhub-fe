

export interface BaseEntity  {
  id: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string; // ISO Date string
  updatedAt: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface CursorPagedData<T> {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
}