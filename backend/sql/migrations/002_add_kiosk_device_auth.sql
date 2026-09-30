ALTER TABLE kiosk_devices
  ADD COLUMN IF NOT EXISTS "deviceTokenHash" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "activatedAt" TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS kiosk_devices_device_token_hash_idx
  ON kiosk_devices ("deviceTokenHash")
  WHERE "deviceTokenHash" IS NOT NULL;
