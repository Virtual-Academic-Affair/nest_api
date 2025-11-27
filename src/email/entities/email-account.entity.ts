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
import { GmailLabel } from './email-label.entity';
import { GmailEmail } from './email-email.entity';
import { User } from '@authentication/entities/user.entity';

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

  @Column({ type: 'timestamptz', nullable: true })
  lastPulledAt?: Date;

  @OneToMany(() => GmailLabel, (label) => label.gmailAccount)
  labels: GmailLabel[];

  @OneToMany(() => GmailEmail, (email) => email.gmailAccount)
  emails: GmailEmail[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
