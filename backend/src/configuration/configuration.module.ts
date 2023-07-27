import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ConfigurationService } from './configuration.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        BACKEND_PORT: Joi.number().required(),
        BACKEND_HOST: Joi.string().required(),
      }),
    }),
  ],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
