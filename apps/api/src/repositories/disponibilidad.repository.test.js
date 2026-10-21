import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { FALLO, SIN_DATOS, mockearConsulta } from '../test/queryBuilderMock.js';
import * as disponibilidadRepository from './disponibilidad.repository.js';

vi.mock('../config/supabase.config.js', () => ({ supabaseAdmin: { from: vi.fn() } }));

const VERIFICADA_EN = new Date('2026-10-17T06:00:00.000Z');

beforeEach(() => {
  vi.resetAllMocks();
});

describe('disponibilidad.repository', () => {
  it('devuelve snapshots completos como objetos de dominio', async () => {
    mockearConsulta(supabaseAdmin.from, {
      data: [
        {
          titulo_id: 42,
          plataforma_id: 10,
          region: 'AR',
          tipo_oferta: 'suscripcion',
          deep_link: 'https://www.netflix.com/title/1',
          fuente_id: 3,
          detectada_en: '2026-10-01T00:00:00.000Z',
          verificada_en: '2026-10-17T00:00:00.000Z',
          vigente: true,
        },
      ],
      error: null,
    });

    await expect(disponibilidadRepository.listarPorTituloYRegion(42, 'AR')).resolves.toEqual([
      {
        tituloId: 42,
        plataformaId: 10,
        region: 'AR',
        tipoOferta: 'suscripcion',
        deepLink: 'https://www.netflix.com/title/1',
        fuenteId: 3,
        detectadaEn: new Date('2026-10-01T00:00:00.000Z'),
        verificadaEn: new Date('2026-10-17T00:00:00.000Z'),
        vigente: true,
      },
    ]);
  });

  it('guarda snapshots completos con la clave natural', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, SIN_DATOS);

    await disponibilidadRepository.guardarOfertas([
      {
        tituloId: 42,
        plataformaId: 10,
        region: 'AR',
        tipoOferta: 'suscripcion',
        deepLink: 'https://www.netflix.com/title/1',
        fuenteId: 3,
        detectadaEn: new Date('2026-10-01T00:00:00.000Z'),
        verificadaEn: VERIFICADA_EN,
        vigente: true,
      },
    ]);

    expect(builder.upsert).toHaveBeenCalledWith(
      [
        {
          titulo_id: 42,
          plataforma_id: 10,
          region: 'AR',
          tipo_oferta: 'suscripcion',
          deep_link: 'https://www.netflix.com/title/1',
          fuente_id: 3,
          detectada_en: '2026-10-01T00:00:00.000Z',
          verificada_en: VERIFICADA_EN.toISOString(),
          vigente: true,
        },
      ],
      { onConflict: 'titulo_id,plataforma_id,region,tipo_oferta' },
    );
  });

  it('conserva detectada_en al retirar una oferta del snapshot vigente', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, SIN_DATOS);

    await disponibilidadRepository.guardarOfertas([
      {
        tituloId: 42,
        plataformaId: 10,
        region: 'AR',
        tipoOferta: 'suscripcion',
        deepLink: 'https://www.netflix.com/title/1',
        fuenteId: 3,
        detectadaEn: '2026-10-01T00:00:00.000Z',
        verificadaEn: VERIFICADA_EN,
        vigente: false,
      },
    ]);

    expect(builder.upsert.mock.calls[0][0][0]).toMatchObject({
      detectada_en: '2026-10-01T00:00:00.000Z',
      verificada_en: VERIFICADA_EN.toISOString(),
      vigente: false,
    });
  });

  it('guarda deep links sin modificar detectada_en ni vigente', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, SIN_DATOS);

    await disponibilidadRepository.guardarDeepLinks([
      {
        tituloId: 10,
        plataformaId: 1,
        region: 'AR',
        tipoOferta: 'suscripcion',
        deepLink: null,
        fuenteId: 2,
        verificadaEn: VERIFICADA_EN,
      },
    ]);

    const [filas, opciones] = builder.upsert.mock.calls[0];
    expect(filas).toEqual([
      {
        titulo_id: 10,
        plataforma_id: 1,
        region: 'AR',
        tipo_oferta: 'suscripcion',
        deep_link: null,
        fuente_id: 2,
        verificada_en: VERIFICADA_EN.toISOString(),
      },
    ]);
    expect(filas[0]).not.toHaveProperty('detectada_en');
    expect(filas[0]).not.toHaveProperty('vigente');
    expect(opciones).toEqual({ onConflict: 'titulo_id,plataforma_id,region,tipo_oferta' });
  });

  it('omite el upsert de snapshots cuando no hay ofertas', async () => {
    await disponibilidadRepository.guardarOfertas([]);

    expect(supabaseAdmin.from).not.toHaveBeenCalled();
  });

  it('lanza DatabaseError ante fallos de lectura y escritura', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);
    await expect(disponibilidadRepository.listarPorTituloYRegion(42, 'AR')).rejects.toBeInstanceOf(
      DatabaseError,
    );

    mockearConsulta(supabaseAdmin.from, FALLO);
    await expect(
      disponibilidadRepository.guardarOfertas([{ tituloId: 42 }]),
    ).rejects.toBeInstanceOf(DatabaseError);

    mockearConsulta(supabaseAdmin.from, FALLO);
    await expect(
      disponibilidadRepository.guardarDeepLinks([{ tituloId: 42 }]),
    ).rejects.toBeInstanceOf(DatabaseError);
  });
});
