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
import { GmailAccount } from './email-account.entity';
import { GmailEmail } from './email-email.entity';

@Entity()
@Unique(['gmailAccount', 'gmailLabelId'])
export class GmailLabel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GmailAccount, (account) => account.labels, {
    onDelete: 'CASCADE',
  })
  gmailAccount: GmailAccount;

  @Column()
  gmailLabelId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  type?: string;

  @Column({ nullable: true })
  color?: string;

  @ManyToMany(() => GmailEmail, (email) => email.labels)
  emails: GmailEmail[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
