import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Unique(['gmailMessageId'])
export class Email {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ type: 'timestamp', nullable: true })
  internalDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  fetchedAt?: Date;

  @Column('text', { array: true, default: '{}' })
  labelIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
