
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Input } from "./input"

const modalInputVariants = cva(
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

export interface ModalInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof modalInputVariants> {}

const ModalInput = React.forwardRef<HTMLInputElement, ModalInputProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <Input
        className={cn(modalInputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
ModalInput.displayName = "ModalInput"

export { ModalInput, modalInputVariants }
