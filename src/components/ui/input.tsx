
import * as React from "react"

import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Input component for text entry.
 * 
 * Use this component for regular forms where there's adequate container padding.
 * For inputs inside modals or dialogs where the focus ring might get clipped at the edges,
 * consider using the ModalInput component instead.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-museio-purple-light focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-gray-300",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
