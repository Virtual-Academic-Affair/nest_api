import {
  Body,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ResourceService } from '../services/resource.service';
import { ObjectLiteral } from 'typeorm';
import { validateDto } from '@shared/resource/utils/validate-dto.util';

export abstract class ResourceController<T extends ObjectLiteral> {
  protected constructor(protected readonly service: ResourceService<T>) {}

  protected abstract getDtoClasses(): {
    // query: new () => BaseQueryDto;
    // create: new () => any;
    // update: new () => any;
  };

  protected async dto(key: 'query' | 'create' | 'update', data: any) {
    const DtoClass = this.getDtoClasses()[key] as new () => any;
    return validateDto(DtoClass, data, key !== 'query');
  }

  @Get()
  async findAll(@Query() dto: any) {
    return this.service.findAll(await this.dto('query', dto));
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() dto: any) {
    return this.service.create(await this.dto('create', dto));
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.service.update(id, await this.dto('update', dto));
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
