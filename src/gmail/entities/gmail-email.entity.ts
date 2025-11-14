import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { GmailAccount } from './gmail-account.entity';
import { GmailTag } from './gmail-tag.entity';

@Entity()
@Unique(['gmailAccount', 'gmailMessageId'])
export class GmailEmail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GmailAccount, (account) => account.emails, {
    onDelete: 'CASCADE',
  })
  gmailAccount: GmailAccount;

  @Column()
  gmailMessageId: string;

  @Column({ type: 'text', nullable: true })
  messageIdHeader?: string;

  @Column({ nullable: true })
  threadId?: string;

  @Column({ nullable: true, type: 'text' })
  content?: string;

  @Column({ nullable: true })
  subject?: string;

  @Column({ nullable: true })
  senderName?: string;

  @Column({ nullable: true })
  senderEmail?: string;

  @Column({ nullable: true })
  receiverName?: string;

  @Column({ nullable: true })
  receiverEmail?: string;

  @Column({ nullable: true })
  parentEmailId?: string;

  @Column({ type: 'timestamptz', nullable: true })
  internalDate?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  fetchedAt?: Date;

  @ManyToMany(() => GmailTag, (tag) => tag.emails, {
    cascade: false,
  })
  @JoinTable({
    name: 'gmail_email_tags',
    joinColumn: { name: 'email_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: GmailTag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
