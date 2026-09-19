export type UserRole =
  | 'judge'
  | 'admin'
  | 'officer'
  | 'analyst'


export const ROLE_LABELS: Record<
  UserRole,
  string
> = {
  judge:
    'Judge / Demo',

  admin:
    'Administrator',

  officer:
    'Project Officer',

  analyst:
    'Analyst / Viewer',
}


export type Permission =
  | 'dashboard.view'

  | 'projects.view'
  | 'projects.create'
  | 'projects.edit'
  | 'projects.delete'

  | 'workflow.view'
  | 'workflow.manage'

  | 'actions.view'
  | 'actions.manage'

  | 'documents.view'
  | 'documents.manage'

  | 'gis.view'
  | 'gis.manage'

  | 'risk.view'

  | 'simulation.view'
  | 'simulation.run'

  | 'reports.view'
  | 'reports.export'

  | 'audit.view'

  | 'users.manage'


const ADMIN_PERMISSIONS:
  Permission[] = [
  'dashboard.view',

  'projects.view',
  'projects.create',
  'projects.edit',
  'projects.delete',

  'workflow.view',
  'workflow.manage',

  'actions.view',
  'actions.manage',

  'documents.view',
  'documents.manage',

  'gis.view',
  'gis.manage',

  'risk.view',

  'simulation.view',
  'simulation.run',

  'reports.view',
  'reports.export',

  'audit.view',

  'users.manage',
]


const OFFICER_PERMISSIONS:
  Permission[] = [
  'dashboard.view',

  'projects.view',
  'projects.create',
  'projects.edit',

  'workflow.view',
  'workflow.manage',

  'actions.view',
  'actions.manage',

  'documents.view',
  'documents.manage',

  'gis.view',
  'gis.manage',

  'risk.view',

  'simulation.view',
  'simulation.run',

  'reports.view',
  'reports.export',
]


const ANALYST_PERMISSIONS:
  Permission[] = [
  'dashboard.view',

  'projects.view',

  'workflow.view',

  'actions.view',

  'documents.view',

  'gis.view',

  'risk.view',

  'simulation.view',

  'reports.view',
  'reports.export',
]

const JUDGE_PERMISSIONS: Permission[] = [
  ...ADMIN_PERMISSIONS,
]

export const ROLE_PERMISSIONS:
  Record<
    UserRole,
    Permission[]
  > = {
  admin:
    ADMIN_PERMISSIONS,

  officer:
    OFFICER_PERMISSIONS,

  analyst:
    ANALYST_PERMISSIONS,

  judge:
    JUDGE_PERMISSIONS,
}


export function hasPermission(
  role: UserRole,
  permission: Permission,
) {
  return (
    ROLE_PERMISSIONS[
      role
    ]?.includes(
      permission,
    ) ?? false
  )
}