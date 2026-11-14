// IDs asignados una vez; conservarlos al actualizar nombres o proveedores.
// Ubicaciones verificadas en Locations API; cobertura de horarios sin verificar.
export const DIRECTORIO_CIUDADES_CINE = Object.freeze({
  configurado: true,
  ciudades: [
    {
      id: 'ar:cd888c22-4d30-4d37-a32b-155e751c8d05',
      nombre: 'La Plata',
      provincia: 'Buenos Aires',
      pais: 'AR',
      zonaHoraria: 'America/Argentina/Buenos_Aires',
      cobertura: 'sin_verificar',
      fuente: {
        fuenteId: 'serpapi',
        registroId: '585069a1ee19ad271e9b4bc2',
        url: 'https://serpapi.com/locations.json?q=La+Plata&limit=10',
        consultadoEn: '2026-11-14T18:36:31.628Z',
        actualizadoEn: null,
      },
      serpApiLocation: 'La Plata,Buenos Aires Province,Argentina',
      butacaCines: [],
      evidenciaPorFuente: {
        serpApi: {
          registroId: '585069a1ee19ad271e9b4bc2',
          url: 'https://serpapi.com/locations.json?q=La+Plata&limit=10',
          consultadoEn: '2026-11-14T18:36:31.628Z',
          actualizadoEn: null,
          evidencia:
            'Ubicación urbana AR vigente validada en Locations API. Identifica el alcance geográfico de consulta; no acredita cobertura de horarios.',
        },
        butaca: null,
      },
    },
    {
      id: 'ar:a2c2aae3-5cc8-4f9e-8e9d-389cf7def8ff',
      nombre: 'CABA',
      provincia: 'Ciudad Autónoma de Buenos Aires',
      pais: 'AR',
      zonaHoraria: 'America/Argentina/Buenos_Aires',
      cobertura: 'sin_verificar',
      fuente: {
        fuenteId: 'serpapi',
        registroId: '585069a1ee19ad271e9b4bd7',
        url: 'https://serpapi.com/locations.json?q=Buenos+Aires&limit=10',
        consultadoEn: '2026-11-14T18:36:31.656Z',
        actualizadoEn: null,
      },
      serpApiLocation: 'Buenos Aires,Buenos Aires,Argentina',
      butacaCines: [],
      evidenciaPorFuente: {
        serpApi: {
          registroId: '585069a1ee19ad271e9b4bd7',
          url: 'https://serpapi.com/locations.json?q=Buenos+Aires&limit=10',
          consultadoEn: '2026-11-14T18:36:31.656Z',
          actualizadoEn: null,
          evidencia:
            'Ubicación urbana AR vigente validada en Locations API. Identifica el alcance geográfico de consulta; no acredita cobertura de horarios.',
        },
        butaca: null,
      },
    },
    {
      id: 'ar:d036bc1a-707f-49c5-b6b3-8f0430fd25af',
      nombre: 'Córdoba',
      provincia: 'Córdoba',
      pais: 'AR',
      zonaHoraria: 'America/Argentina/Cordoba',
      cobertura: 'sin_verificar',
      fuente: {
        fuenteId: 'serpapi',
        registroId: '584f1826914a8159dc8f5e71',
        url: 'https://serpapi.com/locations.json?q=Cordoba&limit=10',
        consultadoEn: '2026-11-14T18:36:31.675Z',
        actualizadoEn: null,
      },
      serpApiLocation: 'Cordoba,Cordoba Province,Argentina',
      butacaCines: [],
      evidenciaPorFuente: {
        serpApi: {
          registroId: '584f1826914a8159dc8f5e71',
          url: 'https://serpapi.com/locations.json?q=Cordoba&limit=10',
          consultadoEn: '2026-11-14T18:36:31.675Z',
          actualizadoEn: null,
          evidencia:
            'Ubicación urbana AR vigente validada en Locations API. Identifica el alcance geográfico de consulta; no acredita cobertura de horarios.',
        },
        butaca: null,
      },
    },
    {
      id: 'ar:24880ea5-7ead-4e6d-ae1a-a91a0029286b',
      nombre: 'Mar del Plata',
      provincia: 'Buenos Aires',
      pais: 'AR',
      zonaHoraria: 'America/Argentina/Buenos_Aires',
      cobertura: 'sin_verificar',
      fuente: {
        fuenteId: 'serpapi',
        registroId: '585069a1ee19ad271e9b4bc6',
        url: 'https://serpapi.com/locations.json?q=Mar+del+Plata&limit=10',
        consultadoEn: '2026-11-14T18:36:31.693Z',
        actualizadoEn: null,
      },
      serpApiLocation: 'Mar del Plata,Buenos Aires Province,Argentina',
      butacaCines: [],
      evidenciaPorFuente: {
        serpApi: {
          registroId: '585069a1ee19ad271e9b4bc6',
          url: 'https://serpapi.com/locations.json?q=Mar+del+Plata&limit=10',
          consultadoEn: '2026-11-14T18:36:31.693Z',
          actualizadoEn: null,
          evidencia:
            'Ubicación urbana AR vigente validada en Locations API. Identifica el alcance geográfico de consulta; no acredita cobertura de horarios.',
        },
        butaca: null,
      },
    },
  ],
});
