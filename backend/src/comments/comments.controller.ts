import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('comments')
@ApiBearerAuth()
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('tasks/:taskId/comments')
  @ApiOperation({ summary: 'Add a comment to a task' })
  create(
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: any,
  ) {
    return this.commentsService.create(taskId, createCommentDto, req.user);
  }

  @Get('tasks/:taskId/comments')
  @ApiOperation({ summary: 'Get all comments for a task' })
  findAllByTask(@Param('taskId') taskId: string) {
    return this.commentsService.findAllByTask(taskId);
  }

  @Patch('comments/:id')
  @ApiOperation({ summary: 'Update a comment (Author or Admin only)' })
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() req: any,
  ) {
    return this.commentsService.update(id, updateCommentDto, req.user);
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a comment (Author or Admin only)' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.commentsService.remove(id, req.user);
  }
}
