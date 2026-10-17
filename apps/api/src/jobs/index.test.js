import { beforeEach, describe, expect, it, vi } from 'vitest';

const cronMock = vi.hoisted(() => ({ schedule: vi.fn() }));
const syncAvailabilityMock = vi.hoisted(() => vi.fn());

vi.mock('node-cron', () => ({ default: cronMock }));
vi.mock('./syncAvailability.job.js', () => ({ syncAvailability: syncAvailabilityMock }));

import cron from 'node-cron';
import { JOBS_CONFIG } from '../config/jobs.config.js';
import { registerJobs, runJob } from './index.js';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('jobs/index', () => {
  it('registra la sincronización diaria en la zona horaria definida y evita registros duplicados', () => {
    const task = { stop: vi.fn() };
    cron.schedule.mockReturnValue(task);

    expect(registerJobs()).toBe(task);
    expect(registerJobs()).toBe(task);
    expect(cron.schedule).toHaveBeenCalledTimes(1);
    expect(cron.schedule).toHaveBeenCalledWith(
      JOBS_CONFIG.SYNC_AVAILABILITY_SCHEDULE,
      expect.any(Function),
      {
        name: 'syncAvailability',
        timezone: 'America/Argentina/Buenos_Aires',
        noOverlap: true,
        distributed: true,
      },
    );
  });

  it('ejecuta el job solicitado manualmente', async () => {
    syncAvailabilityMock.mockResolvedValue({ sincronizacionId: 1, errores: [] });

    await expect(runJob('syncAvailability')).resolves.toEqual({
      sincronizacionId: 1,
      errores: [],
    });
    expect(syncAvailabilityMock).toHaveBeenCalledOnce();
  });

  it('rechaza nombres de job desconocidos', async () => {
    await expect(runJob('otro')).rejects.toThrow('Job desconocido: otro');
    expect(syncAvailabilityMock).not.toHaveBeenCalled();
  });
});
