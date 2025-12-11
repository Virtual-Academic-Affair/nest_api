import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/resource/entities/base.entity';

@Entity()
export class Setting extends BaseEntity {
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
