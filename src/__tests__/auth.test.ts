import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/booking-test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('POST /auth/register', () => {
  it('should register a new user and return token', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Test User', email: 'test@test.com', password: '123456' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('test@test.com');
    expect(res.body.data.user.role).toBe('user');
  });

  it('should return 400 if fields are missing', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if email already exists', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Test User', email: 'test@test.com', password: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 400 if no body is sent', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /auth/login', () => {
  it('should login and return token', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@test.com', password: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('test@test.com');
  });

  it('should return 401 for wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if fields are missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@test.com', password: '123456' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /', () => {
  it('should return API running message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Booking Backend API is running');
  });
});
