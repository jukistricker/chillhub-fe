const AUTH = "/auth"
const MEDIA = "/media"

export const API_ENDPOINTS = {
  AUTH: {
    ROOT: AUTH,
    LOGIN: `${AUTH}/login`,
    REGISTER: `${AUTH}/signup`,
    LOGOUT: `${AUTH}/logout`,
    INFO: `${AUTH}/info`,
    REFRESH_TOKEN: `${AUTH}/refresh-token`
  },
  MEDIA: {
    ROOT: "/media",
    UPLOAD: "/media/upload",
  },
} as const;