/*
|--------------------------------------------------------------------------
| 001_create_kiosk_management.sql
|--------------------------------------------------------------------------
|
| Adds store-specific Android kiosk management.
|
| New tables:
|   - kiosk_profiles
|   - kiosk_profile_pages
|   - kiosk_devices
|
| Existing MyShops tables are not modified.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Kiosk Profiles
|--------------------------------------------------------------------------
|
| A kiosk profile normally represents one MyShops outlet/store configuration.
|
| Example:
|   DXB_DEIRA_CC
|   DXB_WAFI
|   AUH_SAJ
|
| The profile points to the existing inventory location.
|
|--------------------------------------------------------------------------
*/

CREATE TABLE kiosk_profiles (
    id UUID PRIMARY KEY,

    "companyId" UUID NOT NULL,
    "inventoryLocationId" UUID NOT NULL,

    name VARCHAR(150) NOT NULL,
    code VARCHAR(100) NOT NULL,

    description TEXT,

    settings JSONB NOT NULL DEFAULT '{}'::jsonb,

    "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,

    "createdBy" UUID,
    "updatedBy" UUID,

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT kiosk_profiles_company_fk
        FOREIGN KEY ("companyId")
        REFERENCES companies(id),

    CONSTRAINT kiosk_profiles_inventory_location_fk
        FOREIGN KEY ("inventoryLocationId")
        REFERENCES inventory_locations(id),

    CONSTRAINT kiosk_profiles_created_by_fk
        FOREIGN KEY ("createdBy")
        REFERENCES users(id),

    CONSTRAINT kiosk_profiles_updated_by_fk
        FOREIGN KEY ("updatedBy")
        REFERENCES users(id),

    CONSTRAINT kiosk_profiles_company_code_unique
        UNIQUE ("companyId", code)
);


/*
|--------------------------------------------------------------------------
| Kiosk Profile Indexes
|--------------------------------------------------------------------------
*/

CREATE INDEX kiosk_profiles_company_location_idx
    ON kiosk_profiles (
        "companyId",
        "inventoryLocationId"
    );

CREATE INDEX kiosk_profiles_company_active_idx
    ON kiosk_profiles (
        "companyId",
        "isActive"
    );

CREATE INDEX kiosk_profiles_company_default_idx
    ON kiosk_profiles (
        "companyId",
        "isDefault"
    );


/*
|--------------------------------------------------------------------------
| Kiosk Profile Page Type
|--------------------------------------------------------------------------
|
| Allows a store/profile to have independently assigned CMS pages.
|
|--------------------------------------------------------------------------
*/

CREATE TYPE enum_kiosk_profile_pages_page_type AS ENUM (
    'HOME',
    'OFFERS',
    'WELCOME',
    'IDLE',
    'CUSTOM'
);


/*
|--------------------------------------------------------------------------
| Kiosk Profile Pages
|--------------------------------------------------------------------------
|
| Connects a kiosk profile to an existing CMS page.
|
| Example:
|
|   Deira Profile
|       HOME -> KIOSK_HOME_DCC
|
|   Wafi Profile
|       HOME -> KIOSK_HOME_WAFI
|
| Because each CMS page owns its own CmsPageSections, each store can have
| completely different sections, ordering, promotions and content.
|
|--------------------------------------------------------------------------
*/

CREATE TABLE kiosk_profile_pages (
    id UUID PRIMARY KEY,

    "companyId" UUID NOT NULL,
    "kioskProfileId" UUID NOT NULL,

    "pageType"
        enum_kiosk_profile_pages_page_type
        NOT NULL
        DEFAULT 'HOME',

    "cmsPageId" UUID NOT NULL,

    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,

    "createdBy" UUID,
    "updatedBy" UUID,

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT kiosk_profile_pages_company_fk
        FOREIGN KEY ("companyId")
        REFERENCES companies(id),

    CONSTRAINT kiosk_profile_pages_profile_fk
        FOREIGN KEY ("kioskProfileId")
        REFERENCES kiosk_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT kiosk_profile_pages_cms_page_fk
        FOREIGN KEY ("cmsPageId")
        REFERENCES cms_pages(id),

    CONSTRAINT kiosk_profile_pages_created_by_fk
        FOREIGN KEY ("createdBy")
        REFERENCES users(id),

    CONSTRAINT kiosk_profile_pages_updated_by_fk
        FOREIGN KEY ("updatedBy")
        REFERENCES users(id),

    CONSTRAINT kiosk_profile_pages_profile_type_unique
        UNIQUE (
            "companyId",
            "kioskProfileId",
            "pageType"
        )
);


/*
|--------------------------------------------------------------------------
| Kiosk Profile Page Indexes
|--------------------------------------------------------------------------
*/

CREATE INDEX kiosk_profile_pages_company_page_idx
    ON kiosk_profile_pages (
        "companyId",
        "cmsPageId"
    );

CREATE INDEX kiosk_profile_pages_company_active_idx
    ON kiosk_profile_pages (
        "companyId",
        "isActive"
    );


/*
|--------------------------------------------------------------------------
| Kiosk Device Status
|--------------------------------------------------------------------------
*/

CREATE TYPE enum_kiosk_devices_status AS ENUM (
    'PENDING',
    'ACTIVE',
    'DISABLED'
);


/*
|--------------------------------------------------------------------------
| Kiosk Devices
|--------------------------------------------------------------------------
|
| Represents the actual physical Android kiosk.
|
| Multiple devices can belong to the same store/profile.
|
| Example:
|
|   DCC Profile
|       DCC-KIOSK-01
|       DCC-KIOSK-02
|
|--------------------------------------------------------------------------
*/

CREATE TABLE kiosk_devices (
    id UUID PRIMARY KEY,

    "companyId" UUID NOT NULL,
    "kioskProfileId" UUID NOT NULL,

    "deviceCode" VARCHAR(120) NOT NULL,
    "deviceName" VARCHAR(180) NOT NULL,

    "activationTokenHash" VARCHAR(255),

    status enum_kiosk_devices_status
        NOT NULL
        DEFAULT 'PENDING',

    "appVersion" VARCHAR(50),

    "lastSeenAt" TIMESTAMPTZ,

    settings JSONB NOT NULL DEFAULT '{}'::jsonb,

    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,

    "createdBy" UUID,
    "updatedBy" UUID,

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT kiosk_devices_company_fk
        FOREIGN KEY ("companyId")
        REFERENCES companies(id),

    CONSTRAINT kiosk_devices_profile_fk
        FOREIGN KEY ("kioskProfileId")
        REFERENCES kiosk_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT kiosk_devices_created_by_fk
        FOREIGN KEY ("createdBy")
        REFERENCES users(id),

    CONSTRAINT kiosk_devices_updated_by_fk
        FOREIGN KEY ("updatedBy")
        REFERENCES users(id),

    CONSTRAINT kiosk_devices_company_device_code_unique
        UNIQUE (
            "companyId",
            "deviceCode"
        )
);


/*
|--------------------------------------------------------------------------
| Kiosk Device Indexes
|--------------------------------------------------------------------------
*/

CREATE INDEX kiosk_devices_company_profile_idx
    ON kiosk_devices (
        "companyId",
        "kioskProfileId"
    );

CREATE INDEX kiosk_devices_company_status_active_idx
    ON kiosk_devices (
        "companyId",
        status,
        "isActive"
    );

CREATE INDEX kiosk_devices_last_seen_idx
    ON kiosk_devices (
        "lastSeenAt"
    );
