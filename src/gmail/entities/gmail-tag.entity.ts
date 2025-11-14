import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { GmailAccount } from './gmail-account.entity';
import { GmailEmail } from './gmail-email.entity';

@Entity()
@Unique(['gmailAccount', 'gmailTagId'])
export class GmailTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GmailAccount, (account) => account.tags, {
    onDelete: 'CASCADE',
  })
  gmailAccount: GmailAccount;

  @Column()
  gmailTagId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  type?: string;

  @Column({ nullable: true })
  color?: string;

  @ManyToMany(() => GmailEmail, (email) => email.tags)
  emails: GmailEmail[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
