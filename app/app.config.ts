export default defineAppConfig({
  ui: {
    colors: {
      primary: 'neutral',
      neutral: 'stone',
      success: 'green',
      warning: 'amber'
    },
    button: {
      slots: {
        base: 'rounded-flow font-medium transition-all duration-300 ease-flow'
      },
      defaultVariants: {
        size: 'md'
      }
    },
    card: {
      slots: {
        root: 'rounded-flow-lg border border-default bg-elevated shadow-xs ring-1 ring-default/40 dark:ring-default/25'
      }
    },
    header: {
      slots: {
        root: 'border-b border-default bg-default/80 backdrop-blur-sm'
      }
    },
    footer: {
      slots: {
        root: 'border-t border-default bg-muted/40'
      }
    }
  }
})
