'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, 'value' | 'onChange'> {
  value: string | number
  onChange: (value: string) => void
  decimalPlaces?: number
}

/**
 * Input component that formats values as Brazilian currency (without R$ symbol)
 * in real-time while providing the raw numeric value for calculations.
 * 
 * Example: User types "1000" → displays "1.000,00" → onChange receives "1000"
 */
function CurrencyInput({ 
  value, 
  onChange, 
  decimalPlaces = 2,
  className, 
  ...props 
}: CurrencyInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [displayValue, setDisplayValue] = React.useState('')
  const [isFocused, setIsFocused] = React.useState(false)

  // Convert a number or string to a formatted display string
  const formatToDisplay = (val: string | number): string => {
    if (val === '' || val === null || val === undefined) return ''
    
    // Parse the value to a number
    let numValue: number
    if (typeof val === 'string') {
      // Remove any non-numeric characters except decimal point and comma
      const cleaned = val.replace(/[^\d,.-]/g, '').replace(',', '.')
      numValue = parseFloat(cleaned)
    } else {
      numValue = val
    }
    
    if (isNaN(numValue)) return ''
    
    // Format with Brazilian locale (no currency symbol)
    return numValue.toLocaleString('pt-BR', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    })
  }

  // Parse display value to raw number string
  const parseToRaw = (displayVal: string): string => {
    if (!displayVal) return ''
    // Remove thousand separators (.) and replace decimal comma with dot
    const cleaned = displayVal.replace(/\./g, '').replace(',', '.')
    const numValue = parseFloat(cleaned)
    return isNaN(numValue) ? '' : numValue.toString()
  }

  // Update display value when external value changes
  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatToDisplay(value))
    }
  }, [value, isFocused])

  // Handle focus - show raw value for easier editing
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    // Show raw number without formatting for easier editing
    if (value !== '' && value !== null && value !== undefined) {
      let rawValue: string
      if (typeof value === 'number') {
        rawValue = value.toString()
      } else {
        // Clean the value
        rawValue = value.replace(/[^\d,.-]/g, '').replace(',', '.')
      }
      setDisplayValue(rawValue)
    }
    props.onFocus?.(e)
  }

  // Handle blur - format the display value
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    const rawValue = parseToRaw(displayValue)
    const formatted = formatToDisplay(rawValue)
    setDisplayValue(formatted)
    props.onBlur?.(e)
  }

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value
    
    // Allow only digits, comma, and dot
    inputValue = inputValue.replace(/[^\d,.-]/g, '')
    
    // Ensure only one decimal separator (comma)
    const parts = inputValue.split(/[,.]/)
    if (parts.length > 2) {
      inputValue = parts[0] + ',' + parts.slice(1).join('')
    }
    
    // Replace dot with comma for Brazilian format
    inputValue = inputValue.replace('.', ',')
    
    setDisplayValue(inputValue)
    
    // Call onChange with the raw numeric value
    const rawValue = parseToRaw(inputValue)
    onChange(rawValue)
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "text-right",
        className
      )}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  )
}

export { CurrencyInput }
