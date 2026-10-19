import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { FALLO, mockearConsulta } from '../test/queryBuilderMock.js';
import * as disponibilidadRepository from './disponibilidad.repository.js';

vi.mock('../config/supabase.config.js', () => ({ supabaseAdmin: { from: vi.fn() } }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('disponibilidad.repository', () => {
  it('mapea los snapshots guardados a objetos de dominio', async () => {
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
        detectadaEn: '2026-10-01T00:00:00.000Z',
        verificadaEn: '2026-10-17T00:00:00.000Z',
        vigente: true,
      },
    ]);
  });

  it('guarda ofertas con la clave natural y conserva los campos de snapshot', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, { data: null, error: null });
    const oferta = {
      tituloId: 42,
      plataformaId: 10,
      region: 'AR',
      tipoOferta: 'suscripcion',
      deepLink: 'https://www.netflix.com/title/1',
      fuenteId: 3,
      detectadaEn: '2026-10-17T00:00:00.000Z',
      verificadaEn: '2026-10-17T00:00:00.000Z',
      vigente: true,
    };

    await disponibilidadRepository.guardarOfertas([oferta]);

    expect(builder.upsert).toHaveBeenCalledWith(
      [
        {
          titulo_id: 42,
          plataforma_id: 10,
          region: 'AR',
          tipo_oferta: 'suscripcion',
          deep_link: 'https://www.netflix.com/title/1',
          fuente_id: 3,
          detectada_en: '2026-10-17T00:00:00.000Z',
          verificada_en: '2026-10-17T00:00:00.000Z',
          vigente: true,
        },
      ],
      { onConflict: 'titulo_id,plataforma_id,region,tipo_oferta' },
    );
  });

  it('conserva los campos históricos al upsertear una oferta no vigente', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, { data: null, error: null });

    await disponibilidadRepository.guardarOfertas([
      {
        tituloId: 42,
        plataformaId: 10,
        region: 'AR',
        tipoOferta: 'suscripcion',
        deepLink: 'https://www.netflix.com/title/1',
        fuenteId: 3,
        detectadaEn: '2026-10-01T00:00:00.000Z',
        verificadaEn: '2026-10-17T00:00:00.000Z',
        vigente: false,
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
          verificada_en: '2026-10-17T00:00:00.000Z',
          vigente: false,
        },
      ],
      { onConflict: 'titulo_id,plataforma_id,region,tipo_oferta' },
    );
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
  });
});
