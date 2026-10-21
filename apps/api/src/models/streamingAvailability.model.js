import { z } from 'zod';

const streamingOptionSchema = z.object({
  service: z.object({ id: z.string().min(1) }),
  type: z.string().min(1),
  link: z.url(),
});

export const streamingAvailabilityResponseSchema = z.object({
  streamingOptions: z.record(z.string(), z.array(streamingOptionSchema)),
});
