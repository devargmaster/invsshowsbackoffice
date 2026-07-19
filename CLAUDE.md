# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es esto

Panel de administración (React 19 + Vite, sin framework de estado) de INVS
(Panda Estudios). Lo usan ADMIN/STAFF para gestionar eventos, categorías,
adicionales, contenido de streaming, y para aprobar órdenes con
transferencia bancaria pendiente. Es uno de 4 repos hermanos del proyecto
(`invs-backend`, `invs-web`, `invs-mobile-mvp-fixed` viven en el directorio
padre); este repo es solo el frontend de administración, consume la API de
`invs-backend`.

## Comandos

```bash
npm run dev       # vite, puerto 5173 fijo (strictPort) — ver nota de CORS abajo
npm run build      # tsc -b && vite build
npm run lint        # eslint .
npm run preview      # sirve el build de dist/
```

No hay suite de tests configurada (sin test runner en `package.json`, sin
archivos `*.test.tsx`/`*.spec.tsx`) — no asumir cobertura automática al
hacer cambios.

El puerto 5173 está fijado a propósito (`vite.config.ts`, `server.strictPort:
true`) para que sea predecible y se pueda agregar a `CORS_ORIGINS` en el
backend sin sorpresas; no cambiarlo sin actualizar también la whitelist de
CORS del backend.

## Arquitectura

**Sin gestor de estado global ni capa de servicios.** Cada página en
`src/pages/*.tsx` maneja su propio `useState`/`useEffect` y llama
directamente a `apiClient` (`src/apiClient.ts`) — no hay Redux/Zustand/React
Query, no hay `AuthContext`, no hay hooks compartidos de datos. El patrón se
repite en casi todas las páginas: cargar lista al montar, modal con form
controlado para crear/editar, `window.confirm` + `alert()` nativos para
confirmaciones y errores (no hay sistema de toasts).

**`apiClient` es un wrapper mínimo sobre `fetch`, no axios.** Adjunta el
Bearer token leído de `localStorage['invs_admin_token']` en cada request. Si
la respuesta es 401, borra el token y fuerza `window.location.href = '/'`
(reload completo, no `navigate` de react-router) — pero solo si
`pathname !== '/'`, para no generar un loop de redirects en el login mismo.

**El guard de rutas es débil y solo verifica que exista un token, no el
rol.** `AdminLayout` (`src/components/AdminLayout.tsx`) hace
`useEffect(() => { if (!localStorage.getItem('invs_admin_token')) navigate('/') })`
— esto corre después del primer render, así que el layout (sidebar incluido)
llega a pintarse brevemente antes del redirect si no hay token. No existe
diferenciación ADMIN vs STAFF en el frontend (el selector de rol en
`Users.tsx` permite asignar `USER`/`STAFF`/`ADMIN` pero ninguna pantalla
oculta funciones según el rol logueado): la autorización real depende
enteramente del `RolesGuard` del backend, que devuelve 403 si el usuario no
tiene permiso.

**El escaneo de QR / canje de entradas en el evento NO está implementado en
este repo.** `Tickets.tsx` solo permite elegir un evento y listar/buscar las
entradas vendidas (con polling cada 5s) para ver su estado — no hay lector
de cámara ni ninguna llamada a un endpoint de validación/canje de QR. Si se
pide agregar esa función, es trabajo nuevo, no algo que ya exista y haya que
encontrar.

**Polling en vez de websockets.** `Orders.tsx`, `ContentPurchases.tsx` y
`Tickets.tsx` (una vez seleccionado un evento) refrescan sus listas con
`setInterval(..., 5000)`, con una variante `showLoader=false` para que el
refresh de fondo no parpadee el spinner ni pise el modal de detalle
abierto (el `selected`/`selectedTicket` se resincroniza contra el resultado
del fetch en vez de perderse).

**Comprobantes de transferencia se sirven fuera del prefijo `/api/v1`.**
`transferProofUrl` (en `Orders.tsx`) y su equivalente en
`ContentPurchases.tsx` llegan como ruta relativa (ej.
`/uploads/transfer-proofs/x.png`) porque el backend los sirve fuera del
prefijo de API. Ambas pantallas reconstruyen un `FILES_BASE_URL` quitándole
el sufijo `/api/v1` a `VITE_API_BASE_URL` para armar el link "Ver
comprobante". Si cambia el prefijo de API en el backend, hay que tocar esta
regex en los dos archivos.

**Flujo de aprobación de transferencias** (`Orders.tsx` para entradas,
`ContentPurchases.tsx` para contenido/streaming pay-per-view): filtra por
`paymentMethod=BANK_TRANSFER` y `status`, y al aprobar/rechazar pega a
`PATCH /orders/:id/validate-transfer` o
`PATCH /content-purchases/:id/validate-transfer` con `{ approve,
rejectionReason }` — el motivo de rechazo es obligatorio solo si se rechaza.

**Los formularios de Eventos y Contenido tienen flags de acceso no
excluyentes entre sí**, reflejando el modelo del backend: "gratis para
usuario logueado", "incluido en suscripción" y "vendible por separado
(pay-per-view)" son tres checkboxes independientes, no un `<select>` — un
mismo evento/grabación puede combinar los tres modos (ver el texto de ayuda
inline en `Events.tsx` y `Content.tsx`).

**Categorías y Adicionales son siempre relativos a un evento seleccionado**
(`Categories.tsx`, `Addons.tsx` piden elegir evento en un `<select>` antes de
poder listar/crear), y sus listados usan endpoints `/admin` específicos
(`/events/:id/categories/admin`, `/events/:id/addons/admin`) que
presumiblemente devuelven también las categorías/adicionales inactivos
(a diferencia de los endpoints públicos). Borrar una categoría o adicional
con ventas ya registradas no la elimina, la desactiva (`isActive: false`) —
el mensaje de confirmación de `window.confirm` lo advierte explícitamente.

**Las variantes de un adicional (talles) solo se agregan una vez creado el
adicional.** Al crear, se puede precargar una lista separada por comas
(`variantsCsv`, ej. "S,M,L,XL"); para editar variantes después hay que abrir
el modal de edición, que expone altas/bajas individuales
(`POST /addons/:id/variants`, `DELETE /addons/variants/:id`) — borrar una
variante con ventas falla (capturado y mostrado como alert genérico, no
distingue el motivo real del error del backend).

**`VITE_API_BASE_URL` en `.env` apunta a producción por defecto**, no a
`localhost:3000` (`.env` está commiteado, no en `.gitignore`, y trae
`https://invsshowsbackend-production.up.railway.app/api/v1`). Es intencional
porque `VITE_*` termina bundleado en el cliente igual que cualquier config
pública, pero implica que correr `npm run dev` local sin pisar esa variable
pega contra el backend de Railway en producción, no contra un backend
local.

## Despliegue

- **Vercel** hostea el build estático. `vercel.json` tiene un rewrite SPA
  (`/(.*)` → `/index.html`) agregado después de notar que refrescar en una
  ruta interna (ej. `/orders`) devolvía 404 sin él.
- El login precargaba credenciales de admin hardcodeadas
  (`admin@invs.app` / `Admin123!`) en el estado inicial del form — se sacó
  explícitamente (commit "Quitar credenciales de admin precargadas"); no
  reintroducir defaults de credenciales en `Login.tsx`.
