import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UrlDocument = Url & Document;

@Schema()
export class Url {
  @Prop({ required: true })
  originalUrl: string;

  @Prop({ required: true, unique: true })
  shortPath: string;

  @Prop({ required: true, default: () => new Date().toISOString() })
  createdAt: string;

  @Prop({ default: 0 })
  visitCount: number;

  @Prop({ type: String, default: null, required: false })
  lastVisited: string;

  @Prop({ type: String, default: null, required: false })
  expiresAt: string;
}

export const UrlSchema = SchemaFactory.createForClass(Url);

// Create indexes for better performance
UrlSchema.index({ shortPath: 1 }, { unique: true });
UrlSchema.index({ originalUrl: 1 });
UrlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
