import { createBrowserRouter } from 'react-router';
import { MainLayout } from './MainLayout.jsx';
import { NotFoundPage } from './NotFoundPage.jsx';
import { PaginaBusqueda } from '../features/busqueda/PaginaBusqueda.jsx';
import { PaginaDetalleTitulo } from '../features/detalle/PaginaDetalleTitulo.jsx';
import { SoloSinSesion } from '../features/auth/SoloSinSesion.jsx';
import { PaginaInicioSesion } from '../features/auth/PaginaInicioSesion.jsx';
import { PaginaRegistro } from '../features/auth/PaginaRegistro.jsx';
import { PaginaRecuperarPassword } from '../features/auth/PaginaRecuperarPassword.jsx';
import { PaginaRestablecerPassword } from '../features/auth/PaginaRestablecerPassword.jsx';
import { PaginaCuenta } from '../features/cuenta/PaginaCuenta.jsx';
import { PaginaConfirmarMail } from '../features/cuenta/PaginaConfirmarMail.jsx';
import { SoloConSesion } from '../features/auth/SoloConSesion.jsx';
import { PaginaMisPlataformas } from '../features/plataformas/PaginaMisPlataformas.jsx';
import { PaginaPerfil } from '../features/perfil/PaginaPerfil.jsx';
import { PaginaWatchlist } from '../features/watchlist/PaginaWatchlist.jsx';
import { RUTAS } from './rutas.js';

export const routes = [
  {
    path: RUTAS.BUSQUEDA,
    Component: MainLayout,
    children: [
      { index: true, Component: PaginaBusqueda },
      { path: RUTAS.DETALLE_TITULO, Component: PaginaDetalleTitulo },
      { path: RUTAS.WATCHLIST, Component: PaginaWatchlist },
      {
        Component: SoloConSesion,
        children: [
          { path: RUTAS.MIS_PLATAFORMAS, Component: PaginaMisPlataformas },
          { path: RUTAS.PERFIL, Component: PaginaPerfil },
          { path: RUTAS.CUENTA, Component: PaginaCuenta },
        ],
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
      { path: RUTAS.RECUPERAR_PASSWORD, Component: PaginaRecuperarPassword },
    ],
  },
  { path: RUTAS.RESTABLECER_PASSWORD, Component: PaginaRestablecerPassword },
  { path: RUTAS.CONFIRMAR_MAIL, Component: PaginaConfirmarMail },
];

export const router = createBrowserRouter(routes);
