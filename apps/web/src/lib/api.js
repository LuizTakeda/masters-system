import { z } from "zod";
//**************************************************
// Globals
//**************************************************
let isRefreshing = false;
let refreshPromise = null;
//**************************************************
// Private Functions
//**************************************************
function AuthLogin() {
    const { origin, pathname, search } = window.location;
    const redirectTo = `${origin}${pathname}${search}`;
    window.location.href = `/api/auth?redirectTo=${encodeURIComponent(redirectTo)}`;
    return new Promise(() => { });
}
async function AuthRefresh() {
    try {
        const response = await fetch("/api/auth/refresh");
        return response.ok;
    }
    catch (error) {
        return false;
    }
}
export async function apiFetch(input, options) {
    const { responseSchema, ...init } = options || {};
    const doRequest = async () => {
        const response = await fetch(input, init);
        const isJson = response.headers.get("content-type")?.includes("application/json");
        const data = isJson ? await response.json() : null;
        if (!response.ok) {
            // Creates a standardized error object to throw to the component's catch block
            const errorPayload = {
                statusCode: response.status,
                error: data?.error || "Request Error",
                message: data?.message || response.statusText,
            };
            throw errorPayload;
        }
        if (responseSchema) {
            const validation = responseSchema.safeParse(data);
            if (!validation.success) {
                throw {
                    statusCode: 500,
                    error: "Contract Error",
                    message: "The server response is incompatible with the expected contract.",
                };
            }
            return validation.data;
        }
        return data;
    };
    try {
        // Attempts to make the main request
        return await doRequest();
    }
    catch (error) {
        // If it's not an authentication error (401), just pass the error along for the component to handle
        if (error?.statusCode !== 401) {
            throw error;
        }
        // --- REFRESH LOGIC ---
        // If a refresh is already happening from another request, wait for it to finish!
        if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = AuthRefresh().finally(() => {
                isRefreshing = false;
                refreshPromise = null;
            });
        }
        // Waits for the refresh result (whether triggered now or already in progress)
        const refreshSuccess = await refreshPromise;
        if (!refreshSuccess) {
            // If it failed, redirect to login and freeze this function to avoid rendering errors on screen
            return AuthLogin();
        }
        // If the refresh succeeded, repeat the original request!
        // Note: Since HTTPOnly cookies are sent automatically by fetch, 
        // we don't need to inject anything, just repeat the call.
        return await doRequest();
    }
}
