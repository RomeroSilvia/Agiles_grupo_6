import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { FALLO, SIN_DATOS, mockearConsulta } from '../test/queryBuilderMock.js';
import * as disponibilidadRepository from './disponibilidad.repository.js';

vi.mock('../config/supabase.config.js', () => ({ supabaseAdmin: { from: vi.fn() } }));

const VERIFICADA_EN = new Date('2026-10-01T12:00:00.000Z');

beforeEach(() => {
  vi.resetAllMocks();
});

describe('listarPorTituloYRegion', () => {
  it('devuelve las disponibilidades del título en la región, vigentes o no', async () => {
    const builder = mockearConsulta(supabaseAdmin.from, {
      data: [
        {
          plataforma_id: 1,
          tipo_oferta: 'suscripcion',
          deep_link: 'https://www.netflix.com/title/1',
          verificada_en: VERIFICADA_EN.toISOString(),
        },
      ],
      error: null,
    });

    await expect(disponibilidadRepository.listarPorTituloYRegion(10, 'AR')).resolves.toEqual([
      {
        plataformaId: 1,
        tipoOferta: 'suscripcion',
        deepLink: 'https://www.netflix.com/title/1',
        verificadaEn: VERIFICADA_EN,
      },
    ]);
    expect(supabaseAdmin.from).toHaveBeenCalledWith('disponibilidad');
    expect(builder.eq).toHaveBeenCalledWith('titulo_id', 10);
    expect(builder.eq).toHaveBeenCalledWith('region', 'AR');
    expect(builder.eq).not.toHaveBeenCalledWith('vigente', expect.anything());
  });

  it('lanza DatabaseError si falla la consulta', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);

    await expect(disponibilidadRepository.listarPorTituloYRegion(10, 'AR')).rejects.toBeInstanceOf(
      DatabaseError,
    );
  });
});

describe('guardarDeepLinks', () => {
  it('hace upsert por la clave primaria sin tocar detectada_en ni vigente', async () => {
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

  it('lanza DatabaseError si falla el upsert', async () => {
    mockearConsulta(supabaseAdmin.from, FALLO);

    await expect(disponibilidadRepository.guardarDeepLinks([])).rejects.toBeInstanceOf(
      DatabaseError,
    );
  });
});
