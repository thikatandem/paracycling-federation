import {
  getRole
}
from '../auth/authStateService.js'

import {
  getAthleteSidebar
}
from './athletes/athleteSidebarService.js'

export function getRoleSidebar() {

  const role =
  getRole()

const roleCode =
  role?.role_code

  switch (
    roleCode
  ) {

    case 'ATHLETE':

      return getAthleteSidebar()

    default:

      return null

  }

}