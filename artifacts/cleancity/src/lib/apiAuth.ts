import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export function useApiAuth(): void {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      setAuthTokenGetter(async () => {
        try {
          const token = await getToken();
          // In development/mock mode, we pass the email in the token string 
          // so the backend can identify the user without a real secret key.
          const email = user?.primaryEmailAddress?.emailAddress;
          if (email) {
            return `MOCK_AUTH:${email}:${token}`;
          }
          return token;
        } catch {
          return null;
        }
      });
    } else {
      setAuthTokenGetter(null);
    }
  }, [isLoaded, isSignedIn, getToken, user]);
}
