import { z } from 'zod';

export const httpUrlSchema = z.url({ protocol: /^https?$/, error: 'Enlace inválido' });
