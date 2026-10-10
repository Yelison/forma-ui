## Commits

Los de la ficha, en inglés, Conventional Commits; **la tarea se fusiona con squash** (un solo commit en `main`, con la serie en su cuerpo), así que basta con que **la punta** pase todas las comprobaciones: haz commits pequeños y legibles, pero no hace falta que cada uno pase por sí solo. **Solo si la ficha dice «fusión con rebase»**, cada commit tiene que pasar por sí solo las comprobaciones de su capa (todos llegan a `main`): compruébalo **una vez, al final**, antes de la última entrega, no en cada ronda. Trailer: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Identidad de git ya configurada. **Sin push ni PR.** Formatea solo tus archivos (Prettier sobre las rutas autorizadas, nunca sobre un directorio de código entero: reformatearía archivos ajenos o generados).

## Uso de la máquina (varios agentes en paralelo)

- **Tus puertos** (slot `__SL__`): sitio y Vite `__VITE__`, Playwright `__PW__`, Storybook `__SB__`. No uses otros ni toques procesos que no arrancaste. Están también en `.env.herdr`, pero puede que el modo automático no te deje leerlo: pásalos en línea (`PLAYWRIGHT_PORT=__PW__ npx playwright test --workers=2`).
- **No ejecutes la batería completa de Playwright sobre la base**: es lenta y la base no es lo que se revisa. Para confirmar la base basta Vitest.
- **Nunca la batería completa de e2e o de navegador en local:** ejecuta solo las specs que tu cambio puede afectar y lístalas en la entrega; la completa la ejecuta la CI en el PR.
- **Candado común de la máquina:** toda ejecución pesada (Playwright, vitest en navegador, axe, `npm run build`, `pack:check`, `pack:reproducible`, `check:consumer` y cada comprobación por commit con `git archive` + `npm ci`) va detrás de `flock /tmp/herdr-heavy.lock nice -n 10 <orden>`. El candado lo comparten Resolve y Forma UI: si está tomado, espera.
- Playwright y vitest en navegador con `--workers=1` / `--maxWorkers=1` por línea de órdenes; vitest jsdom con `--maxWorkers=2`: la máquina la comparten varios agentes y sin límite la carga se dispara. Si un test falla solo bajo carga, repítelo aislado antes de tocar código y anótalo en la entrega.

## Mutaciones y órdenes peligrosas

- **Antes de mutar código para comprobar un test, haz commit** (o guarda una copia del archivo en tu scratchpad) y restaura desde ese commit o esa copia. Nunca restaures con `git checkout -- <archivo>` sobre un archivo con cambios sin commitear: se ha perdido trabajo así.
- En cualquier `rm`, usa rutas literales o variables protegidas (`"${DIR:?}"/x`): una orden con una variable que podría quedar vacía se queda esperando aprobación y, sin nadie mirando, se deniega y te atasca.
- No toques procesos que no arrancaste y nunca uses `pkill -f` ni `pgrep -f`: para lo tuyo, por PID. Antes de entregar, comprueba que los puertos de tu slot están libres.

## Idioma (CLAUDE.md, «Language and URLs»)

- Ningún texto visible fijo en un solo idioma: contenido, `aria-label`, tooltips, anuncios de regiones vivas, `<title>` y meta descripción.
- Los textos del sitio pasan por el mecanismo de i18n, con español e inglés añadidos a la vez; una página no está terminada con un solo idioma. Plurales con ICU y fechas y números con `Intl`; nunca frases construidas por concatenación. Respeta el glosario de términos fijos (nombres de componentes, `token`, `variant`; Forma UI no se traduce).
- Los componentes de la biblioteca reciben sus textos internos (etiqueta de cierre de un diálogo, de carga de un botón…) por props o provider, con valores por defecto en inglés.
- URL y slugs en inglés e iguales en los dos idiomas; el idioma nunca cambia una ruta.
- Cuando añadas o cambies texto, comprueba el resultado con el pseudo-idioma (textos que faltan y desbordes a 320 px).
- Documentación del repositorio, código, commits y planes, en inglés.

## Calidad (proyecto de portafolio)

Forma UI forma parte de un portafolio público: el código se lee tanto como se usa. La calidad, la estructura y la optimización son requisitos, no extras.

