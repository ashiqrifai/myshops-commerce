export type CustomerNotificationChannel =
  | "IN_APP"
  | "EMAIL"
  | "SMS"
  | "WHATSAPP"
  | "PUSH";

export interface CustomerNotificationEntity {
  type:
    | string
    | null;

  id:
    | string
    | null;
}

export interface CustomerNotificationEmail {
  status:
    | "NOT_REQUIRED"
    | "PENDING"
    | "SENT"
    | "FAILED";

  sentAt:
    | string
    | null;

  error:
    | string
    | null;
}

export interface CustomerNotification {
  id:
    string;

  companyId:
    string;

  customerId:
    string;

  type:
    string;

  channel:
    CustomerNotificationChannel;

  title:
    string;

  message:
    string;

  entity:
    CustomerNotificationEntity;

  actionUrl:
    | string
    | null;

  data:
    Record<
      string,
      unknown
    >;

  isRead:
    boolean;

  readAt:
    | string
    | null;

  email:
    CustomerNotificationEmail;

  createdAt:
    string;

  updatedAt:
    string;
}

export interface CustomerNotificationPagination {
  page:
    number;

  limit:
    number;

  total:
    number;

  totalPages:
    number;

  hasNextPage:
    boolean;

  hasPreviousPage:
    boolean;
}

export interface CustomerNotificationListResult {
  notifications:
    CustomerNotification[];

  pagination:
    CustomerNotificationPagination;
}

export interface CustomerNotificationUnreadCount {
  unreadCount:
    number;
}

export interface CustomerNotificationDeleteResult {
  id:
    string;

  deleted:
    boolean;
}

export interface CustomerNotificationMarkAllResult {
  updatedCount:
    number;

  readAt:
    | string
    | null;
}

export interface CustomerNotificationFieldError {
  field?:
    string;

  message?:
    string;
}

export interface CustomerNotificationApiErrorShape {
  status:
    number;

  code?:
    string;

  message:
    string;

  details:
    CustomerNotificationFieldError[];
}