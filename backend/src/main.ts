import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigurationService } from './configuration/configuration.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configurationService = app.get(ConfigurationService);

  await app.listen(
    configurationService.get('BACKEND_PORT'),
    configurationService.get('BACKEND_HOST'),
  );
}
bootstrap();
