export type UserRole =
  | 'admin'
  | 'officer'
  | 'landowner'


export const ROLE_LABELS: Record<
  UserRole,
  string
> = {
  admin:
    'Administrator',

  officer:
    'Project Officer',

  landowner:
    'Landowner',
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


const LANDOWNER_PERMISSIONS:
  Permission[] = [
  'dashboard.view',

  'projects.view',

  'workflow.view',

  'documents.view',

  'gis.view',

  'risk.view',

  'simulation.view',

  'simulation.run',

  'reports.view',
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

  landowner:
    LANDOWNER_PERMISSIONS,
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
