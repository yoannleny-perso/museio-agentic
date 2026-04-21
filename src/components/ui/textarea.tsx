
import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Textarea component for multi-line text entry.
 * 
 * Use this component for regular forms where there's adequate container padding.
 * For textareas inside modals or dialogs where the focus ring might get clipped at the edges,
 * consider using the ModalTextarea component instead.
 */
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-museio-purple-light focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
