import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ConfigurationService } from './configuration.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        BACKEND_PORT: Joi.number().required(),
        DATABASE_URL: Joi.string().required(),
        INTRA42_CLIENT_ID: Joi.string().required(),
        INTRA42_CLIENT_SECRET: Joi.string().required(),
        INTRA42_CALLBACK_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        FRONTEND_URL: Joi.string().required(),
      }),
    }),
  ],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
