import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { AssignRoleDto } from './dto/assign-role.dto';
import { Role } from './enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  /**
   * Admin assign role to user
   * - If user exists with different role -> update role
   * - If user not exists -> create new user with email + role
   */
  async assignRole(assignRoleDto: AssignRoleDto): Promise<User> {
    const { email, role } = assignRoleDto;

    let user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      if (user.role !== role) {
        user.role = role;
        return await this.userRepository.save(user);
      }
      return user;
    }

    user = this.userRepository.create({
      email,
      role,
    });

    return await this.userRepository.save(user);
  }
  
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }
  
  async findByGoogleId(googleId: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { googleId } });
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      order: { id: 'DESC' },
    });
  }
}
