import request from 'supertest';
import app from '../../src/app';
import mongoose from 'mongoose';
import { Todo } from '../../src/modules/todo/todo.model';
import features from '../../src/config/features';
import { generateAccessToken } from '../../src/utils/jwtToken';

// Only run if auth is enabled for full test
const token = generateAccessToken('user123'); // Mock user ID

beforeAll(async () => {
    // Connect to a test database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test-cattle-backend';
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri);
    }
});

afterAll(async () => {
    await mongoose.connection.close();
});

afterEach(async () => {
    await Todo.deleteMany({});
});

describe('Todo API', () => {
    it('should create a new todo', async () => {
        const res = await request(app)
            .post('/api/v1/todos')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Test Todo',
                description: 'Test Description'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.data.title).toEqual('Test Todo');
    });

    it('should fetch all todos for a user', async () => {
        // Create a todo first
        await Todo.create({
            title: 'Existing Todo',
            user_id: 'user123'
        });

        const res = await request(app)
            .get('/api/v1/todos')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0].title).toEqual('Existing Todo');
    });
});
