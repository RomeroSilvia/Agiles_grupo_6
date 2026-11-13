-- Rol de cada usuario. Todos arrancan como 'usuario': el rol de administrador
-- se asigna desde el SQL Editor, nunca desde la app.

create type public.rol_usuario as enum ('usuario', 'administrador');

alter table public.perfil
  add column rol public.rol_usuario not null default 'usuario';
