import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TargetsController } from './targets.controller';
import { TargetsService } from './targets.service';
import { Target } from './entities/target.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Target])],
  controllers: [TargetsController],
  providers: [TargetsService],
  exports: [TargetsService, TypeOrmModule],
})
export class TargetsModule {}