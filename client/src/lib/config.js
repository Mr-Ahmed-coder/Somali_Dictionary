const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

if (!configuredApiUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is required. Set it to your Render backend API URL, for example https://your-backend.onrender.com/api"
  );
}

export const API_URL = configuredApiUrl.replace(/\/+$/, "");
