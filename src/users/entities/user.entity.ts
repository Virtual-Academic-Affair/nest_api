import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../enums/role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ unique: true, nullable: false })
  googleId: string;

  @Column({ nullable: false })
  name: string;

  @Column({ enum: Role, default: Role.Student })
  role: Role;

  @Column({ nullable: true })
  picture?: string;
}
