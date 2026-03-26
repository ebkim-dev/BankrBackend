import request from 'supertest';
import app from '../src/app';
import { store } from '../src/models/store';
import { seedService } from '../src/services/seedService';
import { authService } from '../src/services/authService';

describe('Transfer Routes', () => {
    let token: string;
    let fromAccountId: string;
    let toAccountId: string;

    beforeEach(async () => {
        await seedService.seed();
        const user = store.getUserByEmail('alex@example.com')!;
        token = authService.generateToken(user);
        const accounts = store.getAccountsByUserId(user.id);
        fromAccountId = accounts[0].id;
        toAccountId = accounts[1].id;
    });

    describe('POST /transfers', () => {
        it('should create a transfer successfully', async () => {
            const response = await request(app)
                .post('/transfers')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fromAccountId,
                    toAccountId,
                    amount: 100.0,
                    note: 'Test transfer',
                });

            expect(response.status).toBe(201);
            expect(response.body.id).toBeDefined();
            expect(response.body.amount).toBe(100.0);
            expect(response.body.status).toBe('SUCCESS');
        });

        it('should update balances after transfer', async () => {
            const fromBefore = store.getAccountById(fromAccountId)!;
            const toBefore = store.getAccountById(toAccountId)!;

            const fromBalanceBefore = fromBefore.balance;
            const toBalanceBefore = toBefore.balance;

            await request(app)
                .post('/transfers')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fromAccountId,
                    toAccountId,
                    amount: 50.0,
                });

            const fromAfter = store.getAccountById(fromAccountId)!;
            const toAfter = store.getAccountById(toAccountId)!;

            expect(fromAfter.balance).toBe(fromBalanceBefore - 50.0);
            expect(toAfter.balance).toBe(toBalanceBefore + 50.0);
        });

        it('should reject transfer with insufficient funds', async () => {
            const response = await request(app)
                .post('/transfers')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fromAccountId,
                    toAccountId,
                    amount: 999999.99,
                });

            expect(response.status).toBe(409);
            expect(response.body.error.code).toBe('INSUFFICIENT_FUNDS');
        });

        it('should reject invalid amount', async () => {
            const response = await request(app)
                .post('/transfers')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fromAccountId,
                    toAccountId,
                    amount: -50.0,
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('INVALID_INPUT');
        });

        it('should support idempotency key', async () => {
            const idempotencyKey = `transfer-${Date.now()}`;

            const response1 = await request(app)
                .post('/transfers')
                .set('Authorization', `Bearer ${token}`)
                .set('Idempotency-Key', idempotencyKey)
                .send({
                    fromAccountId,
                    toAccountId,
                    amount: 25.0,
                });

            const response2 = await request(app)
                .post('/transfers')
                .set('Authorization', `Bearer ${token}`)
                .set('Idempotency-Key', idempotencyKey)
                .send({
                    fromAccountId,
                    toAccountId,
                    amount: 25.0,
                });

            expect(response1.status).toBe(201);
            expect(response2.status).toBe(201);
            expect(response1.body.id).toBe(response2.body.id);
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .post('/transfers')
                .send({
                    fromAccountId,
                    toAccountId,
                    amount: 50.0,
                });

            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe('UNAUTHENTICATED');
        });

        it('should return 403 if account does not belong to user', async () => {
            // Create a different user
            await request(app)
                .post('/auth/register')
                .send({
                    name: 'Other User',
                    email: 'other@example.com',
                    password: 'password123',
                });

            const otherUser = store.getUserByEmail('other@example.com')!;
            const otherToken = authService.generateToken(otherUser);

            const response = await request(app)
                .post('/transfers')
                .set('Authorization', `Bearer ${otherToken}`)
                .send({
                    fromAccountId,
                    toAccountId,
                    amount: 50.0,
                });

            expect(response.status).toBe(403);
            expect(response.body.error.code).toBe('FORBIDDEN');
        });
    });
});
