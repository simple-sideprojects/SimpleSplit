# Stores

This directory contains the global state management stores for the SimpleSplit application. All stores now use types generated from the OpenAPI schema for better type safety and consistency.

## Store Files

### `auth.store.ts`

- **Purpose**: Manages user authentication state and user data
- **Key Features**:
  - Uses `UserResponse` type from generated API client
  - Persistent storage for authentication tokens
  - Login/logout functionality
  - User data management
- **Main Types**: `UserResponse` (from `$lib/client`)

### `groups.store.ts`

- **Purpose**: Manages group data and associated balances/transactions
- **Key Features**:
  - Uses `GroupExpandedResponse`, `GroupInviteResponse`, and `TransactionRead` from generated API client
  - Extends generated types with computed fields (balances, transactions)
  - Persistent storage for group data
  - Group CRUD operations
- **Main Types**: `GroupExpandedResponse`, `Group` (extended interface)

### `transactions.store.ts`

- **Purpose**: Manages transaction data across all groups
- **Key Features**:
  - Uses `TransactionRead` type from generated API client
  - Persistent storage for transaction data
  - Transaction filtering by group
  - Transaction CRUD operations
- **Main Types**: `TransactionRead` (from `$lib/client`)

### `balances.store.ts`

- **Purpose**: Manages user balance data
- **Key Features**:
  - Uses custom `Balance` interface (not yet in API schema)
  - Persistent storage for balance data
  - Balance calculations and updates
- **Main Types**: `Balance` (from `$lib/interfaces/balance`)

## Type Safety

All stores follow the API Integration Guidelines by:

- Using generated types from `$lib/client/types.gen.ts`
- Avoiding custom type definitions where possible
- Maintaining consistency with backend API schema
- Leveraging TypeScript strict mode for better error detection

## Persistent Storage

All stores use the `createPersistentStore` utility for:

- Automatic data persistence across app restarts
- Compatibility with both web and mobile platforms
- Consistent storage interface across all stores

## Usage Example

```typescript
import { authStore } from '$lib/shared/stores/auth.store';
import { groupsStore } from '$lib/shared/stores/groups.store';
import type { UserResponse } from '$lib/client';

// Get current user
const user: UserResponse | null = authStore.getUser();

// Update groups
groupsStore.setGroups(groupsFromAPI);
```

## Migration Notes

The stores have been updated to use generated OpenAPI types:

- `User` type → `UserResponse` type (from generated client)
- `Group` type → `GroupExpandedResponse` type (from generated client)
- Custom interfaces replaced with generated types where available
- Better type safety and API consistency
