"use client";

const TOKEN_KEY = "aiq_token";
const AUTH_EVENT = "aiq_auth_changed";

function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
}

export const authStore = {
  getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
    notifyAuthChanged();
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    notifyAuthChanged();
  },
  subscribe(listener: () => void) {
    if (typeof window === "undefined") return () => undefined;

    const onStorage = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY) {
        listener();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_EVENT, listener as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_EVENT, listener as EventListener);
    };
  },
};
