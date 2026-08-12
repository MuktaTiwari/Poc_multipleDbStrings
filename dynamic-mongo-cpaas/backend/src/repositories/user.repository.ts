import { ObjectId } from 'mongodb';
import { getSystemDb } from '../db/systemDb';
import { UserRecord, PublicUser } from '../models/user.model';

export const toPublicUser = (user: UserRecord): PublicUser => ({
  id: user._id.toHexString(),
  email: user.email,
});

export const insertUser = async (email: string, passwordHash: string): Promise<PublicUser> => {
  const db = await getSystemDb();
  const result = await db.collection<Omit<UserRecord, '_id'>>('users').insertOne({
    email,
    passwordHash,
    createdAt: new Date(),
  });

  return { id: result.insertedId.toHexString(), email };
};

export const findByEmail = async (email: string): Promise<UserRecord | null> => {
  const db = await getSystemDb();
  return db.collection<UserRecord>('users').findOne({ email });
};

export const findById = async (id: string): Promise<PublicUser | null> => {
  const db = await getSystemDb();
  const user = await db.collection<UserRecord>('users').findOne({ _id: new ObjectId(id) });
  return user ? toPublicUser(user) : null;
};
