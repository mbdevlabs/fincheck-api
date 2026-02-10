import { Controller, Get } from '@nestjs/common';
import { IsPublic } from './shared/decorators/IsPublic';

@Controller()
export class AppController {
  @Get('health')
  @IsPublic()
  health() {
    return { status: 'ok' };
  }
}
