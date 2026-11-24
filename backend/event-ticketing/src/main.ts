import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('Event Ticketing API')
    .setDescription('REST API for event ticketing platform - Organizers create events, customers buy tickets, admins oversee everything')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Events', 'Public and organizer event management')
    .addTag('Ticket Types', 'Ticket type management for events')
    .addTag('Orders', 'Customer orders and payments')
    .addTag('Tickets', 'Ticket check-in and management')
    .addTag('Reports', 'Organizer sales reports')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();