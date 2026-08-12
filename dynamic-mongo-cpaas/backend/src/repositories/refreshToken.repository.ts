import { ObjectId } from 'mongodb';
import { getSystemDb } from '../db/systemDb';
import { RefreshTokenRecord } from '../models/refreshToken.model';

const collection = async () => {
  const db = await getSystemDb();
  return db.collection<RefreshTokenRecord>('refresh_tokens');
};

export const insert = async (userId: string, tokenHash: string, expiresAt: Date): Promise<void> => {
  const col = await collection();
  await col.insertOne({
    _id: new ObjectId(),
    userId: new ObjectId(userId),
    tokenHash,
    expiresAt,
    createdAt: new Date(),
    revokedAt: null,
  });
};

export const findByHash = async (tokenHash: string): Promise<RefreshTokenRecord | null> => {
  const col = await collection();
  return col.findOne({ tokenHash });
};

export const revoke = async (id: ObjectId): Promise<void> => {
  const col = await collection();
  await col.updateOne({ _id: id }, { $set: { revokedAt: new Date() } });
};

export const revokeByHash = async (tokenHash: string): Promise<void> => {
  const col = await collection();
  await col.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
};

export const revokeAllForUser = async (userId: string): Promise<void> => {
  const col = await collection();
  await col.updateMany({ userId: new ObjectId(userId), revokedAt: null }, { $set: { revokedAt: new Date() } });
};
