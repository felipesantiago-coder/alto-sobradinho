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
 * Example: User types "1000" → displays "1.000" → onChange receives "1000"
 * 
 * IMPORTANT: The onChange callback always receives a clean numeric string without formatting.
 * This ensures calculations work correctly regardless of display format.
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

  // Parse any value to a number
  const parseToNumber = (val: string | number): number => {
    if (typeof val === 'number') return val
    if (!val || val.trim() === '') return 0
    
    // Remove any non-numeric characters except decimal separators
    // Handle both Brazilian format (1.000,00) and international format (1,000.00)
    let cleaned = val.toString().trim()
    
    // Check if it's Brazilian format (has both . and , or just , as decimal)
    const hasComma = cleaned.includes(',')
    const hasDot = cleaned.includes('.')
    
    if (hasComma && hasDot) {
      // Brazilian format: 1.000,50 → remove dots, replace comma with dot
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else if (hasComma) {
      // Could be Brazilian decimal (1000,50) or international thousands (1,000)
      const parts = cleaned.split(',')
      if (parts[1] && parts[1].length <= 2) {
        // Brazilian decimal: 1000,50
        cleaned = cleaned.replace(',', '.')
      } else {
        // International thousands: 1,000
        cleaned = cleaned.replace(',', '')
      }
    }
    // If only has dot, it's already in standard format (1000.50 or 1.000)
    // JavaScript's parseFloat handles this correctly
    
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }

  // Convert a number to a formatted display string (Brazilian format)
  const formatToDisplay = (val: string | number): string => {
    if (val === '' || val === null || val === undefined) return ''
    
    const numValue = parseToNumber(val)
    if (numValue === 0 && (val === '' || val === '0')) return ''
    if (isNaN(numValue)) return ''
    
    // Check if the number has significant decimal places
    const hasDecimals = numValue % 1 !== 0
    
    // Format with Brazilian locale (no currency symbol)
    return numValue.toLocaleString('pt-BR', {
      minimumFractionDigits: hasDecimals ? decimalPlaces : 0,
      maximumFractionDigits: decimalPlaces
    })
  }

  // Parse display value to raw number string (what gets passed to onChange)
  const parseToRawString = (displayVal: string): string => {
    if (!displayVal || displayVal.trim() === '') return ''
    
    const numValue = parseToNumber(displayVal)
    if (isNaN(numValue) || numValue === 0) return ''
    
    // Return as clean numeric string (no formatting)
    // Use the actual number to avoid any formatting issues
    return numValue.toString()
  }

  // Update display value when external value changes (only when not focused)
  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatToDisplay(value))
    }
  }, [value, isFocused])

  // Handle focus - show raw number for easier editing
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    
    // Show the raw numeric value while editing
    // This makes it easy for users to edit without dealing with formatting
    if (value !== '' && value !== null && value !== undefined) {
      const numValue = parseToNumber(value)
      if (numValue !== 0) {
        setDisplayValue(numValue.toString())
      } else {
        setDisplayValue('')
      }
    }
    
    props.onFocus?.(e)
  }

  // Handle blur - format the display value
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    
    // Format the value for display
    const formatted = formatToDisplay(displayValue)
    setDisplayValue(formatted)
    
    props.onBlur?.(e)
  }

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value
    
    // Allow only digits, comma, dot, and minus sign
    inputValue = inputValue.replace(/[^\d,.-]/g, '')
    
    // Ensure only one decimal separator
    const commaIndex = inputValue.indexOf(',')
    const dotIndex = inputValue.indexOf('.')
    
    if (commaIndex !== -1 && dotIndex !== -1) {
      // Has both - keep only comma (Brazilian format)
      inputValue = inputValue.replace(/\./g, '')
    }
    
    // Ensure only one comma (decimal separator)
    const parts = inputValue.split(',')
    if (parts.length > 2) {
      inputValue = parts[0] + ',' + parts.slice(1).join('')
    }
    
    setDisplayValue(inputValue)
    
    // Call onChange with the raw numeric value (clean string)
    const rawValue = parseToRawString(inputValue)
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
