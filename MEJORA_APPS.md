Eres un experto en desarrollo de apps educativas frontend-only (Vue 3 + Tailwind CSS + Vite + GitHub Pages, sin backend, datos en LocalStorage/IndexedDB). Tu misión es mejorar esta app siguiendo las lecciones aprendidas del proyecto MapaConvivencia.

## Principios generales

### Público objetivo: docentes (no técnicos)
- No asumas que saben navegar menús complejos. Todo debe ser visible, directo, con iconos + texto.
- Prefieren tocar a leer. Los botones grandes, FAB, tabs visibles, semáforos, son mejor que texto instructivo.
- Quieren ver valor antes de comprometerse: datos de prueba con 1 clic, copia rápida de resúmenes, exportación simple.
- Trabajan en entornos diversos: ordenador, tablet, pizarra digital. Touch targets mínimos de 44px.

### Arquitectura de datos (local-first, sin servidor)
- Estado global: singleton `reactive({})` sin Pinia/Vuex. Un solo `useStore()` que todos los componentes importan.
- Persistencia: `localStorage` bajo una sola clave. Llamar `persist()` tras cada mutación.
- Sin cuentas, sin backend, sin cookies. GDPR cumplido por diseño.
- Exportar/importar como JSON para portabilidad total.
- Separar configuración LLM-editable en `src/config/`: i18n, templates, tipos de datos. Así un agente IA puede editarlos sin tocar componentes lógicos.
- Componer lógica en composables (useStore, useModal, useInstall, icons).

### UI/UX para profesorado
- **FAB** (Floating Action Button) para la acción principal. Siempre visible.
- **Tab bar** superior con iconos + texto. Sin hamburguesa, sin navegación oculta.
- **Semáforo** (rojo-amarillo-verde) como indicador rápido de estado.
- **Botón "Copiar resumen"** — que puedan pegar en informes/email, sin exportar.
- **Datos de prueba** visibles y accesibles. Un botón prominente (verde, texto blanco).
- **Wizard de ayuda** al primer inicio, con pasos, anterior/siguiente/puntos. Siempre reabrible.
- **Toast** para feedback, no `alert()`.
- **Atajos de teclado** (1-6 para pestañas, Escape para modales).
- **Modo oscuro** para proyectores en aulas oscuras.
- **Modo bilingüe** (español por defecto, inglés opcional). Selector de idioma tipo `<select>`.

### Organización del código
```
src/
  main.js
  style.css              — Tailwind v4 (@theme, @custom-variant dark, CSS vars)
  App.vue                — shell, tabs, help wizard, atajos teclado
  config/
    i18n.js              — traducciones ES/EN con claves camelCase
    templates.js          — plantillas de layout (nombres en español)
    layerTypes.js         — definiciones de tipos, severidad, opciones
  composables/
    useStore.js           — store singleton reactivo + CRUD + persistencia
    icons.js              — SVG inline (sin dependencias)
    useModal.js           — helpers para modales
    useInstall.js         — detección/instalación PWA
  components/
    AppHeader.vue         — cabecera con logo, idioma, modo oscuro, ayuda
    // componentes específicos de la app
```

### Patrones de componentes probados

#### Toggle switch (funcional en todos los navegadores)
NO uses `peer-checked:after:translate-x` — falla en algunos navegadores.
Usa este patrón:
```html
<div class="w-12 h-7 rounded-full relative transition-colors duration-200 cursor-pointer"
  :class="enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'"
  @click="toggle">
  <span class="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all duration-200"
    :style="{ left: enabled ? '24px' : '2px' }"></span>
</div>
```

#### Modal
```html
<div v-if="showX" class="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showX = false">
  <div class="bg-[var(--color-card)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
    <!-- contenido -->
  </div>
</div>
```

#### Mapa/rejilla con calor
- Color base de cada zona siempre visible (pasteles: `#e0f2fe`, `#fef3c7`, `#dcfce7`, etc.)
- Calor como overlay gradiente (`background: linear-gradient(...)`), sin reemplazar el color base.
- Badge "+" en zonas vacías.
- Selector de capa: pills con círculo de color + nombre.
- Contador mostrado en el color de la capa.

#### Dashboard
- Cards resumen: total, zona más activa, tendencia, último registro.
- Barras de desglose por gravedad con colores.
- Alertas de zonas críticas.
- Selector de período: pills 7/14/30 días.
- Botón "Copiar resumen".
- Semáforo circular con barra de progreso.

#### Formulario dinámico
- Diferentes campos según el tipo de capa: selectores de subtipo, emojis para emociones, numérico 1-5, campos de texto.
- Botones tipo pill para selección única con clases `.toggle-btn`, `.toggle-btn-active`, `.toggle-btn-inactive`.

### CSS y estilos
- Tailwind v4 CSS-first: `@theme {}` en `style.css`, NO `tailwind.config.js`.
- Variables CSS para theming: `--color-bg`, `--color-card`, `--color-border`, `--color-text`, `--color-accent`, etc.
- Modo oscuro: clase `.dark` en `<html>`, `@custom-variant dark (&:where(.dark, .dark *))`.
- Sin estilos scoped — todo con utilidades Tailwind + CSS vars.
- `body { text-wrap: pretty; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }`
- `prefers-reduced-motion: reduce` desactiva animaciones.
- Clases reutilizables: `.toggle-btn`, `.btn-primary`, `.card-hover`, `.tab-fade-in`, `.icon-svg`, `.no-print`.

### i18n
- Archivo único `src/config/i18n.js` con objeto `{ es: { ... }, en: { ... } }`.
- Claves en camelCase.
- Textos visibles siempre con `t('clave')`.
- Añadir nuevas claves siempre en ambos idiomas.

### PWA
- Service worker en `public/sw.js` con lista de caché actualizable.
- Manifest en `public/manifest.json` con `theme_color`, iconos, nombre.
- Banner de instalación con animación slide-up en App.vue.

---

## Tarea específica

Revisa la app actual y aplícale todos estos patrones. En concreto:
1. ¿Tiene FAB para la acción principal? Si no, añádelo.
2. ¿La navegación es visible con iconos+texto? Sin hamburguesas.
3. ¿Hay datos de prueba accesibles con 1 clic?
4. ¿Los toggles usan el patrón `<div>` + `:style="{ left }"`? (NO `peer/after:translate-x`)
5. ¿Los modales siguen el patrón estándar?
6. ¿Las zonas/items tienen colores base + overlay?
7. ¿El dashboard tiene semáforo, resumen copiable, selector de período?
8. ¿Toast para feedback en lugar de alert()?
9. ¿Atajos de teclado (1-6, Escape)?
10. ¿Dark mode con CSS vars y clase `.dark`?
11. ¿i18n con `t('key')`? ¿Config extraída a `src/config/`?
12. ¿Import/export JSON?
13. ¿Touch targets ≥ 44px?
14. ¿`prefers-reduced-motion`?
15. ¿Modo impresión con `.no-print`?

Devuélveme el plan de mejoras con los cambios concretos a realizar (ficheros, líneas, patrones a usar).