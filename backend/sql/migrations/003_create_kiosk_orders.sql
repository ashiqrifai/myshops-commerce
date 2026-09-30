/*
|--------------------------------------------------------------------------
| Kiosk Orders
|--------------------------------------------------------------------------
*/

DO $$
BEGIN
  CREATE TYPE "enum_kiosk_orders_fulfillmentMode"
  AS ENUM (
    'IN_STORE',
    'DELIVERY',
    'MIXED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;


DO $$
BEGIN
  CREATE TYPE "enum_kiosk_orders_deliveryStatus"
  AS ENUM (
    'NOT_REQUIRED',
    'REQUIRED',
    'SCHEDULED',
    'DISPATCHED',
    'DELIVERED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;


DO $$
BEGIN
  CREATE TYPE "enum_kiosk_orders_collectionStatus"
  AS ENUM (
    'NOT_REQUIRED',
    'PENDING',
    'READY',
    'COLLECTED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;


CREATE TABLE IF NOT EXISTS kiosk_orders (
  id UUID PRIMARY KEY,

  "companyId" UUID NOT NULL
    REFERENCES companies(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  "orderId" UUID NOT NULL
    REFERENCES orders(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  "inventoryLocationId" UUID NOT NULL
    REFERENCES inventory_locations(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  "kioskDeviceId" UUID NOT NULL
    REFERENCES kiosk_devices(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  "kioskProfileId" UUID NOT NULL
    REFERENCES kiosk_profiles(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  "fulfillmentMode"
    "enum_kiosk_orders_fulfillmentMode"
    NOT NULL
    DEFAULT 'IN_STORE',

  "deliveryStatus"
    "enum_kiosk_orders_deliveryStatus"
    NOT NULL
    DEFAULT 'NOT_REQUIRED',

  "collectionStatus"
    "enum_kiosk_orders_collectionStatus"
    NOT NULL
    DEFAULT 'PENDING',

  "deliveryScheduledAt" TIMESTAMPTZ,

  notes TEXT,

  "createdBy" UUID,

  "updatedBy" UUID,

  "createdAt" TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  "updatedAt" TIMESTAMPTZ NOT NULL
    DEFAULT NOW()
);


CREATE UNIQUE INDEX IF NOT EXISTS
  uq_kiosk_orders_company_order
ON kiosk_orders (
  "companyId",
  "orderId"
);


CREATE INDEX IF NOT EXISTS
  ix_kiosk_orders_location_created
ON kiosk_orders (
  "companyId",
  "inventoryLocationId",
  "createdAt"
);


CREATE INDEX IF NOT EXISTS
  ix_kiosk_orders_device_created
ON kiosk_orders (
  "companyId",
  "kioskDeviceId",
  "createdAt"
);


CREATE INDEX IF NOT EXISTS
  ix_kiosk_orders_delivery_status
ON kiosk_orders (
  "companyId",
  "deliveryStatus"
);


CREATE INDEX IF NOT EXISTS
  ix_kiosk_orders_collection_status
ON kiosk_orders (
  "companyId",
  "collectionStatus"
);


/*
|--------------------------------------------------------------------------
| Admin User → Inventory Location Access
|--------------------------------------------------------------------------
*/

CREATE TABLE IF NOT EXISTS user_inventory_locations (
  id UUID PRIMARY KEY,

  "companyId" UUID NOT NULL
    REFERENCES companies(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  "userId" UUID NOT NULL
    REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  "inventoryLocationId" UUID NOT NULL
    REFERENCES inventory_locations(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  "createdAt" TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  "updatedAt" TIMESTAMPTZ NOT NULL
    DEFAULT NOW()
);


CREATE UNIQUE INDEX IF NOT EXISTS
  uq_user_inventory_location
ON user_inventory_locations (
  "companyId",
  "userId",
  "inventoryLocationId"
);


CREATE INDEX IF NOT EXISTS
  ix_user_inventory_locations_location
ON user_inventory_locations (
  "companyId",
  "inventoryLocationId"
);
