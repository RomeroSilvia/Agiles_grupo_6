import { createBrowserRouter } from 'react-router';
import { MainLayout } from './MainLayout.jsx';
import { NotFoundPage } from './NotFoundPage.jsx';
import { PaginaBusqueda } from '../features/busqueda/PaginaBusqueda.jsx';
import { PaginaDetalleTitulo } from '../features/detalle/PaginaDetalleTitulo.jsx';
import { SoloSinSesion } from '../features/auth/SoloSinSesion.jsx';
import { PaginaInicioSesion } from '../features/auth/PaginaInicioSesion.jsx';
import { PaginaRegistro } from '../features/auth/PaginaRegistro.jsx';
import { SoloConSesion } from '../features/auth/SoloConSesion.jsx';
import { PaginaMisPlataformas } from '../features/plataformas/PaginaMisPlataformas.jsx';
import { RUTAS } from './rutas.js';

export const routes = [
  {
    path: RUTAS.BUSQUEDA,
    Component: MainLayout,
    children: [
      { index: true, Component: PaginaBusqueda },
      { path: RUTAS.DETALLE_TITULO, Component: PaginaDetalleTitulo },
      {
        Component: SoloConSesion,
        children: [{ path: RUTAS.MIS_PLATAFORMAS, Component: PaginaMisPlataformas }],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
  {
    // Pantallas de ingreso: pantalla completa, sin el header del sitio
    Component: SoloSinSesion,
    children: [
      { path: RUTAS.INICIAR_SESION, Component: PaginaInicioSesion },
      { path: RUTAS.REGISTRO, Component: PaginaRegistro },
    ],
  },
];

export const router = createBrowserRouter(routes);
