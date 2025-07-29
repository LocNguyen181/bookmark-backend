import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BookmarkDocument = Bookmark & Document;

@Schema()
export class Bookmark {
  @Prop({ required: true })
  url: string;

  @Prop()
  title?: string;

  @Prop({ default: Date.now })
  dateAdded?: Date;
}

export const BookmarkSchema = SchemaFactory.createForClass(Bookmark);
