import { clientEnv } from '@/env/client';
import { Crisp } from 'crisp-sdk-web';
import { useEffect } from 'react';

/**
 * Crisp chat widget for customer support
 * https://crisp.chat/en/
 */
export function CrispChat() {
  useEffect(() => {
    const websiteId = clientEnv.VITE_CRISP_WEBSITE_ID;
    if (!websiteId) {
      return;
    }

    try {
      Crisp.configure(websiteId);
    } catch (error) {
      console.error('Failed to initialize Crisp chat:', error);
    }
  }, []);

  return null;
}
