import {
	getUserBalancesBalancesGetOptions,
	readGroupGroupsGroupIdGetOptions,
	readGroupTransactionsGroupsGroupIdTransactionsGetOptions,
	readGroupsGroupsGetOptions,
	readTransactionsUserIsParticipantInTransactionsGetOptions,
	readUsersMeAccountGetOptions
} from '$lib/client/@tanstack/svelte-query.gen';
import type { Client } from '@hey-api/client-fetch';

/**
 * Shared query-options helpers used by both universal loaders (`+page.ts`)
 * and components (`createQuery(...)` in `.svelte`).
 *
 * Each function takes an optional `client` — on SSR we pass
 * `event.locals.api` (per-request SDK client bound to `event.fetch` + token);
 * on the browser the default shared client handles Bearer injection via the
 * interceptor installed in `hooks.client.ts`.
 */

export const meQueryOptions = (client?: Client) =>
	readUsersMeAccountGetOptions({ client });

export const groupsQueryOptions = (client?: Client) =>
	readGroupsGroupsGetOptions({ client });

export const groupQueryOptions = (groupId: string, client?: Client) =>
	readGroupGroupsGroupIdGetOptions({ client, path: { group_id: groupId } });

export const groupTransactionsQueryOptions = (
	groupId: string,
	opts: { skip?: number; limit?: number } = {},
	client?: Client
) =>
	readGroupTransactionsGroupsGroupIdTransactionsGetOptions({
		client,
		path: { group_id: groupId },
		query: opts
	});

export const balancesQueryOptions = (client?: Client) =>
	getUserBalancesBalancesGetOptions({ client });

export const myTransactionsQueryOptions = (
	opts: { group_id?: string; skip?: number; limit?: number } = {},
	client?: Client
) => readTransactionsUserIsParticipantInTransactionsGetOptions({ client, query: opts });
