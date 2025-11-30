import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../entities/user.entity';
import { UsersQueryDto } from '../dto/users/query.dto';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { BaseResourceService } from '@shared/services/base-resource.service';

@Injectable()
export class UserService extends BaseResourceService<User> {
  protected repository: Repository<User>;
  protected entityName = 'user';
  protected searchableColumns = ['email', 'name'];
  protected orderableColumns = ['id', 'email', 'name', 'role', 'isActive'];

  constructor(@InjectRepository(User) userRepository: Repository<User>) {
    super();
    this.repository = userRepository;
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<User>,
    { role }: UsersQueryDto,
  ): void {
    role && queryBuilder.andWhere('user.role = :role', { role });
  }

  async assignRole(assignRoleDto: AssignRoleDto) {
    const { email, role } = assignRoleDto;
    let user = await this.repository.findOne({ where: { email } });

    if (user) {
      user.role = role;
      return await this.repository.save(user);
    }

    user = this.repository.create(assignRoleDto);
    return await this.repository.save(user);
  }
}
