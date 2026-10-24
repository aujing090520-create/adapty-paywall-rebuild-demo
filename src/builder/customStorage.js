export const CUSTOM_CACHE_PREFIX='ht-paywall-custom-v1-';
export async function clearCustomBundles(){if(!globalThis.caches)return;for(const key of await caches.keys())if(key.startsWith(CUSTOM_CACHE_PREFIX))await caches.delete(key);}
