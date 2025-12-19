import { Controller, Get, Post, Body, Delete, Param, Query } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { Bookmark } from './bookmark.model';

@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) { }

  @Get()
  getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return this.bookmarksService.getBookmarks(pageNum, limitNum);
  }

  @Post()
<<<<<<< HEAD
  async create(@Body() body: { url: string }) {
    return this.bookmarksService.create(body.url);
=======
  async create(@Body() body: { url: string; tags?: string[] | string }) {
    console.log('Received body:', body);
    return this.bookmarksService.create(body.url, body.tags);
>>>>>>> a794cda9899fb8709f21efd3d88eca89157cd5da
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.bookmarksService.delete(id);
  }
  @Get('search')
  searchByKeyword(@Query('keyword') keyword: string): Promise<Bookmark[]> {
    return this.bookmarksService.searchBookmarks(keyword);
  }

  @Post(':id/tags')
  async addTagsToBookmark(
    @Param('id') id: string,
    @Body() body: { tags: string[] },
  ): Promise<void> {
    return this.bookmarksService.addTags(id, body.tags);
  }
}