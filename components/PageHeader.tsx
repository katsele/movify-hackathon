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
    <header className="flex items-end justify-between gap-4 pb-5 border-b">
      <div>
        <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {lastUpdated && (
          <span className="text-xs text-muted-foreground">
            Last updated {lastUpdated}
          </span>
        )}
        {onRefresh && (
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        )}
        {actions}
      </div>
    </header>
  );
}
