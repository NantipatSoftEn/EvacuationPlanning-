import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Evacuation example')
    .setDescription('The evacuation API description')
    .setVersion('1.0')
    .addTag('evacuation')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove properties that don't have decorators
    forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are provided
    transform: true, // Automatically transform payloads to DTO instances
  }));
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
