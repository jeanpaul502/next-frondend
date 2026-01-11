import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number[];
  max: number;
  step: number;
  onValueChange: (value: number[]) => void;
  className?: string;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value, max, step, onValueChange, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange([parseFloat(e.target.value)]);
    };

    const percentage = (value[0] / max) * 100;

    return (
      <div className={cn("relative flex items-center w-full touch-none select-none", className)}>
        <input
          type="range"
          min={0}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleChange}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          ref={ref}
          {...props}
        />
        <div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-[#E50914] transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div
          className="absolute h-4 w-4 bg-[#E50914] rounded-full shadow-md transition-all translate-x-[-50%]"
          style={{ left: `${percentage}%` }}
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";
