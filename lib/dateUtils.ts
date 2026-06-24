export const formatDate = (dateOffsetString: string) => {
    const videoDate = new Date(dateOffsetString); // Tự động quy đổi sang giờ Local của trình duyệt
    const now = new Date();

    // Tính khoảng cách theo Mili-giây
    const diffTime = now.getTime() - videoDate.getTime();

    // Nếu thời gian ở quá khứ gần hoặc lỗi lệch giây hệ thống
    if (diffTime < 0) return "Just now";

    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };