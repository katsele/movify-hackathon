"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  onRefresh?: () => void;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  lastUpdated,
  onRefresh,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-4 pb-5 border-b border-neutral-200">
      <div>
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.01em] text-neutral-800">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {lastUpdated && (
          <span className="text-[11px] text-neutral-500 font-mono tabular">
            Last updated {lastUpdated}
          </span>
        )}
        {onRefresh && (
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
            Refresh
          </Button>
        )}
        {actions}
      </div>
    </header>
  );
}
