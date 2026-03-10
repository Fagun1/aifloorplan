/**
 * Auth store — handles login, register, and current user state.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as api from "@/lib/apiClient";

interface AuthUser {
    id: string;
    email: string;
    full_name?: string;
    subscription: string;
}

interface AuthState {
    token: string | null;
    user: AuthUser | null;
    isLoading: boolean;
    error: string | null;

    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, full_name?: string) => Promise<void>;
    logout: () => void;
    loadMe: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const resp = await api.login(email, password);
                    api.setToken(resp.access_token);
                    set({ token: resp.access_token, user: { id: resp.user_id, email: resp.email, full_name: resp.full_name, subscription: "free" }, isLoading: false });
                } catch (e: any) {
                    set({ error: e.message, isLoading: false });
                    throw e;
                }
            },

            register: async (email, password, full_name) => {
                set({ isLoading: true, error: null });
                try {
                    const resp = await api.register(email, password, full_name);
                    api.setToken(resp.access_token);
                    set({ token: resp.access_token, user: { id: resp.user_id, email: resp.email, full_name: resp.full_name, subscription: "free" }, isLoading: false });
                } catch (e: any) {
                    set({ error: e.message, isLoading: false });
                    throw e;
                }
            },

            logout: () => {
                api.clearToken();
                set({ token: null, user: null });
            },

            loadMe: async () => {
                const token = get().token;
                if (!token) return;
                try {
                    const user = await api.getMe();
                    set({ user: { ...user, full_name: user.full_name } });
                } catch {
                    // token expired
                    api.clearToken();
                    set({ token: null, user: null });
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: "auth-store",
            partialize: (s) => ({ token: s.token, user: s.user }),
        }
    )
);
