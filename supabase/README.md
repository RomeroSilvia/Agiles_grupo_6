# supabase

Base de datos: migraciones SQL versionadas (`migrations/`) y datos iniciales (`seed.sql`).

Nadie aplica migraciones a mano. Las convenciones están en [AGENTS.md](../AGENTS.md).

## Asignar un administrador

Todos los usuarios se crean con el rol `usuario`. El rol `administrador` no se puede dar desde la app: se asigna desde Supabase.

Dar el rol, buscando al usuario por su mail:

```sql
update public.perfil
set rol = 'administrador'
where id = (select id from auth.users where email = '<mail del usuario>');
```

El resultado tiene que decir `UPDATE 1`. Si dice `UPDATE 0`, no hay ninguna cuenta con ese mail.

La API controla el rol en cada request a `/api/admin`, así que el cambio vale enseguida. La web
recién muestra u oculta «Administración» cuando el usuario recarga la página o vuelve a iniciar
sesión.

Quitar el rol:

```sql
update public.perfil
set rol = 'usuario'
where id = (select id from auth.users where email = '<mail del usuario>');
```

Ver quiénes son administradores:

```sql
select u.email, p.creado_en
from public.perfil as p
join auth.users as u on u.id = p.id
where p.rol = 'administrador';
```
