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
  ) {}

  async getBookmarks(): Promise<Bookmark[]> {
    return this.bookmarkModel.find().exec();
  }

  async create(url: string): Promise<Bookmark> {
    const title = await this.fetchTitle(url);

    const newBookmark = new this.bookmarkModel({
      url,
      title,
    });
    return newBookmark.save();
  }

  async delete(id: string): Promise<void> {
    await this.bookmarkModel.findByIdAndDelete(id);
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