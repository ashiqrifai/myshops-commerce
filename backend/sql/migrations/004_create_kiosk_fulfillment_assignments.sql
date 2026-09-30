/*
|--------------------------------------------------------------------------
| Kiosk Fulfillment Assignments
|--------------------------------------------------------------------------
|
| A kiosk sale may originate from one store while another inventory
| location is selected later to reserve and fulfill the item.
|
| The assignment is created initially as AWAITING_ASSIGNMENT.
| No remote inventory is reserved until a fulfillment location is
| explicitly selected.
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Status Enum
|--------------------------------------------------------------------------
*/

DO $$
BEGIN
  CREATE TYPE
    "enum_kiosk_fulfillment_assignments_status"
  AS ENUM (
    'AWAITING_ASSIGNMENT',
    'RESERVED',
    'PREPARING',
    'READY',
    'DISPATCHED',
    'DELIVERED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$$;


/*
|--------------------------------------------------------------------------
| Table
|--------------------------------------------------------------------------
*/

CREATE TABLE IF NOT EXISTS
  kiosk_fulfillment_assignments
(
  id UUID PRIMARY KEY,

  "companyId" UUID NOT NULL
    REFERENCES companies(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  "orderId" UUID NOT NULL
    REFERENCES orders(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  "orderItemId" UUID NOT NULL
    REFERENCES order_items(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  "sellingLocationId" UUID NOT NULL
    REFERENCES inventory_locations(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  "fulfillmentLocationId" UUID
    REFERENCES inventory_locations(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  "productVariantId" UUID NOT NULL
    REFERENCES product_variants(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  sku VARCHAR(180) NOT NULL,

  quantity NUMERIC(18,4) NOT NULL,

  status
    "enum_kiosk_fulfillment_assignments_status"
    NOT NULL
    DEFAULT 'AWAITING_ASSIGNMENT',

  "assignedBy" UUID
    REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  "assignedAt" TIMESTAMPTZ,

  "reservedAt" TIMESTAMPTZ,

  "readyAt" TIMESTAMPTZ,

  "dispatchedAt" TIMESTAMPTZ,

  "deliveredAt" TIMESTAMPTZ,

  notes TEXT,

  "createdAt" TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  "updatedAt" TIMESTAMPTZ NOT NULL
    DEFAULT NOW()
);


/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

CREATE UNIQUE INDEX IF NOT EXISTS
  uq_kiosk_fulfillment_order_item
ON kiosk_fulfillment_assignments (
  "companyId",
  "orderItemId"
);


CREATE INDEX IF NOT EXISTS
  idx_kfa_selling_status
ON kiosk_fulfillment_assignments (
  "companyId",
  "sellingLocationId",
  status
);


CREATE INDEX IF NOT EXISTS
  idx_kfa_fulfill_status
ON kiosk_fulfillment_assignments (
  "companyId",
  "fulfillmentLocationId",
  status
);


CREATE INDEX IF NOT EXISTS
  idx_kfa_order
ON kiosk_fulfillment_assignments (
  "companyId",
  "orderId"
);
