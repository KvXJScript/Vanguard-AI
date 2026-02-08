import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number | undefined; // 0-100
  size?: "sm" | "md" | "lg";
  label?: string;
  showLabel?: boolean;
}

export function ScoreRing({ score = 0, size = "md", label, showLabel = true }: ScoreRingProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  let colorClass = "text-gray-400";
  if (progress >= 80) colorClass = "text-[hsl(142,71%,45%)]";
  else if (progress >= 50) colorClass = "text-[hsl(45,93%,47%)]";
  else if (progress > 0) colorClass = "text-[hsl(0,84%,60%)]";

  const sizeClasses = {
    sm: "w-16 h-16 text-xs",
    md: "w-24 h-24 text-sm",
    lg: "w-32 h-32 text-base",
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
        {/* Background Ring */}
        <svg className="absolute w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius + "%"}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-muted/30"
          />
          {/* Foreground Ring */}
          <circle
            cx="50%"
            cy="50%"
            r={radius + "%"}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn("transition-all duration-1000 ease-out", colorClass)}
            // Use pathLength for SVG stroke animation if needed, but css transition works for color
            style={{ 
                // Using inline style for path units relative to radius is tricky without viewBox, 
                // assuming SVG viewBox="0 0 100 100" logic roughly
            }} 
          />
        </svg>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
           <span className={cn("font-bold tabular-nums text-foreground", 
             size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-sm'
           )}>
             {score}
           </span>
        </div>
      </div>
      {showLabel && label && (
        <span className="mt-2 text-sm font-medium text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
