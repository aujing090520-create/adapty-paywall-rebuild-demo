import { validDocument } from './builder/componentDocument.js';
import { localSettingsResetting } from './templateStorage.js';

export const PAYWALL_SAVE_PREFIX = 'paywall-saved-v1:';
const validRecord = (record) => record?.version === 1 && typeof record.paywall?.id === 'string' && typeof record.paywall?.name === 'string' && ['Draft','Live','Inactive'].includes(record.paywall.state) && typeof record.templateId === 'string' && validDocument(record.document) && record.document.templateId === record.templateId;

export function readSavedPaywall(storage, id) {
  try {
    const record = JSON.parse(storage.getItem(PAYWALL_SAVE_PREFIX + id));
    return validRecord(record) && record.paywall.id === id ? record : null;
  } catch { return null; }
}

export function listSavedPaywalls(storage) {
  const records = [];
  try {
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (key?.startsWith(PAYWALL_SAVE_PREFIX)) {
        const record = readSavedPaywall(storage, key.slice(PAYWALL_SAVE_PREFIX.length));
        if (record) records.push(record);
      }
    }
  } catch { /* Unreadable storage must not hide the built-in examples. */ }
  return records;
}

export function savePaywall(storage, paywall, document) {
  const record = { version: 1, paywall, templateId: document?.templateId, document };
  if (localSettingsResetting(storage) || !validRecord(record)) return false;
  try { storage.setItem(PAYWALL_SAVE_PREFIX + paywall.id, JSON.stringify(record)); return true; }
  catch { return false; }
}

export function removeSavedPaywall(storage, id) {
  try { storage.removeItem(PAYWALL_SAVE_PREFIX + id); return true; }
  catch { return false; }
}
