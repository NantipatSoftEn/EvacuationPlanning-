import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import * as dotenv from 'dotenv';
import { join } from 'path';

declare const module: any;

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: join(process.cwd(), envFile) });

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Security middleware
    app.use(helmet()); // HTTP headers security
    app.use(compression()); // Gzip compression

    // CORS configuration
    app.enableCors({
        origin: process.env.CORS_ORIGIN || true,
        credentials: process.env.CORS_CREDENTIALS === 'true',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Swagger documentation setup
    const config = new DocumentBuilder()
        .setTitle('Evacuation Planning API')
        .setDescription('The evacuation planning API with multiple optimization strategies')
        .setVersion('1.0')
        .addTag('evacuation')
        .addTag('vehicles')
        .addTag('zones')
        .addBearerAuth()
        .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, documentFactory);

    // Enable validation globally
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, //อนุญาตเฉพาะ properties ที่กำหนดไว้ใน DTO เท่านั้น
            forbidNonWhitelisted: true, // ถ้ามี properties ที่ไม่อยู่ใน whitelist จะเกิด error
            transform: true, // แปลง payload เป็น instance ของ DTO อัตโนมัติ
            transformOptions: {
                enableImplicitConversion: true, // อนุญาตการแปลงประเภทข้อมูลแบบปImplicitly tring "123" → number 123
            },
        }),
    );

    // Set global prefix
    app.setGlobalPrefix('api', {
        exclude: ['health', 'docs', 'metrics'],
    });

    const port = process.env.PORT ?? 3000;
    await app.listen(port);

    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/docs`);
    console.log(`💊 Health Check: http://localhost:${port}/health`);

    if (module.hot) {
        module.hot.accept();
        module.hot.dispose(() => app.close());
    }
}
bootstrap();
