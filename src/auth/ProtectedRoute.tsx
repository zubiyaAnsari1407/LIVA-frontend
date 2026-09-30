import type {
  ReactNode,
} from 'react'

import {
  Navigate,
} from 'react-router'

import {
  useAuth,
} from './AuthContext'

import RoleSwitcher from './RoleSwitcher'

import type {
  Permission,
  UserRole,
} from './roles'


type ProtectedRouteProps = {
  children: ReactNode
  permission?: Permission
  role?: UserRole
}


export default function ProtectedRoute({
  children,
  permission,
  role: requiredRole,
}: ProtectedRouteProps) {
  const {
    role,
    can,
  } = useAuth()


  if (!role) {
    return (
      <Navigate
        to="/access"
        replace
      />
    )
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/dashboard" replace />
  }


  if (
    permission &&
    !can(permission)
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }


  return (
    <>
      {children}

      <RoleSwitcher />
    </>
  )
}
