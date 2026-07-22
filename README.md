# MapaConvivencia

**Mapas de calor para convivencia escolar** — herramienta gratuita, sin servidor, PWA, para que centros educativos registren y visualicen datos de convivencia.

Todos los datos se almacenan únicamente en tu navegador. No hay cuentas, no hay servidor, cero cookies.

## Demo

[Usar MapaConvivencia](https://sergarb1.github.io/MapaConvivencia/) — funciona directamente en el navegador, sin instalación.

## Funcionalidades

- **Mapa de calor interactivo** — haz clic en cualquier zona para añadir un registro al instante
- **8 capas predefinidas**: Incidencias, Participación, Clima emocional, Presencia docente, Ruido, Conductas positivas, Recursos, Ciberacoso
- **Capas personalizadas** — crea tus propios tipos de datos (numérico, emocional, texto libre)
- **Editor de zonas** — define la distribución del centro con plantillas (aula filas/grupos/U, centro escolar, instituto, pasillos, polideportivo, comedor) o crea zonas a medida
- **Registro rápido** — FAB flotante para añadir registros sin cambiar de vista
- **Estadísticas** — semáforo de convivencia, gráfico por zonas, evolución semanal, desglose emocional, parte de hoy
- **Filtros** — filtra registros por zona, tipo y fecha
- **Exportación/Importación JSON** — copia de seguridad completa
- **Impresión** — genera informes imprimibles
- **Datos de prueba** — genera registros de ejemplo para explorar la app
- **PWA** — instalable en dispositivos, funciona sin conexión
- **Modo oscuro** y **bilingüe** (español/inglés)
- **Atajos de teclado** — teclas 1-6 para cambiar de pestaña, Escape para cerrar modales

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | **[Vue 3](https://vuejs.org/)** (`<script setup>`, Composition API) |
| Estilos | **[Tailwind CSS 4](https://tailwindcss.com/)** (configuración CSS-first con `@theme`) |
| Build | **[Vite 8](https://vitejs.dev/)** |
| Persistencia | **localStorage** (clave: `mapaconvivencia`) |
| Estado | **Reactive API** (singleton sin Pinia/Vuex) |
| i18n | **Inline** en archivo de configuración |
| Tipos | **JavaScript** (sin TypeScript) |
| PWA | Service Worker + manifest.json |
| Despliegue | **GitHub Pages** (estático) |

## Empezar

```bash
# Clonar
git clone https://github.com/sergarb1/MapaConvivencia.git
cd MapaConvivencia

# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Producción
npm run build     # → dist/
npm run preview   # Vista previa local del build
```

## Estructura del proyecto

```
src/
├── main.js                  # Punto de entrada
├── App.vue                  # Shell: tabs, help modal, atajos teclado
├── style.css                # Tailwind v4 + CSS vars + clases reutilizables
├── config/                  # Configuración extraída para mantenibilidad
│   ├── i18n.js              # Traducciones ES/EN
│   ├── templates.js         # Plantillas de mapa (aula, centro, instituto...)
│   └── layerTypes.js        # Tipos de incidencias, emociones, plataformas
├── composables/             # Lógica reutilizable
│   ├── useStore.js          # Estado singleton, CRUD, heatmap, persistencia
│   ├── useInstall.js        # Detección e instalación PWA
│   ├── useLayerLabel.js     # Resolución de nombre de capa
│   ├── useModal.js          # Control de modales open/close/toggle
│   └── icons.js             # Iconos SVG inline
└── components/
    ├── AppHeader.vue        # Cabecera: logo, idioma, modo oscuro, importar, reiniciar
    ├── HeatMap.vue          # Mapa de calor con cuadrícula de zonas
    ├── IncidentForm.vue     # Formulario modal para añadir/editar registros
    ├── IncidentList.vue     # Lista de registros con filtros y edición
    ├── ZoneEditor.vue       # Editor de zonas con plantillas
    ├── LayerPanel.vue       # Gestión de capas (activar, visibilidad, crear)
    ├── Dashboard.vue        # Panel de estadísticas visuales
    ├── ExportPanel.vue      # Exportar/importar JSON, imprimir, datos de prueba
    └── RegistroRapido.vue   # FAB flotante para registro rápido
```

## Arquitectura

MapaConvivencia sigue una arquitectura **single-page** sin router — las vistas se alternan mediante un `ref('map')`. El estado global es un **singleton reactivo** (Vue `reactive`) exportado por `useStore.js`, que se comparte en todos los componentes sin necesidad de Pinia.

Los datos se persisten automáticamente en localStorage tras cada mutación. No hay backend ni llamadas de red.

### Flujo de datos

1. El usuario interactúa con un componente (ej: clic en zona del mapa)
2. El componente llama a un método del store (`addRecord`, `toggleLayer`, etc.)
3. El store muta el objeto `state` reactivo
4. El store llama a `persist()` que serializa a localStorage
5. Vue re-renderiza automáticamente los componentes afectados

## Convenciones para desarrollo

- Todos los componentes usan `<script setup>`, sin Options API
- CSS: Tailwind utility classes + CSS vars (`--color-*`), sin scoped styles
- No TypeScript
- `t('key')` para texto visible al usuario
- `persist()` tras cada mutación del estado
- Capas (layers): `incidents`, `participation`, `emotion`, `presence`, `noise`, `positive`, `resources`, `cyber`
- Zonas con propiedades `x, y, w, h` en cuadrícula
- Modales con patrón `fixed inset-0 bg-black/40 backdrop-blur-sm`

## Privacidad y licencia

- **Privacidad total**: todos los datos permanecen en tu navegador (localStorage). No hay cuentas, no hay servidor, no hay cookies de seguimiento. Cumple con LOPDGDD y GDPR.
- **Código abierto** bajo **AGPL v3**. Siempre gratuito.

## Repositorio

[github.com/sergarb1/MapaConvivencia](https://github.com/sergarb1/MapaConvivencia)