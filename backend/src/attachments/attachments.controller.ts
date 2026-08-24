import {
  Controller,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('attachments')
@ApiBearerAuth()
@Controller()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('tasks/:taskId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a file attachment to a task' })
  uploadAttachment(
    @Param('taskId') taskId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB limit
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.attachmentsService.uploadAttachment(taskId, file, req.user);
  }

  @Delete('attachments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an attachment' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.attachmentsService.remove(id, req.user);
  }
}
