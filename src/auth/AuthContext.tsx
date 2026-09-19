import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  hasPermission,
  type Permission,
  type UserRole,
} from './roles'

type AuthContextValue = {
  role: UserRole | null
  selectRole: (
    role: UserRole,
  ) => void
  logout: () => void
  can: (
    permission: Permission,
  ) => boolean
}

const STORAGE_KEY =
  'liva-demo-role'

const AuthContext =
  createContext<AuthContextValue | null>(
    null,
  )

function readStoredRole():
  | UserRole
  | null {
  const stored =
    localStorage.getItem(
      STORAGE_KEY,
    )

  if (
    stored === 'judge' ||
    stored === 'admin' ||
    stored === 'officer' ||
    stored === 'analyst'
  ) {
    return stored
  }

  return null
}

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [role, setRole] =
    useState<UserRole | null>(
      readStoredRole,
    )

  const selectRole = (
    nextRole: UserRole,
  ) => {
    localStorage.setItem(
      STORAGE_KEY,
      nextRole,
    )

    setRole(nextRole)
  }

  const logout = () => {
    localStorage.removeItem(
      STORAGE_KEY,
    )

    setRole(null)
  }

  const can = (
    permission: Permission,
  ) => {
    if (!role) {
      return false
    }

    return hasPermission(
      role,
      permission,
    )
  }

  const value = useMemo(
    () => ({
      role,
      selectRole,
      logout,
      can,
    }),
    [role],
  )

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context =
    useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    )
  }

  return context
}