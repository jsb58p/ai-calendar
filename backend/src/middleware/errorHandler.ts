import type { Request, Response, NextFunction } from 'express'

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err.message)
  const status: number = typeof err.status === 'number' ? err.status : 500
  res.status(status).json({ error: err.message || 'Internal server error' })
}
