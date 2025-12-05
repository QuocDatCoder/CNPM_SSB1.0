// Base API configuration
const API_BASE_URL = "http://localhost:8080/api";

// Axios-like wrapper using fetch
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Auto attach token if exists
    const token = sessionStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config = {
      headers,
      ...options,
    };

    try {
      console.log(`📤 Fetching: ${url}`);
      const response = await fetch(url, config);

      console.log(
        `🔍 Response status for ${endpoint}:`,
        response.status,
        response.ok
      );

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const error = await response.json();
          errorMessage = error.message || response.statusText;
        } catch (parseErr) {
          console.warn(`⚠️ Could not parse error response:`, parseErr);
        }
        console.error(`❌ API returned error for ${endpoint}:`, errorMessage);
        throw new Error(`HTTP Error: ${response.status} - ${errorMessage}`);
      }

      // Handle 204 No Content (DELETE requests)
      if (response.status === 204) {
        return null;
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonErr) {
        console.error(`❌ Failed to parse JSON for ${endpoint}:`, jsonErr);
        throw new Error(`Invalid JSON response: ${jsonErr.message}`);
      }

      console.log(`✅ API response body for ${endpoint}:`, result);
      console.log(
        `✅ Result type:`,
        typeof result,
        "Is null:",
        result === null
      );

      // Safety check
      if (!result) {
        console.warn(`⚠️ Empty response for ${endpoint}`);
        return [];
      }

      // Trả về data nếu có, nếu không trả về toàn bộ result
      return result.data !== undefined ? result.data : result;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  get(endpoint, params = {}, options = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: "GET", ...options });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }
}

const api = new ApiClient(API_BASE_URL);

export default api;
