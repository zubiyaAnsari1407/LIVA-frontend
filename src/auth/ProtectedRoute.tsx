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
} from './roles'


type ProtectedRouteProps = {
  children: ReactNode
  permission?: Permission
}


export default function ProtectedRoute({
  children,
  permission,
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