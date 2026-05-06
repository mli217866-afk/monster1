import { useEffect } from 'react';

/**
 * Injects a script into document.head on the client (useEffect)
 */
export function ClientScript({
  src,
  async: asyncAttr,
  defer,
  id,
  dataAttributes,
  inlineHtml,
}: {
  src?: string;
  async?: boolean;
  defer?: boolean;
  id?: string;
  dataAttributes?: Record<string, string>;
  inlineHtml?: string;
}) {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    const script = document.createElement('script');
    if (id) script.id = id;
    if (src) script.src = src;
    if (asyncAttr) script.async = true;
    if (defer) script.defer = true;
    if (inlineHtml) script.textContent = inlineHtml;
    if (dataAttributes) {
      for (const [key, value] of Object.entries(dataAttributes)) {
        script.setAttribute(
          `data-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`,
          value
        );
      }
    }
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);
  return null;
}
