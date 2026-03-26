import request from 'supertest';
import app from '../src/app';
import { store } from '../src/models/store';
import { seedService } from '../src/services/seedService';

describe('Authentication Routes', () => {
    beforeAll(async () => {
        await seedService.seed();
    });

    afterEach(() => {
        store.clear();
    });

    describe('POST /auth/register', () => {
        it('should register a new user', async () => {
            store.clear();

            const response = await request(app)
                .post('/auth/register')
                .send({
                    name: 'Jane Doe',
                    email: 'jane@example.com',
                    password: 'SecurePassword123',
                });

            expect(response.status).toBe(201);
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user.name).toBe('Jane Doe');
            expect(response.body.user.email).toBe('jane@example.com');
            expect(response.body.user).not.toHaveProperty('passwordHash');
        });

        it('should reject duplicate email', async () => {
            await seedService.seed();

            const response = await request(app)
                .post('/auth/register')
                .send({
                    name: 'Another Alex',
                    email: 'alex@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('INVALID_INPUT');
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    name: 'Jane',
                    // missing email and password
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('INVALID_INPUT');
        });

        it('should validate email format', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    name: 'Jane Doe',
                    email: 'not-an-email',
                    password: 'password123',
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('INVALID_INPUT');
        });
    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            await seedService.seed();
        });

        it('should login with correct credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'alex@example.com',
                    password: 'password',
                });

            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe('alex@example.com');
        });

        it('should reject invalid email', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password',
                });

            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe('UNAUTHENTICATED');
        });

        it('should reject incorrect password', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'alex@example.com',
                    password: 'wrongpassword',
                });

            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe('UNAUTHENTICATED');
        });
    });

    describe('Health Check', () => {
        it('should return ok status', async () => {
            const response = await request(app).get('/health');

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('ok');
            expect(response.body.timestamp).toBeDefined();
        });
    });
});
