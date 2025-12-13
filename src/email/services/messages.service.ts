import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ResourceService } from '@shared/resource/services/resource.service';
import { Email } from '../entities/email.entity';
import { QueryDto } from '../dto/messages/query.dto';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

@Injectable()
export class MessagesService extends ResourceService<Email> {
  protected repository: Repository<Email>;

  protected searchableColumns = ['subject', 'senderEmail', 'senderName'];

  protected orderableColumns = ['id', 'sentAt'];

  constructor(@InjectRepository(Email) emailRepository: Repository<Email>) {
    super();
    this.repository = emailRepository;
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<Email>,
    queryDto: ResourceQueryDto
  ): void {
    const { labels } = queryDto as QueryDto;
    labels &&
      queryBuilder.andWhere(`${this.entityName}.systemLabels @> :labels`, {
        labels,
      });
  }
}
