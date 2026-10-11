import { Loader2 } from 'lucide-react'
import { Link } from 'react-router'
import { buttonClasses } from './buttonClasses'


export function Button({ variant, size, loading = false, icon: Icon, children, className, disabled, type = 'button', ...props }) {
  return (
    <button type={type} disabled={disabled || loading} className={buttonClasses({ variant, size, className })} {...props}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon && <Icon className="size-4" />}
      {children}
    </button>
  )
}

export function ButtonLink({ variant, size, icon: Icon, children, className, ...props }) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {Icon && <Icon className="size-4" />}
      {children}
    </Link>
  )
}
