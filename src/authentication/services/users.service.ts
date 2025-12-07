import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserQueryDto } from '@authentication/dtos/users/query.dto';
import { AssignRoleDto } from '@authentication/dtos/auth/assign-role.dto';
import { ResourceService } from '@shared/resource/services/resource.service';
import { BaseQueryDto } from '@shared/resource/dtos/base-query.dto';

@Injectable()
export class UsersService extends ResourceService<User> {
  protected repository: Repository<User>;

  protected searchableColumns = ['email', 'name'];

  protected orderableColumns = ['id', 'email', 'name', 'role', 'isActive'];

  constructor(@InjectRepository(User) userRepository: Repository<User>) {
    super();
    this.repository = userRepository;
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<User>,
    queryDto: BaseQueryDto
  ): void {
    const { role } = queryDto as UserQueryDto;
    role && queryBuilder.andWhere(`${this.entityName}.role = :role`, { role });
  }

  async assignRole(dto: AssignRoleDto) {
    const { email, role } = dto;
    let user = await this.repository.findOne({ where: { email } });

    if (user) {
      user.role = role;
      return await this.repository.save(user);
    }

    user = this.repository.create(dto);
    return await this.repository.save(user);
  }
}
