import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@shared/authentication/decorators/auth.decorator';
import { AuthType } from '@shared/authentication/enums/auth-type.enum';
import { Roles } from '@shared/authorization/decorators/roles.decorator';
import { Role } from '@shared/authorization/enums/role.enum';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';
import { RestrictMethods } from '@shared/resource/decorators/restrict-methods.decorator';
import { Email } from '../entities/email.entity';
import { MessagesService } from '../services/messages.service';
import { QueryDto } from '../dto/messages/query.dto';
import { UpdateDto } from '../dto/messages/update.dto';

@ApiTags('Email - Messages')
@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('email/messages')
@RestrictMethods({
  only: [ResourceAction.FindAll, ResourceAction.FindOne, ResourceAction.Update],
})
export class MessagesController extends ResourceController<Email> {
  constructor(private readonly messagesService: MessagesService) {
    super(messagesService);
  }

  protected getDtoClasses() {
    return { query: QueryDto, update: UpdateDto };
  }
}
