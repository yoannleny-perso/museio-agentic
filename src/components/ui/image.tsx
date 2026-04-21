
import React from "react";
import { cn } from "@/lib/utils";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ className, fallbackSrc, alt, ...props }, ref) => {
    const [error, setError] = React.useState<boolean>(false);

    const handleError = () => {
      if (fallbackSrc) {
        setError(true);
      }
    };

    return (
      <img
        className={cn("object-cover", className)}
        ref={ref}
        alt={alt}
        onError={handleError}
        src={error && fallbackSrc ? fallbackSrc : props.src}
        {...props}
      />
    );
  }
);

Image.displayName = "Image";

export default Image;
