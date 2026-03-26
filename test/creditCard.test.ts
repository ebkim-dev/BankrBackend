import request from 'supertest';
import app from '../src/app';
import { store } from '../src/models/store';
import { seedService } from '../src/services/seedService';
import { authService } from '../src/services/authService';

describe('CreditCard Routes', () => {
    let token: string;
    let userId: string;

    beforeEach(async () => {
        await seedService.seed();
        const user = store.getUserByEmail('alex@example.com')!;
        userId = user.id; 
        token = authService.generateToken(user);
    });

    const cardData = {
        name: 'My Card',
        numberMasked: '**** **** **** 1111',
        expiryMonth: 12,
        expiryYear: 2030,
        type: 'VISA',
        currency: 'CAD',
        currentBalance: 0,
        availableCredit: 1000,
        creditLimit: 1000,
        minimumPayment: 50,
        paymentDueDate: '2026-04-15',
        interestRate: 19.99,
    };

    it('POST /creditcards - should create a credit card', async () => {
        const res = await request(app)
            .post('/creditcards')
            .set('Authorization', `Bearer ${token}`)
            .send(cardData)
            .expect(201);

        expect(res.body.id).toBeDefined();
        expect(res.body.userId).toBe(userId);
        expect(res.body.isLocked).toBe(false);
    });

    it('GET /creditcards - should return all user cards', async () => {
        await request(app)
            .post('/creditcards')
            .set('Authorization', `Bearer ${token}`)
            .send(cardData);
        await request(app)
            .post('/creditcards')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...cardData, numberMasked: '**** **** **** 2222' });

        const res = await request(app)
            .get('/creditcards')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(res.body).toHaveLength(2);
        expect(res.body.every((c: any) => c.userId === userId)).toBe(true);
    });

    it('GET /creditcards/:id - should return a card by ID', async () => {
        const createRes = await request(app)
            .post('/creditcards')
            .set('Authorization', `Bearer ${token}`)
            .send(cardData);

        const res = await request(app)
            .get(`/creditcards/${createRes.body.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(res.body.id).toBe(createRes.body.id);
    });

    it('POST /creditcards/:id/lock - should lock a card', async () => {
        const createRes = await request(app)
            .post('/creditcards')
            .set('Authorization', `Bearer ${token}`)
            .send(cardData);

        await request(app)
            .post(`/creditcards/${createRes.body.id}/lock`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        const card = store.getCreditCardById(createRes.body.id);
        expect(card!.isLocked).toBe(true);
    });

    it('POST /creditcards/:id/lock - should forbid locking another user\'s card', async () => {
        const createRes = await request(app)
            .post('/creditcards')
            .set('Authorization', `Bearer ${token}`)
            .send(cardData);

        const otherUser = store.getUserByEmail('qa@example.com')!;
        const otherToken = authService.generateToken(otherUser);
        await request(app)
            .post(`/creditcards/${createRes.body.id}/lock`)
            .set('Authorization', `Bearer ${otherToken}`)
            .expect(403);
    });
});
