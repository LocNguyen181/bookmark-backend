import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Bookmark, BookmarkDocument } from './bookmark.model';
import { Model } from 'mongoose';
import axios from 'axios';
import * as cheerio from 'cheerio';
@Injectable()
export class BookmarksService {
  constructor(
    @InjectModel(Bookmark.name)
    private readonly bookmarkModel: Model<BookmarkDocument>,
  ) { }

  async getBookmarks(): Promise<Bookmark[]> {
    try {
      return this.bookmarkModel.find().exec();
    } catch (e) {
      throw new Error('Got Error');
    }
  }

  async create(url: string): Promise<Bookmark> {
    try {
      const title = await this.fetchTitle(url);

      const newBookmark = new this.bookmarkModel({
        url,
        title,
      });
      return newBookmark.save();
    } catch (e) {
      throw new Error('Got Error');
    }

  }

  async delete(id: string): Promise<void> {
    await this.bookmarkModel.findByIdAndDelete(id);
  }

  async searchItem(key: string): Promise<Bookmark[]> {
    try {
      const bookmarks = await this.getBookmarks();
      const keyword = key;
      return bookmarks.filter(bookmark =>
        bookmark.title.toLowerCase().includes(keyword.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(keyword.toLowerCase()),
      );
    } catch (e) {
      throw new Error('Got Error');
    }
  }

  private async fetchTitle(url: string): Promise<string> {
    try {
      const response = await axios.get(url);
      const html = response.data as string;
      const $ = cheerio.load(html);
      return $('title').text().trim() || url;
    } catch (err) {
      console.warn(`Failed to fetch title from ${url}`);
      return url;
    }
  }
}