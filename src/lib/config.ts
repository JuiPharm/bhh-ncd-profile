export interface BhhConfig {
  GAS_WEB_APP_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
}

declare global {
  interface Window {
    BHH_CONFIG?: BhhConfig;
  }
}

export function getConfig(): BhhConfig {
  const config = window.BHH_CONFIG;
  
  if (!config) {
    throw new Error("Configuration file 'config.js' is missing or not loaded correctly.");
  }
  
  return {
    GAS_WEB_APP_URL: config.GAS_WEB_APP_URL || '',
    APP_NAME: config.APP_NAME || 'BHH NCD Profile',
    APP_VERSION: config.APP_VERSION || '1.0.0'
  };
}

export function isConfigValid(): boolean {
  try {
    const config = getConfig();
    return (
      config.GAS_WEB_APP_URL !== '' &&
      config.GAS_WEB_APP_URL !== 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE'
    );
  } catch {
    return false;
  }
}
