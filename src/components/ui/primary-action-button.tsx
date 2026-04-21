
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const primaryActionButtonVariants = cva(
  "text-white font-bold transition-colors duration-300 cursor-pointer disabled:bg-[#E0E0E0] disabled:text-gray-500 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#8B5CF6] to-[#6E59A5] hover:opacity-90 rounded-lg shadow-sm",
        light: "bg-gradient-to-r from-[#A98CFF] to-[#8C70E8] hover:opacity-90 rounded-lg shadow-sm",
        soft: "bg-gradient-to-r from-[#F5F0FF] to-[#EBE4FF] text-[#9b87f5] hover:opacity-90 font-semibold rounded-full shadow-sm",
        success: "bg-gradient-to-r from-[#F2FCE2] to-[#D1F2BB] text-[#4B7F52] hover:opacity-90 rounded-lg shadow-sm",
      },
      size: {
        default: "py-3 px-6",
        sm: "py-2.5 px-4 text-sm",
        lg: "py-4 px-8",
      },
      width: {
        default: "w-auto",
        full: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      width: "default",
    },
  }
);

export interface PrimaryActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof primaryActionButtonVariants> {
  saved?: boolean;
  isLoading?: boolean;
  savedText?: string;
  loadingText?: string;
  children: React.ReactNode;
}

const PrimaryActionButton = React.forwardRef<HTMLButtonElement, PrimaryActionButtonProps>(
  ({ className, variant, size, width, saved, isLoading, savedText, loadingText, children, ...props }, ref) => {
    return (
      <Button
        className={cn(primaryActionButtonVariants({ variant, size, width, className }), "inline-flex items-center gap-2 transform transition-transform active:scale-[0.98]")}
        ref={ref}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {loadingText || "Saving..."}
          </>
        ) : saved ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            {savedText || "Saved"}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

PrimaryActionButton.displayName = "PrimaryActionButton";

export { PrimaryActionButton };
