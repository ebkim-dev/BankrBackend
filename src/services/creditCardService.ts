import { CreditCard } from '../models/types';
import { store } from '../models/store';
import { generateId } from '../utils/id';

export type CreateCardInput = {
    name: string;
    numberMasked: string;
    expiryMonth: number;
    expiryYear: number;
    type: 'VISA' | 'AMEX' | 'MASTERCARD';
    currency: string;
    currentBalance: number;
    availableCredit: number;
    creditLimit: number;
    minimumPayment: number;
    paymentDueDate: string;
    interestRate: number;
};

export class CreditCardService {
    createCard(userId: string, data: CreateCardInput): CreditCard {
        const card: CreditCard = {
            id: generateId(),
            userId,
            ...data,
            isLocked: false,
            createdAt: new Date(),
        };

        store.saveCreditCard(card);
        return card;
    }

    getCardsByUser(userId: string): CreditCard[] {
        return store.getCreditCardsByUserId(userId);
    }

    getCardById(id: string): CreditCard {
        const card = store.getCreditCardById(id);
        if (!card) {
            throw {
                code: 'FORBIDDEN',
                message: 'You do not have access to this account',
                statusCode: 403,
            };
        }
        return card;
    }

    lockCard(id: string, userId: string): void {
        const card = this.getCardById(id);
        if (card.userId !== userId) {
            throw {
                code: 'FORBIDDEN',
                message: 'You do not have access to this account',
                statusCode: 403,
            };
        }

        card.isLocked = true;
    }
}

export const creditCardService = new CreditCardService();