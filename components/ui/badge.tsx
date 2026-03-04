import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:    "bg-bg-elevated border border-border text-text-secondary",
        brand:      "bg-brand/10 border border-brand/30 text-brand",
        success:    "bg-success/10 border border-success/30 text-success",
        danger:     "bg-danger/10  border border-danger/30  text-danger",
        warning:    "bg-warning/10 border border-warning/30 text-warning",
        pending:    "bg-warning/10 border border-warning/30 text-warning",
        approved:   "bg-success/10 border border-success/30 text-success",
        rejected:   "bg-danger/10  border border-danger/30  text-danger",
        cancelled:  "bg-bg-elevated border border-border text-text-muted",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
