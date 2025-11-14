import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { GmailTag } from './gmail-tag.entity';
import { GmailEmail } from './gmail-email.entity';

@Entity()
@Unique(['email'])
@Unique(['userId'])
export class GmailAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  displayName?: string;

  @Column()
  refreshToken: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @OneToMany(() => GmailTag, (tag) => tag.gmailAccount)
  tags: GmailTag[];

  @OneToMany(() => GmailEmail, (email) => email.gmailAccount)
  emails: GmailEmail[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
