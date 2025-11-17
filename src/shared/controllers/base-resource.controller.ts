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
import { BaseQueryDto } from '../dto/base-query.dto';
import { ObjectLiteral } from 'typeorm';

export abstract class BaseResourceController<T extends ObjectLiteral> {
  protected constructor(protected readonly service: BaseResourceService<T>) {}

  protected abstract getDtoClasses(): {
    query: new () => BaseQueryDto;
    create: new () => any;
    update: new () => any;
  };

  protected dto<
    K extends keyof ReturnType<BaseResourceController<T>['getDtoClasses']>,
  >(key: K, data: any) {
    const DtoClass = this.getDtoClasses()[key];
    return Object.assign(new DtoClass(), data);
  }

  @Get()
  findAll(@Query() queryDto: BaseQueryDto) {
    return this.service.findAll(this.dto('query', queryDto));
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() createDto: any) {
    return this.service.create(this.dto('create', createDto));
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
    return this.service.update(id, this.dto('update', updateDto));
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
