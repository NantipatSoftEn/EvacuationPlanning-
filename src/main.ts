import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove properties that don't have decorators
    forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are provided
    transform: true, // Automatically transform payloads to DTO instances
  }));
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
