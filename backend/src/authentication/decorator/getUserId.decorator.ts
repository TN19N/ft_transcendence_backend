import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const GetUserId = createParamDecorator(
  (_, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest().user.id;
  },
);
