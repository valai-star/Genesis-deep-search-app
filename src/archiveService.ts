// ─────────────────────────────────────────────────────────────────────────────
// GENESIS INTELLIGENCE ARCHIVE SERVICE
// Saves every completed Deep Research dossier to Firestore.
// TTL: 7 days default, extendable to 30 days for logged-in users.
// Falls back to localStorage if Firestore is unavailable (offline mode).
// ─────────────────────────────────────────────────────────────────────────────

import {
  doc, setDoc, getDoc, deleteDoc,
  collection, query, where, getDocs,
  serverTimestamp, Timestamp
} from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";
import { StockDossier } from "./types";

// TTL constants
export const ARCHIVE_TTL_DAYS_DEFAULT = 7;
export const ARCHIVE_TTL_DAYS_PREMIUM = 30;

function getTTLMs(): number {
  const isLoggedIn = !!auth.currentUser;
  const days = isLoggedIn ? ARCHIVE_TTL_DAYS_PREMIUM : ARCHIVE_TTL_DAYS_DEFAULT;
  return days * 24 * 60 * 60 * 1000;
}

export interface ArchiveEntry {
  ticker: string;
  dossier: StockDossier;
  savedAt: number;
  expiresAt: number;
  userId: string | null;
  mode: string;
}

// ─── localStorage fallback keys ───────────────────────────────────────────────
const LOCAL_KEY = (ticker: string) => `genesis_archive_${ticker.toUpperCase()}`;
const LOCAL_INDEX_KEY = "genesis_archive_index";

function localSave(ticker: string, entry: ArchiveEntry): void {
  try {
    localStorage.setItem(LOCAL_KEY(ticker), JSON.stringify(entry));
    const idx: string[] = JSON.parse(localStorage.getItem(LOCAL_INDEX_KEY) || "[]");
    localStorage.setItem(LOCAL_INDEX_KEY, JSON.stringify(
      Array.from(new Set([ticker.toUpperCase(), ...idx])).slice(0, 50)
    ));
  } catch (e) {
    console.warn("[Archive] localStorage save failed:", e);
  }
}

function localLoad(ticker: string): ArchiveEntry | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY(ticker));
    if (!raw) return null;
    const entry: ArchiveEntry = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(LOCAL_KEY(ticker));
      return null;
    }
    return entry;
  } catch { return null; }
}

function localListIndex(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_INDEX_KEY) || "[]");
  } catch { return []; }
}

// ─── Archive path: /intelligence_archive/{userId_or_anon}/{ticker} ────────────
function archivePath(ticker: string): string {
  const uid = auth.currentUser?.uid || "anonymous";
  return `intelligence_archive/${uid}/tickers/${ticker.toUpperCase()}`;
}

// ─── SAVE ─────────────────────────────────────────────────────────────────────
export async function archiveSave(
  ticker: string,
  dossier: StockDossier,
  mode: string = "genesis"
): Promise<void> {
  const upper = ticker.toUpperCase();
  const now = Date.now();
  const entry: ArchiveEntry = {
    ticker: upper,
    dossier,
    savedAt: now,
    expiresAt: now + getTTLMs(),
    userId: auth.currentUser?.uid || null,
    mode,
  };

  // Always save to localStorage as instant local cache
  localSave(upper, entry);

  // Also save to Firestore for cross-device persistence
  try {
    const ref = doc(db, archivePath(upper));
    await setDoc(ref, {
      ...entry,
      savedAtTs: serverTimestamp(),
      // Store dossier as JSON string to avoid Firestore depth limits
      dossierJson: JSON.stringify(dossier),
      dossier: null,
    });
    console.log(`[Archive] Saved ${upper} to Firestore (expires ${new Date(entry.expiresAt).toLocaleDateString()})`);
  } catch (err) {
    // Firestore unavailable — localStorage already saved, so this is non-fatal
    console.warn(`[Archive] Firestore save failed for ${upper}, localStorage copy retained:`, err);
  }
}

// ─── LOAD ─────────────────────────────────────────────────────────────────────
export async function archiveLoad(ticker: string): Promise<ArchiveEntry | null> {
  const upper = ticker.toUpperCase();

  // Try localStorage first (instant, no network)
  const local = localLoad(upper);
  if (local) {
    console.log(`[Archive] ${upper} loaded from localStorage cache`);
    return local;
  }

  // Try Firestore (cross-device, persisted)
  try {
    const ref = doc(db, archivePath(upper));
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const data = snap.data();
    const expiresAt = data.expiresAt as number;
    if (Date.now() > expiresAt) {
      // Expired — clean up Firestore doc
      await deleteDoc(ref).catch(() => {});
      return null;
    }

    const dossier: StockDossier = JSON.parse(data.dossierJson || "{}");
    const entry: ArchiveEntry = {
      ticker: upper,
      dossier,
      savedAt: data.savedAt,
      expiresAt,
      userId: data.userId,
      mode: data.mode || "genesis",
    };

    // Restore to localStorage for future instant access
    localSave(upper, entry);
    console.log(`[Archive] ${upper} loaded from Firestore`);
    return entry;
  } catch (err) {
    console.warn(`[Archive] Firestore load failed for ${upper}:`, err);
    return null;
  }
}

// ─── LIST all archived tickers ────────────────────────────────────────────────
export async function archiveList(): Promise<{ ticker: string; savedAt: number; expiresAt: number; mode: string }[]> {
  const results: { ticker: string; savedAt: number; expiresAt: number; mode: string }[] = [];

  // Start with localStorage index for instant display
  const localTickers = localListIndex();
  localTickers.forEach(ticker => {
    const entry = localLoad(ticker);
    if (entry) results.push({ ticker, savedAt: entry.savedAt, expiresAt: entry.expiresAt, mode: entry.mode });
  });

  // Augment with Firestore for cross-device entries
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return results; // anonymous — localStorage only

    const colRef = collection(db, `intelligence_archive/${uid}/tickers`);
    const snap = await getDocs(colRef);
    const now = Date.now();

    snap.docs.forEach(d => {
      const data = d.data();
      if (data.expiresAt > now && !results.find(r => r.ticker === d.id)) {
        results.push({ ticker: d.id, savedAt: data.savedAt, expiresAt: data.expiresAt, mode: data.mode || "genesis" });
      }
    });
  } catch (err) {
    console.warn("[Archive] Firestore list failed, showing localStorage only:", err);
  }

  return results.sort((a, b) => b.savedAt - a.savedAt);
}

// ─── DELETE one entry ─────────────────────────────────────────────────────────
export async function archiveDelete(ticker: string): Promise<void> {
  const upper = ticker.toUpperCase();
  localStorage.removeItem(LOCAL_KEY(upper));
  const idx = localListIndex().filter(t => t !== upper);
  localStorage.setItem(LOCAL_INDEX_KEY, JSON.stringify(idx));
  try {
    await deleteDoc(doc(db, archivePath(upper)));
  } catch (err) {
    console.warn(`[Archive] Firestore delete failed for ${upper}:`, err);
  }
}

// ─── AGE label helper ─────────────────────────────────────────────────────────
export function archiveAgeLabel(savedAt: number): string {
  const diff = Date.now() - savedAt;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

// ─── TTL label helper ─────────────────────────────────────────────────────────
export function archiveTTLLabel(expiresAt: number): string {
  const diff = expiresAt - Date.now();
  const days = Math.ceil(diff / 86400000);
  const hours = Math.ceil(diff / 3600000);
  if (days > 1) return `expires in ${days}d`;
  if (hours > 0) return `expires in ${hours}h`;
  return "expiring soon";
}
