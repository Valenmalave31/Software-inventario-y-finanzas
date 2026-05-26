import { Controller, Post, Get, Body, UseGuards, Request, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { TargetsService } from '../target/targets.service';
import { CreateTargetDto } from '../target/dto/create-target.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('targets') 
@UseGuards(JwtAuthGuard)
export class TargetsController {
  constructor(private readonly targetsService: TargetsService) {}

  @Post()
  create(@Body() createTargetDto: CreateTargetDto, @Request() req) {
    return this.targetsService.create(createTargetDto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.targetsService.findAll(req.user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.targetsService.remove(id, req.user.id);
  }
}