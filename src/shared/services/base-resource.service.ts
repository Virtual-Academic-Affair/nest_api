import { Injectable } from '@nestjs/common';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { BaseQueryDto } from '../dto/base-query.dto';

@Injectable()
export abstract class BaseResourceService<T extends ObjectLiteral> {
  protected abstract repository: Repository<T>;
  protected abstract entityName: string;
  protected abstract searchableColumns: string[];
  protected abstract orderableColumns: string[];

  async findAll(queryDto: BaseQueryDto) {
    const {
      page = 1,
      limit = 10,
      keyword,
      order_col = 'id',
      order_dir = 'ASC',
    } = queryDto;
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

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    return await this.repository.findOneOrFail({
      where: { id } as any,
    });
  }

  async create(createDto: Partial<T>) {
    const entity = this.repository.create(createDto as any);
    return await this.repository.save(entity);
  }

  async update(id: number, updateDto: Partial<T>) {
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
