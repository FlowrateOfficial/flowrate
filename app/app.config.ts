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
        base: 'rounded-flow font-medium transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]'
      },
      defaultVariants: {
        size: 'md'
      }
    },
    card: {
      slots: {
        root: 'rounded-flow-lg border border-flow-border dark:border-flow-border-dark bg-flow-card dark:bg-flow-card-dark shadow-[0_1px_2px_rgba(25,25,25,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]'
      }
    },
    header: {
      slots: {
        root: 'border-b border-flow-border/60 dark:border-flow-border-dark/60 bg-flow-bg/80 dark:bg-flow-bg-dark/80 backdrop-blur-sm'
      }
    },
    footer: {
      slots: {
        root: 'border-t border-flow-border/60 dark:border-flow-border-dark/60 bg-flow-secondary/30 dark:bg-flow-secondary-dark/30'
      }
    }
  }
})
