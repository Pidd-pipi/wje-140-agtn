import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { swaggerConfig } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  SwaggerModule.setup('api-docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
