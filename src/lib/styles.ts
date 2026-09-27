// "Open Sans" nunca se cargó como webfont real en este sitio (sin
// @font-face ni link de Google Fonts) — en la práctica cae al sans-serif
// del sistema en todos los navegadores. Se mantiene declarado a propósito
// (no un objeto vacío) por si se agrega la fuente real más adelante; hasta
// entonces, un solo lugar en vez de las ~22 copias literales que tenía
// antes repartidas por componentes.
export const labelStyle = { fontFamily: "'Open Sans', sans-serif" }
