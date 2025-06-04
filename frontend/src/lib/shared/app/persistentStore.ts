import { writable, type Writable } from 'svelte/store';
import { PreferencesStorage } from './preferences';
import { browser } from '$app/environment';

/**
 * Erstellt einen persistenten Store, der Daten mit Capacitor Preferences speichert
 * @param key Der Schlüssel unter dem die Daten gespeichert werden
 * @param initialValue Der Anfangswert des Stores
 * @returns Ein Svelte-Store, der automatisch den Wert in Preferences speichert
 */
export function createPersistentStore<T>(key: string, initialValue: T): Writable<T> & { 
  get: () => T,
  clear: () => void
} {
  // Interner Wert
  let storeValue: T = initialValue;
  
  // Erstelle einen normalen Svelte-Store
  const store = writable<T>(initialValue);
  
  // Abonniere Änderungen, um den Wert zu speichern
  const { subscribe, set, update } = store;
  
  // Lade den initialen Wert aus Preferences (nur im Browser)
  const loadInitialValue = async () => {
    try {
        const value = await PreferencesStorage.get<T>(key, initialValue);
        storeValue = value;
        set(value);
    } catch (error) {
        console.error(`Fehler beim Laden des Stores ${key}:`, error);
    }
  };
  
  if(browser) {
    loadInitialValue();
  }
  
  return {
    subscribe,
    
    // Überschreibe set, um Änderungen in Preferences zu speichern
    set: (value: T) => {
        storeValue = value;
        set(value);
        PreferencesStorage.set(key, value).catch(error => {
            console.error(`Fehler beim Speichern des Stores ${key}:`, error);
        });
    },
    
    // Überschreibe update, um Änderungen in Preferences zu speichern
    update: (updater: (value: T) => T) => {
        const value = updater(storeValue);
        storeValue = value;
        set(value);
        PreferencesStorage.set(key, value).catch(error => {
            console.error(`Fehler beim Speichern des Stores ${key}:`, error);
        });
    },
    
    // Hilfsmethode, um den aktuellen Wert zu erhalten
    get: () => storeValue,

    // Hilfsmethode, um den Store zu löschen
    clear: () => {
        storeValue = initialValue;
        set(initialValue);
        PreferencesStorage.remove(key).catch(error => {
            console.error(`Fehler beim Löschen des Stores ${key}:`, error);
        });
    }
  };
} 