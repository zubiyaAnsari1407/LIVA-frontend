import type {
  ReactNode,
} from 'react'

import {
  useAuth,
} from './AuthContext'

import type {
  Permission,
} from './roles'


type PermissionGateProps = {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}


export default function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const {
    can,
  } = useAuth()

  if (
    !can(permission)
  ) {
    return fallback
  }

  return children
}