const VARIANTS = {
  primary: 'bg-zinc-900 text-white shadow-sm shadow-zinc-900/10 hover:bg-zinc-800 disabled:bg-zinc-400',
  secondary: 'border border-zinc-200 bg-white text-zinc-800 shadow-sm shadow-zinc-900/[0.03] hover:border-zinc-300 hover:bg-zinc-50 disabled:text-zinc-400',
  ghost: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 disabled:text-zinc-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  accent: 'bg-accent-600 text-white shadow-sm shadow-accent-700/20 hover:bg-accent-500 disabled:bg-accent-200',
  outlineDark: 'border border-white/15 text-zinc-100 hover:border-white/35 hover:bg-white/5',
}

const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-[15px] gap-2',
}

/** Shared button look: colour transitions on the signature curve and a slight press-in. */
export function buttonClasses({ variant = 'primary', size = 'md', className = '' } = {}) {
  return `inline-flex shrink-0 select-none items-center justify-center rounded-lg font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out-expo active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`
}
