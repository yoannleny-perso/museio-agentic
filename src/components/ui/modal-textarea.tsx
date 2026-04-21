
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Textarea } from "./textarea"

const modalTextareaVariants = cva(
  "w-[98%] mx-auto",
  {
    variants: {
      variant: {
        default: "",
        filled: "bg-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ModalTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof modalTextareaVariants> {}

const ModalTextarea = React.forwardRef<HTMLTextAreaElement, ModalTextareaProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <Textarea
        className={cn(modalTextareaVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
ModalTextarea.displayName = "ModalTextarea"

export { ModalTextarea, modalTextareaVariants }
