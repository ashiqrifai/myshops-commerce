"use client";

import {
  useEffect,
  useRef,
} from "react";

import { Provider } from "react-redux";

import { store } from "@/store";
import {
  setCredentials,
  setInitialized,
} from "@/store/slices/authSlice";

import type { AuthUser } from "@/types/auth";

interface StoreProviderProps {
  children: React.ReactNode;
}

export default function StoreProvider({
  children,
}: StoreProviderProps) {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    try {
      const accessToken =
        localStorage.getItem(
          "myshops.admin.accessToken"
        );

      const storedUser =
        localStorage.getItem(
          "myshops.admin.user"
        );

      if (accessToken && storedUser) {
        const user = JSON.parse(
          storedUser
        ) as AuthUser;

        store.dispatch(
          setCredentials({
            user,
            accessToken,
          })
        );

        return;
      }
    } catch (error) {
      console.error(
        "Unable to restore admin login:",
        error
      );

      localStorage.removeItem(
        "myshops.admin.accessToken"
      );

      localStorage.removeItem(
        "myshops.admin.user"
      );
    }

    store.dispatch(setInitialized());
  }, []);

  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
}