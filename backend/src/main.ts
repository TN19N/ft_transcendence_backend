import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigurationService } from './configuration/configuration.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const configurationService = app.get(ConfigurationService);

  // CORS
  app.enableCors({
    origin: configurationService.get('FRONTEND_URL'),
    credentials: true,
    methods: ['GET', 'POST'],
  });

  // Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  // cookieParser
  app.use(cookieParser());

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('ft_transcendence API')
    .setDescription('the API implementation for the ft_transcendence project')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Listen
  await app.listen(
    configurationService.get('BACKEND_PORT'),
    configurationService.get('BACKEND_HOST'),
  );
}
bootstrap();
