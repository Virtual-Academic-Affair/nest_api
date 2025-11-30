import { Column, Entity, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate } from 'typeorm';

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
  transformKey() {
    if (this.key) {
      this.key = this.key.toUpperCase();
    }
  }
}
