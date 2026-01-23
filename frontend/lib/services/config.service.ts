import axios from "@/lib/axios";

export interface ValidationConfig {
  identityNumber: {
    minLength: number;
    maxLength: number;
    pattern: string;
  };
  edcReference: {
    maxLength: number;
    pattern: string;
  };
  phoneNumber: {
    minLength: number;
    maxLength: number;
    pattern: string;
  };
}

export interface AppConfig {
  validation: ValidationConfig;
  cardStatus: {
    available: string;
    active: string;
    inactive: string;
    damaged: string;
  };
}

let cachedConfig: AppConfig | null = null;

/**
 * Default configuration if API fails
 */
const DEFAULT_CONFIG: AppConfig = {
  validation: {
    identityNumber: {
      minLength: 6,
      maxLength: 20,
      pattern: "^\\d+$",
    },
    edcReference: {
      maxLength: 20,
      pattern: "^\\d+$",
    },
    phoneNumber: {
      minLength: 10,
      maxLength: 15,
      pattern: "^\\d+$",
    },
  },
  cardStatus: {
    available: "IN_STATION",
    active: "ACTIVE",
    inactive: "INACTIVE",
    damaged: "DAMAGED",
  },
};

/**
 * Fetch application configuration from API
 * Falls back to default config if API fails
 */
export async function getAppConfig(): Promise<AppConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await axios.get("/config/app");
    cachedConfig = response.data.data || DEFAULT_CONFIG;
    return cachedConfig;
  } catch (error) {
    console.warn("Failed to fetch app config, using defaults:", error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Get validation config
 */
export async function getValidationConfig(): Promise<ValidationConfig> {
  const config = await getAppConfig();
  return config.validation;
}

/**
 * Clear cached config (useful after updates)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}
