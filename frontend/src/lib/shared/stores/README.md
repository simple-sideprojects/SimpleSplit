# Persistente Speicher mit Capacitor Preferences

Diese Stores nutzen Capacitor Preferences, um Daten zwischen Sessions zu speichern, was besonders für mobile Anwendungen wichtig ist.

## Verfügbare Stores

### AuthStore
Verwaltet Authentifizierungsinformationen wie Token und Benutzer.

```typescript
import { authStore, clientSideLogin, clientSideLogout } from '$lib/shared/stores/auth.store';

// Auf Auth-Daten zugreifen
const user = authStore.getUser();
const authData = authStore.getAuthData();

// Einloggen
clientSideLogin("token123");

// Ausloggen (löscht auch andere Caches)
await clientSideLogout();
```

### GroupsStore
Verwaltet Gruppen-Informationen.

```typescript
import { groupsStore, cacheGroups } from '$lib/shared/stores/groups.store';

// Alle Gruppen abrufen
const groups = groupsStore.getGroups();

// Eine spezifische Gruppe abrufen
const group = groupsStore.getGroup("group-id");

// Gruppen cachen
cacheGroups(groupsArray);

// Cache leeren
groupsStore.clear();
```

### TransactionsStore
Verwaltet Transaktions-Informationen.

```typescript
import { transactionsStore, cacheTransactions, clearGroupTransactions } from '$lib/shared/stores/transactions.store';

// Alle Transaktionen abrufen
const transactions = transactionsStore.getTransactions();

// Eine spezifische Transaktion abrufen
const transaction = transactionsStore.getTransaction("transaction-id");

// Transaktionen für eine bestimmte Gruppe abrufen
const groupTransactions = transactionsStore.getTransactionsByGroupId("group-id");

// Transaktionen cachen
cacheTransactions(transactionsArray);

// Transaktionen für eine bestimmte Gruppe löschen
clearGroupTransactions("group-id");

// Cache komplett leeren
transactionsStore.clear();
```

## Entwicklungshinweise

Die Stores sind automatisch mit Capacitor Preferences verbunden und synchronisieren Daten bei Änderungen.

- `$storeVariable` für reaktive Bindung in Svelte-Komponenten
- Store-Methoden für spezifischen Zugriff
- Alle Änderungen werden automatisch persistiert 