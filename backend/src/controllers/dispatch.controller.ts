import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AssignDispatchPayload, CompleteTripPayload, StartTripPayload } from '../types/interfaces';
import { DispatchService } from '../services/dispatch.service';

@Controller('dispatch-orders')
export class DispatchController {
  constructor(private readonly service: DispatchService) {}

  @Get() findAll() { return this.service.findAll(); }

  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(Number(id)); }

  @Post() create(@Body() payload: any) { return this.service.create(payload); }

  @Post(':id/assign') assign(@Param('id') id: string, @Body() payload: AssignDispatchPayload) {
    return this.service.assign(Number(id), payload ?? {});
  }

  @Post(':id/start') start(@Param('id') id: string, @Body() payload: StartTripPayload) {
    return this.service.start(Number(id), payload ?? {});
  }

  @Post(':id/complete') complete(@Param('id') id: string, @Body() payload: CompleteTripPayload) {
    return this.service.complete(Number(id), payload ?? {});
  }
}