- **Estructura:** módulos pequeños con una sola responsabilidad; un componente por carpeta con su CSS, sus tests y su `index.ts`; sin código muerto, sin duplicación y sin abstracciones especulativas.
- **Nombres:** claros y del dominio, en inglés; sin abreviaturas crípticas.
- **Tipos:** API pública tipada con JSDoc en cada prop exportada; sin `any`, sin `as` innecesarios y sin `@ts-ignore`. Los tipos se exportan junto a los componentes.
- **React:** sin re-renders innecesarios (estado colocado donde se usa, callbacks estables solo cuando importan) y sin efectos donde basta el render. Refs y eventos nativos antes que estado.
- **CSS:** tokens y no literales; selectores planos de CSS Modules; sin `!important`; sin estilos globales desde la biblioteca.
- **Peso:** nada que impida el tree-shaking (sin efectos secundarios al importar, exports con nombre). Comprueba que el peso del build no crece sin motivo y anótalo en la entrega.
- **Tests:** se leen como documentación del comportamiento. Consultas por rol y nombre accesible, sin detalles de implementación ni snapshots grandes.
- **Comentarios:** explican el porqué, no el qué, al nivel de los del repositorio.

## Comprobar la punta y, solo con rebase, cada commit

Con squash comprueba la punta con las órdenes de la ficha. Solo si la ficha dice «fusión con rebase», comprueba además cada commit, **una vez, al final** y no en cada ronda, con una orden literal propia, en un directorio nuevo: `D=$(mktemp -d <scratchpad>/c1.XXXXXX) && git archive <sha> | tar -x -C "$D" && cd "$D" && npm ci && npm run …`. Usa una llamada por commit, sin `rm`, sin funciones de shell y sin `bash -c` con órdenes guardadas en variables (el clasificador de permisos los bloquea). Los directorios temporales se pueden quedar.

## Autocomprobación antes de entregar

Los revisores encuentran casi siempre estos defectos (`AGENTS.md`, «Self-check before delivering»). Compruébalos tú y cita la evidencia en la entrega:

- **Tests que fallan sin su arreglo:** para cada test nuevo, una mutación que lo hace fallar (anótala). Un test que pasa sin el cambio no cuenta.
- **Sin saltos de layout** cuando llegan los datos o cambia un filtro; el espacio se reserva con la altura real, no con números mágicos.
- **Anchos:** 320, 390, 767, 768, 1024, 1199, 1200 y 1440 px, en los temas claro y oscuro: sin scroll horizontal ni textos recortados.
- **Foco:** nunca en `body`; tras cerrar un diálogo o perder el disparador, el foco va a un sitio con sentido, y con teclado se llega a todo con foco visible.
- **Anuncios:** errores, avisos y cambios de estado asíncronos en una región viva o asociados al campo (`aria-describedby`).
- **Todos los estados:** carga, vacío, error con reintento, deshabilitado y de solo lectura (son estados distintos), cada uno con su test.
- **Una mutación por test nuevo**, anotada en la entrega.
- **Idioma:** las reglas de la sección anterior, con el pseudo-idioma pasado.
- **Commits:** la punta pasa todo, y si un cambio rompe un test, el test cambia en el mismo commit. Con «fusión con rebase», además, cada commit pasa por sí solo (comprobado una vez, al final).
- **Rondas de corrección:** verifica en la punta el arreglo de esa ronda y lo que puede afectar; no repitas baterías ni comprobaciones por commit que el arreglo no cambia.
- **Changeset:** todo cambio visible para quien usa el paquete lleva su changeset (`npm run changeset`; ver `CONTRIBUTING.md`). Si el cambio toca el paquete pero no cambia nada para quien lo instala, decláralo con `npx changeset --empty`: el job `Changeset` lo exige.

## Entrega

`__DELIVERY__`, siguiendo la plantilla `scripts/herdr/delivery.template.md` del repositorio si existe en tu base (si no, con estas secciones): comportamiento, archivos, commits (`git log --oneline __BASEFULL__..HEAD`), pruebas con cifras, demostración de que los tests nuevos fallan sin su cambio, esfuerzo usado, limitaciones, decisiones pendientes y `git status --short`. Termina con `ENTREGA __LANE__: LISTA` o `BLOQUEO __LANE__: <motivo>`.

## Comunica al coordinador

Escribe `blocked.md` y termina con `BLOQUEO __LANE__: …` si necesitas un archivo reservado o una dependencia, si un test falla en el commit base, si el plan contradice el código de forma que cambie el alcance, o si un paso pide permisos o configuración global. No ejecutes `/effort` con ningún nivel ni elijas una fila en `/advisor`. Nunca uses `rm` con variables que puedan quedar vacías. Nunca uses `git reset --hard`, `git checkout -- .` ni `git clean`, tampoco para reordenar commits: usa `git rebase -i` con `edit` o `fixup`, y para deshacer un cambio no confirmado, `git restore <archivo>` sobre un archivo concreto. Limpia tus procesos al terminar.
