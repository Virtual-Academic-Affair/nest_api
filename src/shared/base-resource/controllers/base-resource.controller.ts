import {
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Put,
  ParseIntPipe,
} from '@nestjs/common';
import { BaseResourceService } from '../services/base-resource.service';
import { BaseQueryDto } from '@shared/base-resource/dtos/base-query.dto';
import { ObjectLiteral } from 'typeorm';
import { validateDto } from '@shared/base-resource/utils/validate-dto.util';

export abstract class BaseResourceController<T extends ObjectLiteral> {
  protected constructor(protected readonly service: BaseResourceService<T>) {}

  protected abstract getDtoClasses(): {
    // query: new () => BaseQueryDto;
    // create: new () => any;
    // update: new () => any;
  };

  protected async dto(key: 'query' | 'create' | 'update', data: any) {
    const DtoClass = this.getDtoClasses()[key] as new () => any;
    return validateDto(DtoClass, data);
  }

  @Get()
  async findAll(@Query() dto: BaseQueryDto) {
    return this.service.findAll((await this.dto('query', dto)) as BaseQueryDto);
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
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
