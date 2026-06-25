// ============ 用户相关 ============
export const USER_CONSTANTS = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  DISPLAY_NAME_MAX_LENGTH: 100,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 100,
  BCRYPT_SALT_ROUNDS: 12,
} as const;

// ============ 消息相关 ============
export const MESSAGE_CONSTANTS = {
  CONTENT_MAX_LENGTH: 5000,
  MEDIA_MAX_COUNT: 10,
  MEDIA_MAX_SIZE_MB: 10,
  RETENTION_DAYS: 365,
} as const;

// ============ 时间胶囊 ============
export const CAPSULE_CONSTANTS = {
  CONTENT_MAX_LENGTH: 5000,
  MEDIA_MAX_COUNT: 5,
  MAX_FUTURE_DAYS: 365 * 10,
  MIN_TRIGGER_MINUTES: 5,
} as const;

// ============ 里程碑阈值 ============
export const MILESTONE_THRESHOLDS = {
  FIRST_MESSAGE: 1,
  MESSAGES_100: 100,
  MESSAGES_500: 500,
  MESSAGES_1000: 1000,
  DAYS_7: 7,
  DAYS_30: 30,
  DAYS_100: 100,
  DAYS_365: 365,
} as const;

// ============ 共享日记 ============
export const DIARY_CONSTANTS = {
  TITLE_MAX_LENGTH: 100,
  CONTENT_MAX_LENGTH: 10000,
  ENTRIES_PER_PAGE: 20,
} as const;

// ============ 共享相册 ============
export const ALBUM_CONSTANTS = {
  NAME_MAX_LENGTH: 100,
  PHOTOS_PER_PAGE: 20,
  MAX_ALBUMS: 50,
  MAX_PHOTOS_PER_ALBUM: 1000,
} as const;

// ============ WebSocket ============
export const WS_CONSTANTS = {
  RECONNECT_INTERVAL_MS: 3000,
  MAX_RECONNECT_ATTEMPTS: 10,
  HEARTBEAT_INTERVAL_MS: 30000,
  TYPING_TIMEOUT_MS: 3000,
} as const;

// ============ 推送通知 ============
export const PUSH_CONSTANTS = {
  SERVERCHAN_DAILY_LIMIT: 5,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const;

// ============ 安全 ============
export const SECURITY_CONSTANTS = {
  JWT_EXPIRY_HOURS: 24,
  REFRESH_TOKEN_EXPIRY_DAYS: 90,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  RATE_LIMIT_WINDOW_MS: 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: 60,
} as const;

// ============ 分页 ============
export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// ============ 文件上传 ============
export const UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE_MB: 50,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/mov'],
  THUMBNAIL_SIZE: 200,
} as const;
