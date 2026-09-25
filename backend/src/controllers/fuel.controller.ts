import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FuelService } from '../services/fuel.service';
@Controller('fuel-records')
export class FuelController {
  constructor(private readonly service: FuelService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(Number(id)); }
  @Post() create(@Body() payload: any) { return this.service.create(payload); }
}
