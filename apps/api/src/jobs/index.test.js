import { beforeEach, describe, expect, it, vi } from 'vitest';

const cronMock = vi.hoisted(() => ({ schedule: vi.fn() }));
const syncAvailabilityMock = vi.hoisted(() => vi.fn());
const sendNotificationsMock = vi.hoisted(() => vi.fn());

vi.mock('node-cron', () => ({ default: cronMock }));
vi.mock('./syncAvailability.job.js', () => ({ syncAvailability: syncAvailabilityMock }));
vi.mock('./sendNotifications.job.js', () => ({ sendNotifications: sendNotificationsMock }));

import cron from 'node-cron';
import { JOBS_CONFIG } from '../config/jobs.config.js';
import { registerJobs, runJob } from './index.js';

const OPCIONES = {
  timezone: 'America/Argentina/Buenos_Aires',
  noOverlap: true,
  distributed: true,
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('jobs/index', () => {
  it('registra la sincronización diaria y el envío de avisos una sola vez', () => {
    cron.schedule.mockImplementation((expresion, tarea, { name }) => ({ name }));

    const tasks = registerJobs();

    expect(registerJobs()).toBe(tasks);
    expect(cron.schedule).toHaveBeenCalledTimes(2);
    expect(cron.schedule).toHaveBeenCalledWith(
      JOBS_CONFIG.SYNC_AVAILABILITY_SCHEDULE,
      expect.any(Function),
      { name: 'syncAvailability', ...OPCIONES },
    );
    expect(cron.schedule).toHaveBeenCalledWith(
      JOBS_CONFIG.SEND_NOTIFICATIONS_SCHEDULE,
      expect.any(Function),
      { name: 'sendNotifications', ...OPCIONES },
    );
  });

  it('ejecuta el job solicitado manualmente', async () => {
    syncAvailabilityMock.mockResolvedValue({ sincronizacionId: 1, errores: [] });
    sendNotificationsMock.mockResolvedValue({ enviados: 2, errores: [] });

    await expect(runJob('syncAvailability')).resolves.toEqual({
      sincronizacionId: 1,
      errores: [],
    });
    await expect(runJob('sendNotifications')).resolves.toEqual({ enviados: 2, errores: [] });
    expect(syncAvailabilityMock).toHaveBeenCalledOnce();
    expect(sendNotificationsMock).toHaveBeenCalledOnce();
  });

  it('rechaza nombres de job desconocidos', async () => {
    await expect(runJob('otro')).rejects.toThrow('Job desconocido: otro');
    await expect(runJob('toString')).rejects.toThrow('Job desconocido: toString');
    expect(syncAvailabilityMock).not.toHaveBeenCalled();
  });
});
