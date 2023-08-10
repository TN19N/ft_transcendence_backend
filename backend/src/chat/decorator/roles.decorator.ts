import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const Roles = (role: Role) => SetMetadata('role', role);
