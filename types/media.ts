import { User } from ".";
import { BaseEntity } from "./base";
import { MediaStatus, MediaType } from "./enum";
import { UserDto } from "./user";
export interface Media extends BaseEntity {
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  duration: number;
  viewCount: number;
  userId: string;
  type: MediaType;
  likeCount: number;
  dislikeCount: number;
  overallRating?: number | null;
  mediaStatus: MediaStatus;
  user: UserDto;

//   mediaCategories?: MediaCategory[];
}

export interface MediaCreateRequest {
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  duration: number;
  userId: string;
  type: MediaType;
  categoryIds?: string[]|null; 
}

export interface MediaFilterRequest {
  cursor?: string | null;
  isDescending?: boolean;
  pageSize?: number;
  search?: string;
  id?: string;
  categoryId?: string | null;
  userId?: string | null;
  type?: MediaType | null;
}