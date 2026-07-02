export interface UserNotification {
  id: string;
  userId: string;
  mediaId: string;
  title: string;
  thumbnail: string;
  isRead: boolean;
  createdAt: string;
}