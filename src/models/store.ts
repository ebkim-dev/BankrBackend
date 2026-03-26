// In-memory data store
import { Account, Transaction, Transfer, User, CreditCard } from './types';

export class Store {
    private users: Map<string, User> = new Map();
    private accounts: Map<string, Account> = new Map();
    private transactions: Map<string, Transaction> = new Map();
    private transfers: Map<string, Transfer> = new Map();
    private creditCards: Map<string, CreditCard> = new Map();

    // Users
    getUserById(id: string): User | undefined {
        return this.users.get(id);
    }

    getUserByEmail(email: string): User | undefined {
        return Array.from(this.users.values()).find((u) => u.email === email);
    }

    saveUser(user: User): void {
        this.users.set(user.id, user);
    }

    // Accounts
    getAccountById(id: string): Account | undefined {
        return this.accounts.get(id);
    }

    getAccountsByUserId(userId: string): Account[] {
        return Array.from(this.accounts.values()).filter((a) => a.userId === userId);
    }

    saveAccount(account: Account): void {
        this.accounts.set(account.id, account);
    }

    // Transactions
    getTransactionById(id: string): Transaction | undefined {
        return this.transactions.get(id);
    }

    getTransactionsByAccountId(accountId: string): Transaction[] {
        return Array.from(this.transactions.values())
            .filter((t) => t.accountId === accountId)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    saveTransaction(transaction: Transaction): void {
        this.transactions.set(transaction.id, transaction);
    }

    // Transfers
    saveTransfer(transfer: Transfer): void {
        this.transfers.set(transfer.id, transfer);
    }

    getTransferById(id: string): Transfer | undefined {
        return this.transfers.get(id);
    }

    // Credit Cards
    saveCreditCard(card: CreditCard): void {
        this.creditCards.set(card.id, card);
    }

    getCreditCardById(id: string): CreditCard | undefined {
        return this.creditCards.get(id);
    }

    getCreditCardsByUserId(userId: string): CreditCard[] {
        return Array.from(this.creditCards.values())
            .filter(c => c.userId === userId);
    }

    // Utility
    clear(): void {
        this.users.clear();
        this.accounts.clear();
        this.transactions.clear();
        this.transfers.clear();
        this.creditCards.clear();
    }
}

// Export singleton instance
export const store = new Store();
