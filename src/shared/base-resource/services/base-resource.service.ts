import { Injectable, NotFoundException } from '@nestjs/common';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { BaseQueryDto } from '@shared/base-resource/dtos/base-query.dto';

@Injectable()
export abstract class BaseResourceService<T extends ObjectLiteral> {
  protected abstract repository: Repository<T>;
  protected abstract entityName: string;
  protected abstract searchableColumns: string[];
  protected abstract orderableColumns: string[];

  async findAll(queryDto: BaseQueryDto) {
    const page = Math.max(queryDto.page || 1);
    const limit = Math.min(Math.max(1, queryDto.limit), 20);

    const { keyword, order_col = 'id', order_dir = 'ASC' } = queryDto;
    const skip = (page - 1) * Math.min(limit, 20);

    const queryBuilder = this.repository.createQueryBuilder(this.entityName);

    if (keyword && this.searchableColumns.length > 0) {
      const conditions = this.searchableColumns
        .map((col) => `${this.entityName}.${col} LIKE :keyword`)
        .join(' OR ');
      queryBuilder.andWhere(`(${conditions})`, {
        keyword: `%${keyword}%`,
      });
    }

    this.applyCustomFilters(queryBuilder, queryDto);

    const orderColumn = this.orderableColumns.includes(order_col)
      ? order_col
      : 'id';
    const orderDirection = order_dir === 'DESC' ? 'DESC' : 'ASC';

    queryBuilder
      .orderBy(`${this.entityName}.${orderColumn}`, orderDirection)
      .skip(skip)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      pagination: {
        total,
        currentPage: page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const item = await this.repository.findOne({ where: { id } as any });
    if (!item) {
      throw new NotFoundException();
    }
    return item;
  }

  async create(createDto: object) {
    const entity = this.repository.create(createDto as any);
    return await this.repository.save(entity);
  }

  async update(id: number, updateDto: object) {
    const entity = await this.findOne(id);
    Object.assign(entity, updateDto);
    return await this.repository.save(entity);
  }

  async delete(id: number) {
    const entity = await this.findOne(id);
    await this.repository.remove(entity);
    return { message: 'Deleted successfully' };
  }

  protected applyCustomFilters(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryBuilder: SelectQueryBuilder<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryDto: BaseQueryDto,
  ): void {
    return;
  }
}
