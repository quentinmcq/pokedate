const FOLDED_BOX_PROPERTIES = [
  'height',
  'paddingTop',
  'paddingBottom',
  'marginBottom',
  'borderTopWidth',
  'borderBottomWidth',
] as const

// Folds an element away, margin and borders included, so the content below slides up instead of jumping.
export function collapseElement(element: Element, done: () => void) {
  const row = element as HTMLElement
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return done()
  const style = getComputedStyle(row)
  row.style.overflow = 'hidden'
  row
    .animate(
      [
        {
          ...Object.fromEntries(FOLDED_BOX_PROPERTIES.map((property) => [property, style[property]])),
          height: `${row.offsetHeight}px`,
          opacity: 1,
          transform: 'scale(1)',
        },
        {
          ...Object.fromEntries(FOLDED_BOX_PROPERTIES.map((property) => [property, '0px'])),
          opacity: 0,
          transform: 'scale(0.96)',
        },
      ],
      { duration: 450, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'forwards' },
    )
    .finished.then(done, done)
}
