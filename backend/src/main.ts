import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createRateLimiter } from './middlewares/rateLimit';
import { json, NextFunction, Request, Response, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isProd = process.env.NODE_ENV === 'production';
  const rawCorsOrigins = process.env.CORS_ORIGIN ?? 'https://betty-s.vercel.app,http://localhost:5173';
  const corsOrigins = rawCorsOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const httpAdapter = app.getHttpAdapter();
  const expressApp = httpAdapter.getInstance();
  expressApp.set('trust proxy', 1);
  expressApp.disable('x-powered-by');

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    if (isProd) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
    }
    next();
  });
  app.use(json({ limit: '100kb' }));
  app.use(urlencoded({ extended: true, limit: '100kb' }));

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Rate limiting for sensitive auth routes
  const authLimiter = createRateLimiter({ windowMs: 60_000, max: 5, blockDurationMs: 15 * 60_000 });
  app.use('/auth/login', authLimiter);
  app.use('/auth/forgot-password', authLimiter);
  app.use('/auth/register', authLimiter);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      validationError: { target: false, value: false },
      disableErrorMessages: isProd,
    }),
  );

  await app.listen(3000);
}
bootstrap();
