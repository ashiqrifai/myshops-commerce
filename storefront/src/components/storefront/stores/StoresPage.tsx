"use client";

import {
  Building2,
  Clock3,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Search,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

type Country =
  | "UAE"
  | "Azerbaijan";

type CountryFilter =
  | "All"
  | Country;

interface Store {
  id: string;
  country: Country;

  /*
   * Used for grouping.
   * Example:
   * Dubai - UAE
   * Abu Dhabi - UAE
   * Azerbaijan
   */
  region: string;

  city: string;
  name: string;
  address: string;

  phoneLines: string[];

  timings: string[];

  /*
   * Optional coordinates used only by
   * "Nearest Store".
   */
  latitude?: number;
  longitude?: number;
}

/*
|--------------------------------------------------------------------------
| Store Data
|--------------------------------------------------------------------------
*/

const stores: Store[] = [
  {
    id:
      "outlet-mall",

    country:
      "UAE",

    region:
      "Dubai - UAE",

    city:
      "Dubai",

    name:
      "My Shops Outlet Mall UAE",

    address:
      "Route 66 - Dubai Outlet Mall - Dubai",

    phoneLines: [
      "+971 5 42098989",
      "800-8989",
    ],

    timings: [
      "9:00 AM - 11:00 PM",
    ],

    latitude:
      25.0729091,

    longitude:
      55.4003465,
  },

  {
    id:
      "wafi-mall",

    country:
      "UAE",

    region:
      "Dubai - UAE",

    city:
      "Dubai",

    name:
      "My Shops Wafi Mall UAE",

    address:
      "Wafi Mall at Wafi City - 1st Floor - Oud Metha",

    phoneLines: [
      "056 835 4828",
    ],

    timings: [
      "Sunday - Thursday: 10:00 AM - 10:00 PM",
      "Friday - Saturday: 10:00 AM - 12:00 AM (Midnight)",
    ],

    latitude:
      25.2284,

    longitude:
      55.3199,
  },

  {
    id:
      "city-centre-deira",

    country:
      "UAE",

    region:
      "Dubai - UAE",

    city:
      "Dubai",

    name:
      "My Shops City Centre Deira UAE",

    address:
      "8th St - Port Saeed - Deira - Dubai",

    phoneLines: [
      "0565650089",
    ],

    timings: [
      "10:00 AM - 11:00 PM",
    ],

    latitude:
      25.2513,

    longitude:
      55.3314,
  },

  {
    id:
      "souq-al-jami",

    country:
      "UAE",

    region:
      "Abu Dhabi - UAE",

    city:
      "Abu Dhabi",

    name:
      "My Shops Souq Al Jami' UAE",

    address:
      "Sheikh Zayed Grand Mosque Road, Abu Dhabi",

    phoneLines: [
      "0566145689",
    ],

    timings: [
      "9:00 AM - 10:00 PM",
    ],

    latitude:
      24.4442,

    longitude:
      54.3925,
  },

  {
    id:
      "crescent-mall",

    country:
      "Azerbaijan",

    region:
      "Azerbaijan",

    city:
      "Baku",

    name:
      "My Shops Crescent Mall Azerbaijan",

    address:
      "68 Neftchilar Ave, Azerbaijan",

    phoneLines: [
      "+994 55 889 89 82",
    ],

    timings: [
      "9:00 AM - 10:00 PM",
    ],
  },

  {
    id:
      "sumqayit",

    country:
      "Azerbaijan",

    region:
      "Azerbaijan",

    city:
      "Sumqayit",

    name:
      "My Shops Sumqayit Azerbaijan",

    address:
      "küçəsi 2 Uzeyir Hajibayov, Sumqayit, Azerbaijan",

    phoneLines: [
      "+994 55 889 89 89",
    ],

    timings: [
      "10:00 AM - 8:00 PM",
    ],
  },

  {
    id:
      "bulbul-street",

    country:
      "Azerbaijan",

    region:
      "Azerbaijan",

    city:
      "Baku",

    name:
      "My Shops Bülbül Street Azerbaijan",

    address:
      "38c Bulbul Ave, Baku, Azerbaijan",

    phoneLines: [
      "+994 55 889 89 82",
    ],

    timings: [
      "10:00 AM - 8:00 PM",
    ],
  },

  {
    id:
      "ganjlik-mall",

    country:
      "Azerbaijan",

    region:
      "Azerbaijan",

    city:
      "Baku",

    name:
      "My Shops Ganjlik Mall Azerbaijan",

    address:
      "38c Bulbul Ave, Baku, Azerbaijan",

    phoneLines: [
      "+994 55 889 89 82",
    ],

    timings: [
      "10:00 AM - 8:00 PM",
    ],
  },

  {
    id:
      "podium-mall",

    country:
      "Azerbaijan",

    region:
      "Azerbaijan",

    city:
      "Baku",

    name:
      "My Shops Podium Mall Azerbaijan",

    address:
      "88q Cəmşid Kacyvenski, Bakı, Azerbaijan",

    phoneLines: [
      "+994 12 210 89 89",
    ],

    timings: [
      "10:00 AM - 8:00 PM",
    ],
  },
];

const countryOptions:
  CountryFilter[] = [
    "All",
    "UAE",
    "Azerbaijan",
  ];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeTelephone(
  value:
    string
) {
  return value.replace(
    /[^\d+]/g,
    ""
  );
}

function getGoogleMapsSearchUrl(
  store:
    Store
) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${store.name}, ${store.address}`
  )}`;
}

