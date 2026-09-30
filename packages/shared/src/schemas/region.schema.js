import { z } from 'zod';
import { REGION_PATTERN } from '../constants/index.js';

export const regionSchema = z.string().regex(REGION_PATTERN, 'Región inválida');
