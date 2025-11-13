import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../enums/role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ unique: true, nullable: true })
  googleId?: string;

  @Column({ nullable: true })
  name: string;

  @Column({ enum: Role, default: Role.Student })
  role: Role;

  @Column({ nullable: true })
  picture?: string;
}
