import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Setting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  key: string;

  @Column({ type: 'jsonb', nullable: false })
  value: any;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeKey() {
    if (this.key) {
      this.key = this.key.toLowerCase();
    }
  }
}
