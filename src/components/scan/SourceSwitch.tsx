export interface SourceOption<T extends string> {
  value: T
  label: string
  disabled?: boolean
  hint?: string
}

/** Segmented control for choosing a document source. */
export default function SourceSwitch<T extends string>({ value, options, onChange }: {
  value: T
  options: SourceOption<T>[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex bg-ns-page border border-ns rounded-lg p-1 mb-4 shrink-0" role="tablist">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          disabled={o.disabled}
          title={o.disabled ? o.hint : undefined}
          onClick={() => !o.disabled && onChange(o.value)}
          className={`flex-1 py-2 px-1 rounded-md text-xs font-medium transition whitespace-nowrap ${
            o.disabled
              ? 'text-ns-faint/50 cursor-not-allowed opacity-60'
              : value === o.value
                ? 'bg-blue-600 text-white cursor-pointer'
                : 'text-ns-muted hover:text-ns-primary cursor-pointer'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
