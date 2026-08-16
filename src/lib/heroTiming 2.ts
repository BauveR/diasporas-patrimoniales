// Shared between PointsToShapes (drives the particle swirl→shape blend) and
// HeroWordmark (times its line-3 reveal off the same moment) — kept in its
// own module so neither component has to import the other just for these
// two numbers, which would create a circular import.
export const FORM_START = 1.2
export const FORM_DURATION = 2.3
