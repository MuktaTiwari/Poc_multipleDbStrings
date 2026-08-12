import { ObjectId } from 'mongodb';

export interface UserRecord {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface PublicUser {
  id: string;
  email: string;
}
