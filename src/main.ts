import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CustomLogger } from './common/logger/custom-logger.service';
import helmet from 'helmet';
import compression from 'compression';

declare const module: any;

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: new CustomLogger(),
    });

    // Security middleware
    app.use(helmet());
    app.use(compression());

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
            whitelist: true, // Remove properties that don't have decorators
            forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are provided
            transform: true, // Automatically transform payloads to DTO instances
            transformOptions: {
                enableImplicitConversion: true, // Allow implicit type conversion
            },
        }),
    );

    // Set global prefix
    app.setGlobalPrefix('api', {
        exclude: ['health', 'docs', 'metrics'],
    });

    const port = process.env.PORT ?? 3000;
    await app.listen(port);

    // Log startup information
    const logger = new CustomLogger();
    logger.log(`🚀 Application is running on: http://localhost:${port}`, 'Bootstrap');
    logger.log(`📚 API Documentation: http://localhost:${port}/docs`, 'Bootstrap');
    logger.log(`💊 Health Check: http://localhost:${port}/health`, 'Bootstrap');

    if (module.hot) {
        module.hot.accept();
        module.hot.dispose(() => app.close());
    }
}
bootstrap();
