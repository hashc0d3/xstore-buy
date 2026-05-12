"use client";

import { FormEvent, ReactNode, useSyncExternalStore, useState } from "react";

const ADMIN_LOGIN = "admin2026";
const ADMIN_PASSWORD = "admin2026!";
const ADMIN_AUTH_KEY = "xstore-admin-auth";
const ADMIN_AUTH_VALUE = "authenticated";
const ADMIN_AUTH_EVENT = "xstore-admin-auth-change";

function getAuthSnapshot() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ADMIN_AUTH_KEY) === ADMIN_AUTH_VALUE;
}

function subscribeAuth(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(ADMIN_AUTH_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(ADMIN_AUTH_EVENT, callback);
  };
}

function notifyAuthChange() {
  window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
}

export default function AdminAuthGate({ children }: { children: ReactNode }) {
  const isAuthenticated = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (login.trim() !== ADMIN_LOGIN || password !== ADMIN_PASSWORD) {
      setError("Неверный логин или пароль");
      return;
    }

    window.localStorage.setItem(ADMIN_AUTH_KEY, ADMIN_AUTH_VALUE);
    notifyAuthChange();
  };

  const onLogout = () => {
    window.localStorage.removeItem(ADMIN_AUTH_KEY);
    notifyAuthChange();
  };

  if (isAuthenticated) {
    return (
      <>
        <div className="fixed right-4 top-4 z-50">
          <button
            type="button"
            className="rounded-full border border-zinc-200 bg-white/85 px-4 py-2 text-xs font-semibold text-zinc-700 shadow-lg backdrop-blur transition hover:bg-zinc-900 hover:text-white"
            onClick={onLogout}
          >
            Выйти
          </button>
        </div>
        {children}
      </>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f4f6] px-4 py-10 text-zinc-900">
      <form
        className="liquid-glass w-full max-w-md space-y-5 rounded-[2rem] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.16)] min-[480px]:p-8"
        onSubmit={onSubmit}
      >
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-500">X:STORE</p>
          <h1 className="text-2xl font-bold text-zinc-950">Вход в админку</h1>
          <p className="text-sm text-zinc-500">Введите логин и пароль администратора.</p>
        </div>

        <label className="block space-y-1.5 text-sm font-medium text-zinc-700">
          <span>Логин</span>
          <input
            className="field bg-white/85"
            value={login}
            onChange={(event) => {
              setLogin(event.target.value);
              setError("");
            }}
            autoComplete="username"
            autoFocus
          />
        </label>

        <label className="block space-y-1.5 text-sm font-medium text-zinc-700">
          <span>Пароль</span>
          <input
            className="field bg-white/85"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            autoComplete="current-password"
          />
        </label>

        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p> : null}

        <button type="submit" className="btn-primary w-full">
          Войти
        </button>
      </form>
    </main>
  );
}
