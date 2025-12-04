import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { GmailEmail } from './email-email.entity';

@Entity()
@Unique(['accountId', 'gmailLabelId'])
export class GmailLabel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Single-account mode: default id to keep legacy rows valid
  @Column({ default: 'default-email-account' })
  accountId: string;

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