function getGoogleMapsEmbedUrl(
  store:
    Store
) {
  /*
   * No API key required for this simple query embed.
   * Google resolves the address visually inside the iframe.
   */
  return `https://www.google.com/maps?q=${encodeURIComponent(
    `${store.name}, ${store.address}`
  )}&z=15&output=embed`;
}

function distanceKm(
  lat1:
    number,
  lon1:
    number,
  lat2:
    number,
  lon2:
    number
) {
  const rad = (
    value:
      number
  ) =>
    (value *
      Math.PI) /
    180;

  const radius =
    6371;

  const dLat =
    rad(
      lat2 -
        lat1
    );

  const dLon =
    rad(
      lon2 -
        lon1
    );

  const a =
    Math.sin(
      dLat / 2
    ) **
      2 +
    Math.cos(
      rad(
        lat1
      )
    ) *
      Math.cos(
        rad(
          lat2
        )
      ) *
      Math.sin(
        dLon / 2
      ) **
        2;

  return (
    radius *
    2 *
    Math.atan2(
      Math.sqrt(
        a
      ),
      Math.sqrt(
        1 -
          a
      )
    )
  );
}

/*
|--------------------------------------------------------------------------
| Compact Store Card
|--------------------------------------------------------------------------
|
| Intentionally narrow, like the reference:
|
| - fixed ~245px desktop width
| - Google map at the top
| - no oversized whitespace
| - Get Directions at the bottom
|--------------------------------------------------------------------------
*/

