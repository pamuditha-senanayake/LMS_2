"use client";

/**
 * Universal Fetch Interceptor to handle Authentication Headers.
 * This ensures that even if browsers (like Safari/Mobile Chrome) block 
 * third-party session cookies, the request remains authenticated via 
 * the Authorization Bearer Token.
 */
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = async (resource, config: RequestInit = {}) => {
    const url = typeof resource === 'string' ? resource : resource instanceof Request ? resource.url : "";
    
    console.log("[FetchInterceptor] Request:", {
      url,
      method: config.method || "GET",
      headers: config.headers ? Object.fromEntries(new Headers(config.headers).entries()) : {},
    });
    
    // Only intercept internal API calls
    if (url.includes('/api/')) {
      console.log("[FetchInterceptor] Intercepted API call to", url);
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user.token) {
            // Support both Headers object and plain object in config
            const headers = new Headers(config.headers || {});
            
            // Only add if not already present
            if (!headers.has("Authorization")) {
              headers.set("Authorization", `Bearer ${user.token}`);
              console.log("[FetchInterceptor] Added Authorization header");
            }
            
            config.headers = headers;
            
            // Ensure credentials are sent for cookie support where available
            config.credentials = config.credentials || "include";
          }
        }
      } catch (e) {
        console.error("[FetchInterceptor] Auth error:", e);
      }
    }
    
    try {
      const response = await originalFetch(resource, config);
      console.log("[FetchInterceptor] Response:", {
        url,
        status: response.status,
        statusText: response.statusText,
      });
      return response;
    } catch (err) {
      console.error("[FetchInterceptor] Network error:", {
        url,
        config: {
          method: config.method,
          headers: config.headers ? Object.fromEntries(new Headers(config.headers).entries()) : {},
        },
        error: err,
      });
      throw err;
    }
  };
}

export default function FetchInterceptor() {
  return null;
}