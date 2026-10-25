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

export function savePaywallBatch(storage, records) {
  if (localSettingsResetting(storage) || !records.length || records.some((record) => !validRecord(record)) || new Set(records.map((record) => record.paywall.id)).size !== records.length) return false;
  const previous = new Map();
  try {
    const writes = records.map((record) => [PAYWALL_SAVE_PREFIX + record.paywall.id, JSON.stringify(record)]);
    for (const [key] of writes) previous.set(key, storage.getItem(key));
    for (const [key, value] of writes) storage.setItem(key, value);
    return true;
  } catch {
    for (const [key, value] of [...previous].reverse()) {
      try { if (value === null) storage.removeItem(key); else storage.setItem(key, value); } catch { /* Keep the editing session available for retry. */ }
    }
    return false;
  }
}

export function removeSavedPaywall(storage, id) {
  try { storage.removeItem(PAYWALL_SAVE_PREFIX + id); return true; }
  catch { return false; }
}
