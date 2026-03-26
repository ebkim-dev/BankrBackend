// Account service
import { Account } from '../models/types';
import { store } from '../models/store';

export class AccountService {
    /**
     * Get account by ID
     */
    getAccountById(id: string): Account {
        const account = store.getAccountById(id);
        if (!account) {
            throw {
                code: 'NOT_FOUND',
                message: 'Account not found',
                statusCode: 404,
            };
        }
        return account;
    }

    /**
     * Get all accounts for a user
     */
    getAccountsByUserId(userId: string): Account[] {
        return store.getAccountsByUserId(userId);
    }

    /**
     * Verify account belongs to user
     */
    verifyAccountOwnership(accountId: string, userId: string): Account {
        const account = this.getAccountById(accountId);
        if (account.userId !== userId) {
            throw {
                code: 'FORBIDDEN',
                message: 'You do not have access to this account',
                statusCode: 403,
            };
        }
        return account;
    }

    /**
     * Update account balance
     */
    updateBalance(accountId: string, newBalance: number): Account {
        const account = this.getAccountById(accountId);
        console.log("\n\nBALANCE:", account.balance);
        account.balance = Math.round(newBalance * 100) / 100;
        console.log("\n\nBALANCE:", account.balance);
        store.saveAccount(account);
        return account;
    }
}

export const accountService = new AccountService();
