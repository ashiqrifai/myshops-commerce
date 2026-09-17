const VISITOR_ID_KEY =
  "myshops_visitor_id";

/*
|--------------------------------------------------------------------------
| Get / Create Storefront Visitor ID
|--------------------------------------------------------------------------
|
| Used for anonymous customers.
|
| The ID:
| - contains no customer personal information
| - survives browser refresh/revisit
| - remains until localStorage is cleared
|
|--------------------------------------------------------------------------
*/

export function getStorefrontVisitorId():
  | string
  | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    let visitorId =
      window.localStorage.getItem(
        VISITOR_ID_KEY
      );

    if (
      visitorId
    ) {
      return visitorId;
    }

    visitorId =
      crypto.randomUUID();

    window.localStorage.setItem(
      VISITOR_ID_KEY,
      visitorId
    );

    return visitorId;
  } catch (
    error
  ) {
    console.error(
      "[Storefront visitor ID error]",
      error
    );

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| Read Existing Visitor ID
|--------------------------------------------------------------------------
*/

export function getExistingStorefrontVisitorId():
  | string
  | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    return (
      window.localStorage.getItem(
        VISITOR_ID_KEY
      ) ||
      null
    );
  } catch {
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| Remove Visitor ID
|--------------------------------------------------------------------------
|
| Mainly useful for privacy/reset handling.
|
|--------------------------------------------------------------------------
*/

export function clearStorefrontVisitorId() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    window.localStorage.removeItem(
      VISITOR_ID_KEY
    );
  } catch (
    error
  ) {
    console.error(
      "[Storefront visitor ID clear error]",
      error
    );
  }
}