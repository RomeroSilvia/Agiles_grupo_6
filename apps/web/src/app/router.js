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

export const routes = [
  {
    path: '/',
    Component: MainLayout,
    children: [
      { index: true, Component: PaginaBusqueda },
      { path: 'titulos/:tipo/:tmdbId', Component: PaginaDetalleTitulo },
      {
        Component: SoloConSesion,
        children: [{ path: 'mis-plataformas', Component: PaginaMisPlataformas }],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
  {
    // Pantallas de ingreso: pantalla completa, sin el header del sitio
    Component: SoloSinSesion,
    children: [
      { path: '/iniciar-sesion', Component: PaginaInicioSesion },
      { path: '/registro', Component: PaginaRegistro },
    ],
  },
];

export const router = createBrowserRouter(routes);
