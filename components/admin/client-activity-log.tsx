import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { ActivityLog } from "@/types";

interface ClientActivityLogProps {
  activities: ActivityLog[];
}

export function ClientActivityLog({ activities }: ClientActivityLogProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <h3 className="mb-3 font-semibold">Recent Activity</h3>
        <p className="text-sm text-muted">No activity logged yet.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="mb-3 font-semibold">Recent Activity</h3>
      <ul className="space-y-2 text-sm">
        {activities.map((log) => (
          <li key={log.id} className="flex justify-between gap-4 border-b border-border pb-2 last:border-0">
            <span>
              <span className="font-medium">{log.action}</span>
              {log.entity_type ? <span className="text-muted"> · {log.entity_type}</span> : null}
            </span>
            <span className="shrink-0 text-xs text-muted">{formatDate(log.created_at)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
