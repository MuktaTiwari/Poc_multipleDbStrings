import { ObjectId } from 'mongodb';
import { getSystemDb } from '../db/systemDb';
import { RefreshTokenRecord } from '../models/refreshToken.model';

const collection = async () => {
  const db = await getSystemDb();
  return db.collection<RefreshTokenRecord>('refresh_tokens');
};

export const insert = async (userId: string, tokenHash: string, expiresAt: Date): Promise<ObjectId> => {
  const col = await collection();
  const _id = new ObjectId();
  await col.insertOne({
    _id,
    userId: new ObjectId(userId),
    tokenHash,
    expiresAt,
    createdAt: new Date(),
    revokedAt: null,
    rotatedToId: null,
  });
  return _id;
};

export const findByHash = async (tokenHash: string): Promise<RefreshTokenRecord | null> => {
  const col = await collection();
  return col.findOne({ tokenHash });
};

export const findById = async (id: ObjectId): Promise<RefreshTokenRecord | null> => {
  const col = await collection();
  return col.findOne({ _id: id });
};

// Revokes oldId as part of rotating it forward into newId - keeps the chain
// pointer so a concurrent request presenting oldId can be told "you lost a
// race" apart from "this token is dead" (logout/theft) further down the chain.
export const rotate = async (oldId: ObjectId, newId: ObjectId): Promise<void> => {
  const col = await collection();
  await col.updateOne({ _id: oldId }, { $set: { revokedAt: new Date(), rotatedToId: newId } });
};

export const revokeByHash = async (tokenHash: string): Promise<void> => {
  const col = await collection();
  await col.updateOne({ tokenHash }, { $set: { revokedAt: new Date(), rotatedToId: null } });
};

export const revokeAllForUser = async (userId: string): Promise<void> => {
  const col = await collection();
  await col.updateMany(
    { userId: new ObjectId(userId), revokedAt: null },
    { $set: { revokedAt: new Date(), rotatedToId: null } },
  );
};
