const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const getApiUrl = (endpoint: string): string => {
    const fullUrl = `${API_BASE}${endpoint}`;
    console.log(`[API] ${endpoint} -> ${fullUrl}`);
    return fullUrl;
};

export const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };
    
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if (user.token) {
                headers["Authorization"] = `Bearer ${user.token}`;
            }
        } catch {
            // ignore parse errors
        }
    }
    
    return headers;
};

export const apiFetch = async (
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> => {
    const url = getApiUrl(endpoint);
    
    const headers = {
        ...getAuthHeaders(),
        ...options.headers,
    };
    
    console.log(`[API] ${options.method || "GET"} ${url}`, {
        headers: Object.keys(headers),
        credentials: options.credentials || "include",
    });
    
    try {
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: options.credentials || "include",
        });
        
        console.log(`[API] Response ${response.status} from ${endpoint}`);
        
        return response;
    } catch (error) {
        console.error(`[API] Network error for ${endpoint}:`, error);
        throw error;
    }
};

export default API_BASE;