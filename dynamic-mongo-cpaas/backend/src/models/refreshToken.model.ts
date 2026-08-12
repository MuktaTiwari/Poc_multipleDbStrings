import { ObjectId } from 'mongodb';

export interface RefreshTokenRecord {
  _id: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}
