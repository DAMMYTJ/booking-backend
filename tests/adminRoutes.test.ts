import request from 'supertest'
import express, { Request, Response, NextFunction } from 'express'

import bookingRoutes from '../src/ports/rest/routes/bookingRoutes'
import { updateBookingStatus, editBooking } from '../src/use-cases/bookingUseCases'

import {
  ValidationError,
  NotFoundError
} from '../src/domain/errors'

// mock middleware
jest.mock('../src/infrastructure/middleware/adminAuth', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: 'admin1', role: 'admin' }
    next()
  },
  requireAdmin: (_req: any, _res: any, next: any) => next()
}))

// mock use cases
jest.mock('../src/use-cases/bookingUseCases', () => ({
  updateBookingStatus: jest.fn(),
  editBooking: jest.fn()
}))

const app = express()
app.use(express.json())
app.use('/bookings', bookingRoutes)

// error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message })
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message })
  }

  return res.status(500).json({ error: err.message })
})

describe('admin booking routes', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should update booking status', async () => {

    (updateBookingStatus as jest.Mock).mockResolvedValue({
      id: '1',
      status: 'accepted'
    })

    const res = await request(app)
      .patch('/bookings/1/status')
      .send({ status: 'accepted' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('accepted')
  })


  test('should return 400 when status missing', async () => {

    const res = await request(app)
      .patch('/bookings/1/status')
      .send({})

    expect(res.status).toBe(400)

    expect(res.body.error)
      .toBe('status is required (pending, accepted, or declined)')
  })


  test('should return 404 when booking not found', async () => {

    (updateBookingStatus as jest.Mock)
      .mockRejectedValue(new NotFoundError('Booking'))

    const res = await request(app)
      .patch('/bookings/1/status')
      .send({ status: 'accepted' })

    expect(res.status).toBe(404)

    expect(res.body.error)
      .toBe('Booking not found')
  })


  test('should edit booking successfully', async () => {

    (editBooking as jest.Mock).mockResolvedValue({
      id: '1',
      notes: 'updated'
    })

    const res = await request(app)
      .patch('/bookings/1')
      .send({ notes: 'updated' })

    expect(res.status).toBe(200)
  })


  test('should return 400 when edit fields missing', async () => {

    const res = await request(app)
      .patch('/bookings/1')
      .send({})

    expect(res.status).toBe(400)

    expect(res.body.error)
      .toBe('Provide at least one field to update (notes, timeSlotId)')
  })


  test('should return 404 when booking not found for edit', async () => {

    (editBooking as jest.Mock)
      .mockRejectedValue(new NotFoundError('Booking'))

    const res = await request(app)
      .patch('/bookings/1')
      .send({ notes: 'update' })

    expect(res.status).toBe(404)

    expect(res.body.error)
      .toBe('Booking not found')
  })

})