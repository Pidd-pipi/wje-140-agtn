import { DocumentBuilder } from '@nestjs/swagger';
export const swaggerConfig = new DocumentBuilder().setTitle('Fleet API').setDescription('车队调度与维护 RESTful API').setVersion('1.0').build();
