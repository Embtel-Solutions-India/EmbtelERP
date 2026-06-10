export interface DefaultWidgetConfig {
  widget: string;
  position: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  colSpan: { xs: number; sm: number; md: number; lg: number; xl: number };
  height: 'small' | 'medium' | 'large' | 'auto';
}

export const defaultDashboardConfigs: Record<string, DefaultWidgetConfig[]> = {
  sales_intern: [
    { widget: 'kpi_cards', position: 1, priority: 'critical', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'small' },
    { widget: 'quick_actions', position: 2, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'notifications', position: 3, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'performance', position: 4, priority: 'high', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 3 }, height: 'medium' },
    { widget: 'task_summary', position: 5, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'activities', position: 6, priority: 'medium', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'upcoming_events', position: 7, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'calendar', position: 8, priority: 'medium', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'large' }
  ],
  sales_executive: [
    { widget: 'kpi_cards', position: 1, priority: 'critical', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'small' },
    { widget: 'pipeline', position: 2, priority: 'high', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 3 }, height: 'medium' },
    { widget: 'quick_actions', position: 3, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'notifications', position: 4, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'hot_leads', position: 5, priority: 'high', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'today_followups', position: 6, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'task_summary', position: 7, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'activities', position: 8, priority: 'medium', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'upcoming_events', position: 9, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'win_lost', position: 10, priority: 'high', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'source_analytics', position: 11, priority: 'high', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'calendar', position: 12, priority: 'medium', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'large' }
  ],
  sales_head: [
    { widget: 'kpi_cards', position: 1, priority: 'critical', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'small' },
    { widget: 'leaderboard', position: 2, priority: 'high', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'performance', position: 3, priority: 'high', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 3 }, height: 'medium' },
    { widget: 'quick_actions', position: 4, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'notifications', position: 5, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'task_summary', position: 6, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'activities', position: 7, priority: 'medium', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'upcoming_events', position: 8, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'assignment_queue', position: 9, priority: 'high', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'kpi_score', position: 10, priority: 'high', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'revenue_trend', position: 11, priority: 'high', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'compliance', position: 12, priority: 'high', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'calendar', position: 13, priority: 'medium', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'large' }
  ],
  marketing_intern: [
    { widget: 'kpi_cards', position: 1, priority: 'critical', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'small' },
    { widget: 'quick_actions', position: 2, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'notifications', position: 3, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'performance', position: 4, priority: 'high', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 3 }, height: 'medium' },
    { widget: 'task_summary', position: 5, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'activities', position: 6, priority: 'medium', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'upcoming_events', position: 7, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'calendar', position: 8, priority: 'medium', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'large' }
  ],
  marketing_executive: [
    { widget: 'kpi_cards', position: 1, priority: 'critical', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'small' },
    { widget: 'performance', position: 2, priority: 'high', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 3 }, height: 'medium' },
    { widget: 'quick_actions', position: 3, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'notifications', position: 4, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'traffic_sources', position: 5, priority: 'high', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'campaign_activities', position: 6, priority: 'medium', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'task_summary', position: 7, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'activities', position: 8, priority: 'medium', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'upcoming_events', position: 9, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'calendar', position: 10, priority: 'medium', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'large' }
  ],
  marketing_manager: [
    { widget: 'kpi_cards', position: 1, priority: 'critical', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'small' },
    { widget: 'leaderboard', position: 2, priority: 'high', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'performance', position: 3, priority: 'high', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 3 }, height: 'medium' },
    { widget: 'quick_actions', position: 4, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'notifications', position: 5, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'funnel_analytics', position: 6, priority: 'high', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'medium' },
    { widget: 'task_summary', position: 7, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'activities', position: 8, priority: 'medium', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'upcoming_events', position: 9, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'calendar', position: 10, priority: 'medium', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'large' }
  ],
  documentation_executive: [
    { widget: 'kpi_cards', position: 1, priority: 'critical', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'small' },
    { widget: 'quick_actions', position: 2, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'notifications', position: 3, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'performance', position: 4, priority: 'high', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 3 }, height: 'medium' },
    { widget: 'task_summary', position: 5, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'activities', position: 6, priority: 'medium', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'upcoming_events', position: 7, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'calendar', position: 8, priority: 'medium', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'large' }
  ],
  documentation_manager: [
    { widget: 'kpi_cards', position: 1, priority: 'critical', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'small' },
    { widget: 'quick_actions', position: 2, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'notifications', position: 3, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'performance', position: 4, priority: 'high', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 3 }, height: 'medium' },
    { widget: 'task_summary', position: 5, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'activities', position: 6, priority: 'medium', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'upcoming_events', position: 7, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'calendar', position: 8, priority: 'medium', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'large' }
  ],
  vertical_manager: [
    { widget: 'kpi_cards', position: 1, priority: 'critical', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'small' },
    { widget: 'dept_health', position: 2, priority: 'high', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'performance', position: 3, priority: 'high', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 3 }, height: 'medium' },
    { widget: 'quick_actions', position: 4, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'notifications', position: 5, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'task_summary', position: 6, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'activities', position: 7, priority: 'medium', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'upcoming_events', position: 8, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'calendar', position: 9, priority: 'medium', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'large' }
  ],
  immigration_head: [
    { widget: 'kpi_cards', position: 1, priority: 'critical', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'small' },
    { widget: 'performance', position: 2, priority: 'high', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 3 }, height: 'medium' },
    { widget: 'quick_actions', position: 3, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'notifications', position: 4, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'task_summary', position: 5, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'activities', position: 6, priority: 'medium', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'upcoming_events', position: 7, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'calendar', position: 8, priority: 'medium', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'large' }
  ],
  evaluation_head: [
    { widget: 'kpi_cards', position: 1, priority: 'critical', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'small' },
    { widget: 'quick_actions', position: 2, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'notifications', position: 3, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'performance', position: 4, priority: 'high', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 3 }, height: 'medium' },
    { widget: 'task_summary', position: 5, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'activities', position: 6, priority: 'medium', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'upcoming_events', position: 7, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'calendar', position: 8, priority: 'medium', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'large' }
  ],
  hr_manager: [
    { widget: 'kpi_cards', position: 1, priority: 'critical', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'small' },
    { widget: 'quick_actions', position: 2, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'notifications', position: 3, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'performance', position: 4, priority: 'high', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 3 }, height: 'medium' },
    { widget: 'task_summary', position: 5, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'activities', position: 6, priority: 'medium', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'upcoming_events', position: 7, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'calendar', position: 8, priority: 'medium', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'large' }
  ],
  business_owner: [
    { widget: 'kpi_cards', position: 1, priority: 'critical', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'small' },
    { widget: 'business_health_details', position: 2, priority: 'high', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'performance', position: 3, priority: 'high', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 3 }, height: 'medium' },
    { widget: 'quick_actions', position: 4, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'notifications', position: 5, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'task_summary', position: 6, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'activities', position: 7, priority: 'medium', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'upcoming_events', position: 8, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'calendar', position: 9, priority: 'medium', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'large' }
  ],
  super_admin: [
    { widget: 'kpi_cards', position: 1, priority: 'critical', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'small' },
    { widget: 'system_status', position: 2, priority: 'critical', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'small' },
    { widget: 'quick_actions', position: 3, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'notifications', position: 4, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'medium' },
    { widget: 'performance', position: 5, priority: 'high', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 3 }, height: 'medium' },
    { widget: 'audit_logs', position: 6, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'business_stats', position: 7, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'task_summary', position: 8, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'activities', position: 9, priority: 'medium', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'upcoming_events', position: 10, priority: 'critical', colSpan: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }, height: 'large' },
    { widget: 'calendar', position: 11, priority: 'medium', colSpan: { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }, height: 'large' }
  ]
};
