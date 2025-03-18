import { balanceMock } from './handlers/balance';
import {
	addGroupMemberMock,
	balanceByGroupMock,
	createGroupMock,
	groupByIdMock,
	groupsMock,
	recentByGroupMock,
	removeGroupMemberMock
} from './handlers/groups';
import { recentMock } from './handlers/recent';
import { testMock } from './handlers/test';
import {
	deleteTransactionMock,
	getTotalTransactionsMock,
	getTransactionsMock,
	updateTransactionMock
} from './handlers/transactions';

export const handlers = [
	testMock,
	balanceMock,
	recentMock,
	groupsMock,
	groupByIdMock,
	createGroupMock,
	balanceByGroupMock,
	recentByGroupMock,
	addGroupMemberMock,
	removeGroupMemberMock,
	getTransactionsMock,
	getTotalTransactionsMock,
	updateTransactionMock,
	deleteTransactionMock
];
