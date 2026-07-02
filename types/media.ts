import { User } from ".";
import { BaseEntity } from "./base";
import { MediaStatus, MediaType, ReactionType } from "./enum";
import { UserDto } from "./user";
export interface Media extends BaseEntity {
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  duration: number;
  viewCount: number;
  userId: string;
  folderId:string;
  type: MediaType;
  likeCount: number;
  dislikeCount: number;
  overallRating?: number | null;
  mediaStatus: MediaStatus;
  user: UserDto;
  currentUserReaction?: ReactionType;

//   mediaCategories?: MediaCategory[];
}

export interface MediaCreateRequest {
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  duration: number;
  userId: string;
  folderId:string;
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

export interface CheckReactionRequest {
  UserId: string;
  MediaId: string;
}

export interface ReactionResponse {
  id: string;
  userId: string;
  mediaId: string;
  reactionType: ReactionType;
  createdAt: string;
}