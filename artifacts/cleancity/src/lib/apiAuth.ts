import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

/**
 * Bridges Clerk's session token into the generated API client so every
 * request gets an `Authorization: Bearer <token>` header. Same-origin cookies
 * also work for Clerk on the proxy domain, but using the bearer token is
 * reliable in dev where the proxy isn't active.
 */
export function useApiAuth(): void {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      setAuthTokenGetter(async () => {
        try {
          return await getToken();
        } catch {
          return null;
        }
      });
    } else {
      setAuthTokenGetter(null);
    }
  }, [isLoaded, isSignedIn, getToken]);
}