function StoreCard({
  store,
  distance,
  highlighted,
}: {
  store:
    Store;

  distance?:
    number;

  highlighted:
    boolean;
}) {
  const mapsUrl =
    getGoogleMapsSearchUrl(
      store
    );

  const embedUrl =
    getGoogleMapsEmbedUrl(
      store
    );

  return (
    <article
      id={`store-${store.id}`}
      className={[
        "flex",
        "h-full",
        "w-full",
        "flex-col",
        "overflow-hidden",
        "rounded-md",
        "border",
        "bg-white",
        "shadow-[0_1px_4px_rgba(0,0,0,0.08)]",

        highlighted
          ? "border-[#1597A1] ring-2 ring-[#1597A1]/20"
          : "border-[#D6D9DE]",
      ].join(
        " "
      )}
    >
      {/*
      |--------------------------------------------------------------------------
      | Store Header
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          flex
          min-h-[44px]
          items-center
          gap-2

          border-b
          border-[#D6D9DE]

          px-3
          py-2.5
        "
      >
        <Building2
          size={
            16
          }
          className="shrink-0 text-[#555B63]"
        />

        <h2
          className="
            line-clamp-2
            min-w-0

            text-[13px]
            font-bold
            leading-[17px]
            text-[#292D32]
          "
        >
          {
            store.name
          }
        </h2>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | Google Map
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          relative

          h-[145px]
          w-full
          shrink-0

          overflow-hidden

          bg-[#F3F4F6]
        "
      >
        <iframe
          src={
            embedUrl
          }
          title={`${store.name} Google Maps location`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="
            absolute
            inset-0

            h-full
            w-full

            border-0
          "
        />

        <a
          href={
            mapsUrl
          }
          target="_blank"
          rel="noopener noreferrer"
          className="
            absolute
            left-2
            top-2
            z-10

            inline-flex
            items-center
            gap-1

            rounded-sm

            bg-white

            px-2.5
            py-1.5

            text-[12px]
            font-bold
            text-[#1677FF]

            shadow-sm
          "
        >
          Maps

          <Navigation
            size={
              11
            }
          />
        </a>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | Information
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          flex
          min-h-[280px]
          flex-1
          flex-col

          px-3.5
          py-3.5
        "
      >
        {/*
        | Address
        */}

        <div className="flex items-start gap-2">
          <MapPin
            size={
              16
            }
            className="mt-0.5 shrink-0 text-[#4F555C]"
          />

          <p
            className="
              text-[13px]
              leading-5
              text-[#30343A]
            "
          >
            {
              store.address
            }
          </p>
        </div>

        {/*
        | Phone
        */}

        <div className="mt-3 flex items-start gap-2">
          <Phone
            size={
              16
            }
            className="mt-0.5 shrink-0 text-[#4F555C]"
          />

          <div className="min-w-0">
            {store.phoneLines.map(
              (
                phone,
                index
              ) => (
                <div
                  key={
                    phone
                  }
                  className={
                    index >
                    0
                      ? "mt-1"
                      : ""
                  }
                >
                  <a
                    href={`tel:${normalizeTelephone(
                      phone
                    )}`}
                    className="
                      text-[13px]
                      leading-5
                      text-[#30343A]

                      hover:text-[#1597A1]
                    "
                  >
                    {index ===
                    0
                      ? "Phone: "
                      : "Support: "}

                    {
                      phone
                    }
                  </a>
                </div>
              )
            )}
          </div>
        </div>

        {/*
        | Timings
        */}

        <div className="mt-3 flex items-start gap-2">
          <Clock3
            size={
              16
            }
            className="mt-0.5 shrink-0 text-[#4F555C]"
          />

          <div className="min-w-0">
            <p
              className="
                text-[13px]
                font-semibold
                text-[#30343A]
              "
            >
              Store Timings:
            </p>

            <ul
              className="
                mt-1.5
                list-disc
                space-y-1

                pl-4

                text-[13px]
                leading-5
                text-[#30343A]
              "
            >
              {store.timings.map(
                (
                  timing
                ) => (
                  <li
                    key={
                      timing
                    }
                  >
                    {
                      timing
                    }
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {typeof distance ===
        "number" ? (
          <p
            className="
              mt-3

              text-[11px]
              font-bold
              text-[#1597A1]
            "
          >
            {
              distance.toFixed(
                1
              )
            }{" "}
            km away
          </p>
        ) : null}

        {/*
        | Push button to bottom
        */}

        <div className="flex-1" />

        <div className="mt-5">
          <a
            href={
              mapsUrl
            }
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex
              h-9
              items-center
              justify-center
              gap-1.5

              rounded-sm

              bg-[#F1F1F1]

              px-3

              text-[12px]
              font-medium
              text-[#222]

              transition

              hover:bg-[#111318]
              hover:text-white
            "
          >
            Get Directions

            <Navigation
              size={
                14
              }
            />
          </a>
        </div>
      </div>
    </article>
  );
}

/*
|--------------------------------------------------------------------------
| Stores Page
|--------------------------------------------------------------------------
*/

export default function StoresPage() {
  const [
    country,
    setCountry,
  ] =
    useState<CountryFilter>(
      "All"
    );

  const [
    city,
    setCity,
  ] =
    useState(
      "All Cities"
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    locating,
    setLocating,
  ] =
    useState(
      false
    );

  const [
    nearestStoreId,
    setNearestStoreId,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    distances,
    setDistances,
  ] =
    useState<
      Record<
        string,
        number
      >
    >(
      {}
    );

  /*
  |--------------------------------------------------------------------------
  | City Filter
  |--------------------------------------------------------------------------
  */

  const cities =
    useMemo(
      () => {
        const result =
          stores
            .filter(
              (
                store
              ) =>
                country ===
                  "All" ||
                store.country ===
                  country
            )
            .map(
              (
                store
              ) =>
                store.city
            );

        return [
          "All Cities",
          ...Array.from(
            new Set(
              result
            )
          ).sort(),
        ];
      },
      [
        country,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Filter
  |--------------------------------------------------------------------------
  */

  const filteredStores =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return stores.filter(
          (
            store
          ) => {
            if (
              country !==
                "All" &&
              store.country !==
                country
            ) {
              return false;
            }

            if (
              city !==
                "All Cities" &&
              store.city !==
                city
            ) {
              return false;
            }

            if (
              !query
            ) {
              return true;
            }

            return [
              store.name,
              store.address,
              store.city,
              store.country,
              store.region,
              ...store.phoneLines,
            ]
              .join(
                " "
              )
              .toLowerCase()
              .includes(
                query
              );
          }
        );
      },
      [
        country,
        city,
        search,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Grouping
  |--------------------------------------------------------------------------
  |
  | THIS is what keeps:
  |
  | Dubai - UAE
  | [ Outlet ] [ Wafi ] [ Deira ]
  |
  | Abu Dhabi - UAE
  | [ Souq Al Jami ]
  |
  | Azerbaijan
  | [ Crescent ] [ Sumqayit ] [ Bülbül ] [ Ganjlik ] [ Podium ]
  |--------------------------------------------------------------------------
  */

  const groupedStores =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            Store[]
          >();

        for (
          const store of
          filteredStores
        ) {
          const current =
            map.get(
              store.region
            ) ||
            [];

          current.push(
            store
          );

          map.set(
            store.region,
            current
          );
        }

        /*
         * Preserve desired display order.
         */

        const order =
          [
            "Dubai - UAE",
            "Abu Dhabi - UAE",
            "Azerbaijan",
          ];

        return Array.from(
          map.entries()
        ).sort(
          (
            first,
            second
          ) =>
            order.indexOf(
              first[0]
            ) -
            order.indexOf(
              second[0]
            )
        );
      },
      [
        filteredStores,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Nearest Store
  |--------------------------------------------------------------------------
  */

  const locateNearest =
    () => {
      if (
        typeof navigator ===
          "undefined" ||
        !navigator.geolocation
      ) {
        window.alert(
          "Location services are not available in this browser."
        );

        return;
      }

      const storesWithCoordinates =
        stores.filter(
          (
            store
          ) =>
            typeof store.latitude ===
              "number" &&
            typeof store.longitude ===
              "number"
        );

      if (
        !storesWithCoordinates.length
      ) {
        window.alert(
          "Location coordinates are not configured for the stores."
        );

        return;
      }

      setLocating(
        true
      );

      navigator.geolocation.getCurrentPosition(
        (
          position
        ) => {
          const nextDistances:
            Record<
              string,
              number
            > =
              {};

          let nearest:
            Store |
            null =
              null;

          let nearestDistance =
            Number.POSITIVE_INFINITY;

          for (
            const store of
            storesWithCoordinates
          ) {
            const value =
              distanceKm(
                position.coords
                  .latitude,
                position.coords
                  .longitude,
                store.latitude!,
                store.longitude!
              );

            nextDistances[
              store.id
            ] =
              value;

            if (
              value <
              nearestDistance
            ) {
              nearestDistance =
                value;

              nearest =
                store;
            }
          }

          setDistances(
            nextDistances
          );

          setNearestStoreId(
            nearest?.id ||
              null
          );

          if (
            nearest
          ) {
            setCountry(
              nearest.country
            );

            setCity(
              nearest.city
            );

            setSearch(
              ""
            );

            window.setTimeout(
              () => {
                document
                  .getElementById(
                    `store-${nearest?.id}`
                  )
                  ?.scrollIntoView(
                    {
                      behavior:
                        "smooth",

                      block:
                        "center",
                    }
                  );
              },
              150
            );
          }

          setLocating(
            false
          );
        },
        () => {
          setLocating(
            false
          );

          window.alert(
            "We could not access your location. Please allow location access or choose a location manually."
          );
        },
        {
          enableHighAccuracy:
            false,

          timeout:
            10000,

          maximumAge:
            300000,
        }
      );
    };

  return (
    <main className="flex-1 bg-[#F6F7F8]">
      {/*
      |--------------------------------------------------------------------------
      | Heading
      |--------------------------------------------------------------------------
      */}

<section className="bg-white">
  <div
    className="
      mx-auto
      w-full
      max-w-[1440px]

      px-4
      py-5

      sm:px-6
      sm:py-6

      lg:px-8
    "
  >
    <div
      className="
        relative
        min-h-[210px]
        overflow-hidden
        rounded-2xl

        bg-[#111318]

        sm:min-h-[240px]
        lg:min-h-[270px]
      "
    >
      {/*
      |--------------------------------------------------------------------------
      | Banner Image
      |--------------------------------------------------------------------------
      */}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/stores/store-locator-banner.jpg"
        alt="Find a MyShops Store"
        className="
          absolute
          inset-0

          h-full
          w-full

          object-cover
          object-center
        "
      />

      {/*
      |--------------------------------------------------------------------------
      | Dark Overlay
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          absolute
          inset-0

          bg-gradient-to-r
          from-black/80
          via-black/45
          to-black/10
        "
      />

      {/*
      |--------------------------------------------------------------------------
      | Banner Content
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          relative
          z-10

          flex
          min-h-[210px]
          items-center

          px-6
          py-8

          sm:min-h-[240px]
          sm:px-9

          lg:min-h-[270px]
          lg:px-12
        "
      >
        <div className="max-w-[600px]">
          <p
            className="
              text-[11px]
              font-bold
              uppercase
              tracking-[0.18em]
              text-white/80

              sm:text-xs
            "
          >
            MyShops Locations
          </p>

          <h1
            className="
              mt-2

              text-[28px]
              font-bold
              leading-tight
              tracking-tight
              text-white

              sm:text-[34px]

              lg:text-[40px]
            "
          >
            Find a MyShops Store
          </h1>

          <p
            className="
              mt-3
              max-w-[520px]

              text-[13px]
              leading-6
              text-white/85

              sm:text-[15px]
            "
          >
            Find your nearest MyShops location,
            check store details and opening hours,
            or get directions instantly.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

      {/*
      |--------------------------------------------------------------------------
      | Filters
      |--------------------------------------------------------------------------
      */}

      <section className="border-b border-[#E5E7EB] bg-white">
        <div
          className="
            mx-auto
            w-full
            max-w-[1440px]

            px-4
            pb-7

            sm:px-6

            lg:px-8
          "
        >
          <div
            className="
              rounded-2xl

              border
              border-[#E5E7EB]

              bg-[#FAFAFA]

              p-4

              sm:p-5
            "
          >
            <div
              className="
                flex
                flex-col
                gap-4

                lg:flex-row
                lg:items-center
              "
            >
              <div className="flex flex-wrap gap-2">
                {countryOptions.map(
                  (
                    option
                  ) => (
                    <button
                      key={
                        option
                      }
                      type="button"
                      onClick={() => {
                        setCountry(
                          option
                        );

                        setCity(
                          "All Cities"
                        );
                      }}
                      className={[
                        "h-10 rounded-full px-4 text-sm font-bold transition",

                        country ===
                        option
                          ? "bg-[#111318] text-white"
                          : "border border-[#D1D5DB] bg-white text-[#4B5563] hover:border-[#1597A1] hover:text-[#1597A1]",
                      ].join(
                        " "
                      )}
                    >
                      {
                        option
                      }
                    </button>
                  )
                )}
              </div>

              <div
                className="
                  grid
                  flex-1
                  gap-3

                  sm:grid-cols-[minmax(0,1fr)_220px_auto]
                "
              >
                <div className="relative">
                  <Search
                    size={
                      18
                    }
                    className="
                      absolute
                      left-3.5
                      top-1/2

                      -translate-y-1/2

                      text-[#9CA3AF]
                    "
                  />

                  <input
                    value={
                      search
                    }
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Search by store, city or area"
                    className="
                      h-11
                      w-full

                      rounded-lg

                      border
                      border-[#D1D5DB]

                      bg-white

                      pl-10
                      pr-4

                      text-sm
                      text-[#111318]

                      outline-none

                      focus:border-[#1597A1]
                    "
                  />
                </div>

                <select
                  value={
                    city
                  }
                  onChange={(
                    event
                  ) =>
                    setCity(
                      event
                        .target
                        .value
                    )
                  }
                  className="
                    h-11

                    rounded-lg

                    border
                    border-[#D1D5DB]

                    bg-white

                    px-3

                    text-sm
                    font-semibold
                    text-[#333]

                    outline-none

                    focus:border-[#1597A1]
                  "
                >
                  {cities.map(
                    (
                      item
                    ) => (
                      <option
                        key={
                          item
                        }
                        value={
                          item
                        }
                      >
                        {
                          item
                        }
                      </option>
                    )
                  )}
                </select>

                <button
                  type="button"
                  onClick={
                    locateNearest
                  }
                  disabled={
                    locating
                  }
                  className="
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    gap-2

                    rounded-lg

                    bg-[#1597A1]

                    px-5

                    text-sm
                    font-bold
                    text-white

                    hover:bg-[#127F87]

                    disabled:cursor-wait
                    disabled:opacity-70
                  "
                >
                  <LocateFixed
                    size={
                      17
                    }
                  />

                  {locating
                    ? "Locating..."
                    : "Nearest Store"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*
      |--------------------------------------------------------------------------
      | Stores
      |--------------------------------------------------------------------------
      */}

      <section>
        <div
          className="
            mx-auto
            w-full
            max-w-[1440px]

            px-4
            py-8

            sm:px-6

            lg:px-8
            lg:py-10
          "
        >
          <div className="mb-8">
            <h2
              className="
                text-[23px]
                font-black
                text-[#111318]

                sm:text-[27px]
              "
            >
              Our Stores
            </h2>

            <p className="mt-1 text-sm text-[#6B7280]">
              Showing{" "}

              <strong className="text-[#111318]">
                {
                  filteredStores.length
                }
              </strong>{" "}

              {filteredStores.length ===
              1
                ? "store"
                : "stores"}
            </p>
          </div>

          {groupedStores.length ? (
            <div className="space-y-12">
              {groupedStores.map(
                (
                  [
                    region,
                    regionStores,
                  ]
                ) => (
                  <section
                    key={
                      region
                    }
                  >
                    {/*
                    |--------------------------------------------------------------------------
                    | Region Heading — ONE LINE
                    |--------------------------------------------------------------------------
                    */}

                    <div className="mb-5">
                      <h3
                        className="
                          whitespace-nowrap

                          text-[22px]
                          font-black
                          tracking-tight
                          text-[#292D32]

                          sm:text-[25px]
                        "
                      >
                        {
                          region
                        }
                      </h3>
                    </div>

                    {/*
                    |--------------------------------------------------------------------------
                    | Compact Row
                    |--------------------------------------------------------------------------
                    |
                    | Desktop:
                    | Dubai cards remain on ONE row.
                    | Azerbaijan's five cards remain on ONE row when space allows.
                    |
                    | Smaller screens:
                    | Cards wrap naturally.
                    |--------------------------------------------------------------------------
                    */}

                    <div
                      className="
                        grid
                        grid-cols-1
                        items-stretch
                        gap-4

                        sm:grid-cols-2

                        md:grid-cols-3

                        xl:grid-cols-5
                      "
                    >
                      {regionStores.map(
                        (
                          store
                        ) => (
                          <StoreCard
                            key={
                              store.id
                            }
                            store={
                              store
                            }
                            distance={
                              distances[
                                store.id
                              ]
                            }
                            highlighted={
                              nearestStoreId ===
                              store.id
                            }
                          />
                        )
                      )}
                    </div>
                  </section>
                )
              )}
            </div>
          ) : (
            <div
              className="
                rounded-lg

                border
                border-[#D7DADF]

                bg-white

                px-6
                py-14

                text-center
              "
            >
              <MapPin
                size={
                  28
                }
                className="mx-auto text-[#1597A1]"
              />

              <h3
                className="
                  mt-4

                  text-xl
                  font-black
                  text-[#111318]
                "
              >
                No stores found
              </h3>

              <p className="mt-2 text-sm text-[#6B7280]">
                Try another country, city or search term.
              </p>

              <button
                type="button"
                onClick={() => {
                  setCountry(
                    "All"
                  );

                  setCity(
                    "All Cities"
                  );

                  setSearch(
                    ""
                  );
                }}
                className="
                  mt-5

                  text-sm
                  font-bold
                  text-[#1597A1]
                "
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
