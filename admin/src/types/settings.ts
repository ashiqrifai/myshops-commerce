export type SettingDataType =
  | "STRING"
  | "NUMBER"
  | "BOOLEAN"
  | "COLOR"
  | "IMAGE"
  | "URL"
  | "EMAIL"
  | "JSON"
  | "SELECT";

export type SettingChannel =
  | "GLOBAL"
  | "ADMIN"
  | "WEBSITE"
  | "KIOSK";

export interface SettingOption {
  label: string;
  value: string;
}

export interface SystemSetting {
  id: string;
  companyId: string;
  group: string;
  key: string;
  label: string;
  description?: string | null;
  value: unknown;
  defaultValue: unknown;
  dataType: SettingDataType;
  options?: SettingOption[] | string[] | null;
  channel: SettingChannel;
  isPublic: boolean;
  isEditable: boolean;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsResponse {
  success: boolean;
  data: SystemSetting[];
}

export interface BulkUpdateSettingsRequest {
  settings: Array<{
    id: string;
    value: unknown;
  }>;
}