/** Minimal table primitives. Wide tables scroll horizontally inside their card on small screens. */
export function Table({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">{children}</table>
    </div>
  )
}

export function Th({ children, align = 'left', className = '' }) {
  return (
    <th scope="col" className={`whitespace-nowrap border-b border-zinc-100 bg-zinc-50/60 px-4 py-2.5 text-xs font-medium text-zinc-500 ${align === 'right' ? 'text-right' : ''} ${className}`}>
      {children}
    </th>
  )
}

export function Td({ children, align = 'left', className = '' }) {
  return (
    <td className={`border-b border-zinc-100 px-4 py-3 align-middle text-zinc-700 ${align === 'right' ? 'text-right tabular' : ''} ${className}`}>
      {children}
    </td>
  )
}

export function Tr({ children, onClick, className = '' }) {
  return (
    <tr onClick={onClick} className={`transition-colors duration-150 ${onClick ? 'cursor-pointer hover:bg-zinc-50/80' : ''} last:[&>td]:border-0 ${className}`}>
      {children}
    </tr>
  )
}
