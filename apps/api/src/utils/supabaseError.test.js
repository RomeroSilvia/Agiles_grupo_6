import { describe, it, expect } from 'vitest';
import { ConflictError, DatabaseError } from '../errors/index.js';
import { throwSupabaseError } from './supabaseError.js';

describe('throwSupabaseError', () => {
  it('convierte la violación de unicidad en ConflictError con el mensaje indicado', () => {
    expect(() => throwSupabaseError({ code: '23505' }, 'Ya existe')).toThrow(
      new ConflictError('Ya existe'),
    );
  });

  it('convierte cualquier otro error en DatabaseError', () => {
    expect(() => throwSupabaseError({ code: '42P01' }, 'Ya existe')).toThrow(DatabaseError);
  });
});
