import { Router, Request, Response, NextFunction } from 'express';
import { creditCardService } from '../services/creditCardService';
import { validate } from '../middleware/validate';

const router = Router();

/**
 * Create credit card
 */
router.post(
    '/', 
    validate({
        name: { required: true, type: 'string' },
        numberMasked: { required: true, type: 'string' },
        expiryMonth: { required: true, type: 'number', min: 1, max: 12 },
        expiryYear: { required: true, type: 'number', min: 2024 },
        type: { required: true, type: 'string' },
        currency: { required: true, type: 'string' },
        currentBalance: { required: true, type: 'number', min: 0 },
        availableCredit: { required: true, type: 'number', min: 0 },
        creditLimit: { required: true, type: 'number', min: 0 },
        minimumPayment: { required: true, type: 'number', min: 0 },
        paymentDueDate: { required: true, type: 'string' },
        interestRate: { required: true, type: 'number', min: 0 },
    }),    
    (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({
                error: {
                    code: 'UNAUTHENTICATED',
                    message: 'User not authenticated',
                },
            });
            return;
        }

        const {
            name,
            numberMasked,
            expiryMonth,
            expiryYear,
            type,
            currency,
            currentBalance,
            availableCredit,
            creditLimit,
            minimumPayment,
            paymentDueDate,
            interestRate,
        } = req.body;

        const card = creditCardService.createCard(userId, {
            name,
            numberMasked,
            expiryMonth,
            expiryYear,
            type,
            currency,
            currentBalance,
            availableCredit,
            creditLimit,
            minimumPayment,
            paymentDueDate,
            interestRate,
        });

        res.status(201).json(card);
    } catch (err: any) {
        next(err);
    }
});

/**
 * Get all credit cards for current user
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({
                error: {
                    code: 'UNAUTHENTICATED',
                    message: 'User not authenticated',
                },
            });
            return;
        }

        const cards = creditCardService.getCardsByUser(userId);

        res.json(cards);
    } catch (err: any) {
        next(err);
    }
});

/**
 * Get credit card by ID
 */
router.get(
    '/:id',
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userId;

            if (!userId) {
                res.status(401).json({
                    error: {
                        code: 'UNAUTHENTICATED',
                        message: 'User not authenticated',
                    },
                });
                return;
            }

            const { id } = req.params;
            const card = creditCardService.getCardById(id);

            if (card.userId !== userId) {
                throw {
                    code: 'FORBIDDEN',
                    message: 'Access denied',
                    statusCode: 403,
                };
            }

            res.json(card);
        } catch (err: any) {
            next(err);
        }
    }
);

/**
 * Lock credit card
 */
router.post(
    '/:id/lock',
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userId;

            if (!userId) {
                res.status(401).json({
                    error: {
                        code: 'UNAUTHENTICATED',
                        message: 'User not authenticated',
                    },
                });
                return;
            }
            
            const { id } = req.params;

            creditCardService.lockCard(id, userId);
            
            res.status(200).json({ message: 'Card locked successfully' });
        } catch (err: any) {
            next(err);
        }
    }
);

export default router;