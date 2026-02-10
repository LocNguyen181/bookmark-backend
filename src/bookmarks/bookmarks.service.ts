import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) { }

  async getBookmarks(page: number = 1, limit: number = 10): Promise<{ items: any[], totalPages: number, total: number }> {
    try {
      const skip = (page - 1) * Number(limit);
      const take = Number(limit);

      const [items, total] = await Promise.all([
        this.prisma.bookmark.findMany({
          skip,
          take,
          orderBy: { dateAdded: 'desc' },
        }),
        this.prisma.bookmark.count(),
      ]);

      const formattedItems = items.map(item => ({
        ...item,
        tags: item.tags ? JSON.parse(item.tags) : [],
      }));

      return {
        items: formattedItems,
        totalPages: Math.ceil(total / take),
        total,
      };
    } catch (e) {
      console.error(e);
      throw new Error('Got Error');
    }
  }

  async create(url: string, tags?: string[] | string, actressName?: string, providedTitle?: string): Promise<any> {
    try {
      const title = providedTitle || await this.fetchTitle(url);

      const normalizedTags = Array.isArray(tags) ? tags : (typeof tags === 'string' ? [tags] : []);
      const cleanedTags = (normalizedTags || [])
        .map(t => (t ?? '').toString().trim())
        .filter(t => t.length > 0);

      let finalActressName = actressName?.trim() || null;

      // Handle name reversal logic
      if (finalActressName) {
        const existingInfo = await this.findCanonicalActressName(finalActressName);
        if (existingInfo) {
          finalActressName = existingInfo;
        }
      }

      const result = await this.prisma.bookmark.create({
        data: {
          url,
          title,
          tags: cleanedTags.length > 0 ? JSON.stringify(cleanedTags) : null,
          actressName: finalActressName,
        },
      });

      return {
        ...result,
        tags: cleanedTags,
      };
    } catch (e) {
      console.error(e);
      throw new Error('Got Error');
    }
  }

  private async findCanonicalActressName(name: string): Promise<string | null> {
    const normalizedTarget = name.toLowerCase().split(/\s+/).sort().join(' ');

    // In a real app, you'd have an Actress table. 
    // Here we scan existing bookmarks to find a canonical name.
    // To be efficient, we only check a subset or use a separate table in the future.
    const samples = await this.prisma.bookmark.findMany({
      where: { actressName: { not: null } },
      select: { actressName: true },
      distinct: ['actressName'],
      take: 500, // Limit scan for performance
    });

    for (const sample of samples) {
      if (sample.actressName) {
        const normalizedSample = sample.actressName.toLowerCase().split(/\s+/).sort().join(' ');
        if (normalizedSample === normalizedTarget) {
          return sample.actressName;
        }
      }
    }
    return null;
  }

  async delete(id: string | number): Promise<void> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    await this.prisma.bookmark.delete({
      where: { id: numericId },
    });
  }

  async searchItem(key: string): Promise<any[]> {
    try {
      const items = await this.prisma.bookmark.findMany({
        where: {
          OR: [
            { title: { contains: key } },
            { url: { contains: key } },
            { actressName: { contains: key } },
          ],
        },
      });

      return items.map(item => ({
        ...item,
        tags: item.tags ? JSON.parse(item.tags) : [],
      }));
    } catch (e) {
      console.error(e);
      throw new Error('Got Error');
    }
  }

  async searchByActress(name: string): Promise<any[]> {
    try {
      const parts = name.trim().toLowerCase().split(/\s+/).filter(Boolean);

      if (parts.length === 0) return [];

      // For SQLite, case-insensitivity depends on DB settings.
      // We'll search for each part.
      // Note: SQLite's LIKE is usually case-insensitive for ASCII.
      const items = await this.prisma.bookmark.findMany({
        where: {
          actressName: {
            not: null,
          },
        },
        orderBy: { dateAdded: 'desc' },
      });

      // Filter in memory for more complex match if needed, 
      // but let's try to do as much as possible in DB.
      const filtered = items.filter(item => {
        if (!item.actressName) return false;
        const lowerName = item.actressName.toLowerCase();
        return parts.every(part => lowerName.includes(part));
      });

      return filtered.map(item => ({
        ...item,
        tags: item.tags ? JSON.parse(item.tags) : [],
      }));
    } catch (e) {
      console.error('searchByActress error:', e);
      throw new Error('Got Error');
    }
  }

  async listUniqueActresses(query?: string): Promise<string[]> {
    try {
      const parts = query ? query.trim().toLowerCase().split(/\s+/).filter(Boolean) : [];

      const result = await this.prisma.bookmark.findMany({
        where: {
          actressName: {
            not: null,
          }
        },
        select: {
          actressName: true,
        },
        distinct: ['actressName'],
      });

      const names = result.map(r => r.actressName).filter(Boolean) as string[];

      if (parts.length === 0) return names;

      return names.filter(name => {
        const lowerName = name.toLowerCase();
        return parts.every(part => lowerName.includes(part));
      });
    } catch (e) {
      console.error('listUniqueActresses error:', e);
      throw new Error('Got Error');
    }
  }

  async fetchTitle(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
          'Referer': new URL(url).origin,
        },
        timeout: 10000,
      });
      const html = response.data as string;
      const $ = cheerio.load(html);

      const getMeta = (selector: string) => $(selector).attr('content')?.toString().trim() || '';
      const collapseWhitespace = (text: string) => text.replace(/\s+/g, ' ').trim();

      // Priority 1: Specific class requested by user
      const archiveTitle = $('.archive-title').first().text().trim();
      if (archiveTitle) return collapseWhitespace(archiveTitle);

      const candidates: string[] = [
        getMeta('meta[property="og:title"]'),
        getMeta('meta[name="twitter:title"]'),
        getMeta('meta[name="title"]'),
        $('head > title').first().text().trim(),
      ].filter(Boolean);

      const raw = candidates.find(Boolean) || '';
      const cleaned = collapseWhitespace(raw);

      return cleaned || url;
    } catch (err) {
      console.warn(`Failed to fetch title from ${url}`);
      return url;
    }
  }

  async addTags(id: string | number, tags: string[] | string): Promise<void> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const normalized = Array.isArray(tags) ? tags : [tags];
    const cleaned = normalized
      .map(t => (t ?? '').toString().trim())
      .filter(t => t.length > 0);

    if (cleaned.length === 0) return;

    const bookmark = await this.prisma.bookmark.findUnique({
      where: { id: numericId },
    });

    if (!bookmark) return;

    const currentTags: string[] = bookmark.tags ? JSON.parse(bookmark.tags) : [];
    const updatedTags = Array.from(new Set([...currentTags, ...cleaned]));

    await this.prisma.bookmark.update({
      where: { id: numericId },
      data: {
        tags: JSON.stringify(updatedTags),
      },
    });
  }

  async syncAllTitles(): Promise<{ updated: number, failed: number }> {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: {
        OR: [
          { title: null },
          { title: '' },
          { title: { contains: 'http' } } // Titles that are just URLs
        ]
      }
    });

    let updated = 0;
    let failed = 0;

    for (const b of bookmarks) {
      try {
        const newTitle = await this.fetchTitle(b.url);
        if (newTitle && newTitle !== b.url) {
          await this.prisma.bookmark.update({
            where: { id: b.id },
            data: { title: newTitle }
          });
          updated++;
        } else {
          failed++;
        }
        // Small delay to avoid hammering servers
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        failed++;
      }
    }

    return { updated, failed };
  }
}