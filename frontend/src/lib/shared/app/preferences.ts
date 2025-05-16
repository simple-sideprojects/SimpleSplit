import { Preferences } from '@capacitor/preferences';

/**
 * Hilfsfunktionen für den Zugriff auf Capacitor Preferences
 */
export class PreferencesStorage {
  /**
   * Speichert einen Wert im Preferences-Speicher
   * @param key Der Schlüssel unter dem der Wert gespeichert wird
   * @param value Der zu speichernde Wert (wird als JSON serialisiert)
   */
  static async set<T>(key: string, value: T): Promise<void> {
    await Preferences.set({
      key,
      value: JSON.stringify(value)
    });
  }

  /**
   * Holt einen Wert aus dem Preferences-Speicher
   * @param key Der Schlüssel des zu holenden Werts
   * @param defaultValue Standardwert, falls der Schlüssel nicht existiert
   * @returns Der gespeicherte Wert oder der Standardwert
   */
  static async get<T>(key: string, defaultValue: T): Promise<T> {
    const { value } = await Preferences.get({ key });
    if (value === null) {
      return defaultValue;
    }
    return JSON.parse(value) as T;
  }

  /**
   * Löscht einen Wert aus dem Preferences-Speicher
   * @param key Der Schlüssel des zu löschenden Werts
   */
  static async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  /**
   * Löscht alle Werte aus dem Preferences-Speicher
   */
  static async clear(): Promise<void> {
    await Preferences.clear();
  }
} 