import { ConflictError, DatabaseError } from '../errors/index.js';

const UNIQUE_VIOLATION_CODE = '23505';

export function throwSupabaseError(error, conflictMessage) {
  if (error.code === UNIQUE_VIOLATION_CODE) {
    throw new ConflictError(conflictMessage);
  }
  throw new DatabaseError(error);
}
