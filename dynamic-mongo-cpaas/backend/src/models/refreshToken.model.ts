import { ObjectId } from 'mongodb';

export interface RefreshTokenRecord {
  _id: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
  // Set only when this record was revoked *by rotation* (points at its
  // replacement). Revocations from logout or reuse-detection leave this null,
  // which is exactly how a benign lost-the-race replay is told apart from a
  // genuine stolen/expired token - see rotateRefreshToken.
  rotatedToId: ObjectId | null;
}
