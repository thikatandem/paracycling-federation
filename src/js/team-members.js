/* global coreui */
/* eslint camelcase: 0 */
/* eslint-disable no-console */
/* eslint-disable no-alert */

/* ==========================================
   CONSTANTS
========================================== */

const PAGE_SIZE = 10

/* ==========================================
   GLOBALS
========================================== */

let currentPage = 1

let teamMembers = []

let filteredTeamMembers = []

let teamsLookup = []

let rolesLookup = []

let historyModal = null

let closeAssignmentModal = null

let currentSortField =
  'start_date'

let currentSortDirection =
  'desc'

/* ==========================================
   DOM HELPERS
========================================== */

const $ = id =>
  document.getElementById(id)

function showLoading(
  show = true
) {

  const el =
    $('teamMemberLoading')

  if (!el) {
    return
  }

  el.classList.toggle(
    'd-none',
    !show
  )
}

function setText(
  id,
  value
) {

  const el = $(id)

  if (!el) {
    return
  }

  el.textContent =
    value ?? ''
}

function clearCloseAssignmentForm() {

  setText(
    'closeAssignmentError',
    ''
  )

  const assignmentId =
    $('closeAssignmentId')

  if (assignmentId) {
    assignmentId.value = ''
  }

  const endDate =
    $('closeAssignmentDate')

  if (endDate) {

    endDate.value =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        )
  }

  const reason =
    $('closeAssignmentReason')

  if (reason) {
    reason.value = ''
  }

  const remarks =
    $('closeAssignmentRemarks')

  if (remarks) {
    remarks.value = ''
  }
}

/* ==========================================
   HELPERS
========================================== */

function formatDate(
  value
) {

  if (!value) {
    return ''
  }

  return value
}

function calculateDuration(
  startDate,
  endDate
) {

  if (!startDate) {
    return ''
  }

  const start =
    new Date(
      startDate
    )

  const end =
    endDate
      ? new Date(endDate)
      : new Date()

  const diffDays =
    Math.floor(
      (
        end - start
      ) /
      (
        1000 *
        60 *
        60 *
        24
      )
    )

  if (
    diffDays < 30
  ) {
    return `${diffDays}d`
  }

  const months =
    Math.floor(
      diffDays / 30
    )

  if (
    months < 12
  ) {
    return `${months}m`
  }

  const years =
    Math.floor(
      months / 12
    )

  const remainingMonths =
    months % 12

  return `${years}y ${remainingMonths}m`
}

function getRoleBadge(
  roleCode
) {

  if (
    roleCode ===
    'PILOT'
  ) {

    return `
      <span
        class="badge bg-primary"
      >
        Pilot
      </span>
    `
  }

  if (
    roleCode ===
    'STOKER'
  ) {

    return `
      <span
        class="badge bg-success"
      >
        Stoker
      </span>
    `
  }

  return `
    <span
      class="badge bg-secondary"
    >
      ${roleCode || ''}
    </span>
  `
}

function getActiveBadge(
  active
) {

  return active
    ? `
      <span
        class="badge bg-success"
      >
        Active
      </span>
    `
    : `
      <span
        class="badge bg-secondary"
      >
        Inactive
      </span>
    `
}

/* ==========================================
   LOOKUPS
========================================== */

async function loadTeamsLookup() {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from('teams')
      .select(`
        team_id,
        team_code,
        team_name
      `)
      .order(
        'team_code'
      )

  if (error) {
    throw error
  }

  teamsLookup =
    data || []

  renderTeamFilter()
}

function renderTeamFilter() {

  const select =
    $('filterTeam')

  if (!select) {
    return
  }

  select.innerHTML =
    `
      <option value="">
        All Teams
      </option>
    `

  for (
    const team
    of teamsLookup
  ) {

    const option =
      document.createElement(
        'option'
      )

    option.value =
      team.team_id

    option.textContent =
      `${team.team_code || ''} - ${team.team_name || ''}`

    select.append(
      option
    )
  }
}

async function loadRolesLookup() {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from('role_master')
      .select(`
        role_id,
        role_code,
        role_name
      `)
      .order(
        'role_name'
      )

  if (error) {
    throw error
  }

  rolesLookup =
    data || []

  renderRoleFilter()
}

function renderRoleFilter() {

  const select =
    $('filterRole')

  if (!select) {
    return
  }

  select.innerHTML =
    `
      <option value="">
        All Roles
      </option>
    `

  for (
    const role
    of rolesLookup
  ) {

    const option =
      document.createElement(
        'option'
      )

    option.value =
      role.role_id

    option.textContent =
      role.role_name

    select.append(
      option
    )
  }
}

/* ==========================================
   LOAD TEAM MEMBERS
========================================== */

async function loadTeamMembers() {

  try {

    showLoading(true)

    const {
      data,
      error
    } =
      await window.supabaseClient
        .from(
          'team_members'
        )
        .select(`
          *,
          teams(
            team_id,
            team_code,
            team_name
          ),
          athletes(
            athlete_id,
            athlete_code,
            first_name,
            last_name
          ),
          role_master(
            role_id,
            role_code,
            role_name
          )
        `)
        .order(
          'start_date',
          {
            ascending:
              false
          }
        )

    if (error) {
      throw error
    }

    teamMembers =
      data || []

    filteredTeamMembers =
      [...teamMembers]

    updateSummaryCards()

  } catch (error) {

    console.error(
      error
    )

    alert(
      error.message ||
      'Failed to load team members'
    )

  } finally {

    showLoading(false)
  }
}

/* ==========================================
   SUMMARY CARDS
========================================== */

function updateSummaryCards() {

  const totalAssignments =
    teamMembers.length

  const activeAssignments =
    teamMembers.filter(
      member =>
        member.membership_status_master
    ).length

  const pilotAssignments =
    teamMembers.filter(
      member =>
        member.role_master
          ?.role_code ===
        'PILOT'
    ).length

  const stokerAssignments =
    teamMembers.filter(
      member =>
        member.role_master
          ?.role_code ===
        'STOKER'
    ).length

  const historicalChanges =
    teamMembers.filter(
      member =>
        !member.membership_status_master
    ).length

  setText(
    'totalAssignmentsCard',
    totalAssignments
  )

  setText(
    'activeAssignmentsCard',
    activeAssignments
  )

  setText(
    'pilotAssignmentsCard',
    pilotAssignments
  )

  setText(
    'stokerAssignmentsCard',
    stokerAssignments
  )

  setText(
    'historicalChangesCard',
    historicalChanges
  )
}

/* ==========================================
   SEARCH
========================================== */

function applyFilters() {

  const search =
    (
      $('searchTeamMember')
        ?.value || ''
    )
      .trim()
      .toLowerCase()

  const roleId =
    $('filterRole')
      ?.value || ''

  const teamId =
    $('filterTeam')
      ?.value || ''

  const status =
    $('filterStatus')
      ?.value || ''

  const activeOnly =
    $('activeOnly')
      ?.checked

  filteredTeamMembers =
    teamMembers.filter(
      member => {

        const searchable =
          [
            member.teams
              ?.team_code || '',

            member.teams
              ?.team_name || '',

            member.athletes
              ?.athlete_code || '',

            member.athletes
              ?.first_name || '',

            member.athletes
              ?.last_name || '',

            member.role_master
              ?.role_name || '',

            member.role_master
              ?.role_code || '',

            member.change_reason || '',

            member.membership_status_master
              ? 'active'
              : 'inactive'
          ]
            .join(' ')
            .toLowerCase()

        if (
          search &&
          !searchable.includes(
            search
          )
        ) {
          return false
        }

        if (
          roleId &&
          member.role_id !==
          roleId
        ) {
          return false
        }

        if (
          teamId &&
          member.team_id !==
          teamId
        ) {
          return false
        }

        if (
          status ===
          'active' &&
          !member.membership_status_master
        ) {
          return false
        }

        if (
          status ===
          'inactive' &&
          member.membership_status_master
        ) {
          return false
        }

        if (
          activeOnly &&
          !member.membership_status_master
        ) {
          return false
        }

        return true
      }
    )

  currentPage = 1

  applySorting()
}

/* ==========================================
   SORTING
========================================== */

function sortBy(
  field
) {

  if (
    currentSortField ===
    field
  ) {

    currentSortDirection =
      currentSortDirection ===
      'asc'
        ? 'desc'
        : 'asc'

  } else {

    currentSortField =
      field

    currentSortDirection =
      'asc'
  }

  applySorting()
}

function applySorting() {

  filteredTeamMembers.sort(
    (
      a,
      b
    ) => {

      let valueA = ''

      let valueB = ''

      switch (
        currentSortField
      ) {

      case 'team_code':

        valueA =
          a.teams
            ?.team_code || ''

        valueB =
          b.teams
            ?.team_code || ''

        break

      case 'team_name':

        valueA =
          a.teams
            ?.team_name || ''

        valueB =
          b.teams
            ?.team_name || ''

        break

      case 'athlete_code':

        valueA =
          a.athletes
            ?.athlete_code || ''

        valueB =
          b.athletes
            ?.athlete_code || ''

        break

      case 'role':

        valueA =
          a.role_master
            ?.role_name || ''

        valueB =
          b.role_master
            ?.role_name || ''

        break

      case 'start_date':

        valueA =
          a.start_date || ''

        valueB =
          b.start_date || ''

        break

      case 'end_date':

        valueA =
          a.end_date || ''

        valueB =
          b.end_date || ''

        break
      case 'duration':

  valueA =
    (
      new Date(
        a.end_date ||
        new Date()
      ) -
      new Date(
        a.start_date
      )
    )

  valueB =
    (
      new Date(
        b.end_date ||
        new Date()
      ) -
      new Date(
        b.start_date
      )
    )

  break

      default:

        valueA = ''
        valueB = ''
      }

      if (
        valueA <
        valueB
      ) {

        return currentSortDirection ===
          'asc'
          ? -1
          : 1
      }

      if (
        valueA >
        valueB
      ) {

        return currentSortDirection ===
          'asc'
          ? 1
          : -1
      }

      return 0
    }
  )

  renderTable()
}

/* ==========================================
   TABLE RENDERING
========================================== */

function renderTable() {

  const tbody =
    $('teamMembersTableBody')

  if (!tbody) {
    return
  }

  const start =
    (
      currentPage - 1
    ) * PAGE_SIZE

  const end =
    start + PAGE_SIZE

  const pageRows =
    filteredTeamMembers.slice(
      start,
      end
    )

  if (
    !pageRows.length
  ) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="11"
          class="text-center"
        >
          No Team Members Found
        </td>
      </tr>
    `

    renderPagination()

    return
  }

  tbody.innerHTML =
    pageRows.map(
      member => {

        const athleteName =
          `
            ${
              member.athletes
                ?.first_name || ''
            }
            ${
              member.athletes
                ?.last_name || ''
            }
          `

        return `
          <tr>

            <td>
              ${
                member.teams
                  ?.team_code || ''
              }
            </td>

            <td>
              ${
                member.teams
                  ?.team_name || ''
              }
            </td>

            <td>
              ${
                member.athletes
                  ?.athlete_code || ''
              }
            </td>

            <td>
              ${athleteName}
            </td>

            <td>
              ${getRoleBadge(
                member.role_master
                  ?.role_code
              )}
            </td>

            <td>
              ${formatDate(
                member.start_date
              )}
            </td>

            <td>
              ${formatDate(
                member.end_date
              )}
            </td>

            <td>
              ${calculateDuration(
                member.start_date,
                member.end_date
              )}
            </td>

            <td>
              ${getActiveBadge(
                member.membership_status_master
              )}
            </td>

            <td>
  ${
    member.change_reason ||
    '-'
  }
</td>

            <td>

              <button
                class="
                  btn
                  btn-sm
                  btn-info
                  me-1
                "
                onclick="
                  viewHistory(
                    '${member.team_id}'
                  )
                "
              >
                View
              </button>

              ${
                member.membership_status_master
                  ? `
                    <button
                      class="
                        btn
                        btn-sm
                        btn-danger
                      "
                      onclick="
                        openCloseAssignment(
                          '${member.team_member_id}'
                        )
                      "
                    >
                      Close
                    </button>
                  `
                  : ''
              }

            </td>

          </tr>
        `
      }
    ).join('')

  renderPagination()
}

/* ==========================================
   PAGINATION
========================================== */

function renderPagination() {

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredTeamMembers.length /
        PAGE_SIZE
      )
    )

  setText(
    'teamMemberPaginationInfo',
    `
      Page ${currentPage}
      of ${totalPages}
      (
      ${filteredTeamMembers.length}
      records
      )
    `
  )
}

function nextPage() {

  const totalPages =
    Math.ceil(
      filteredTeamMembers.length /
      PAGE_SIZE
    )

  if (
    currentPage <
    totalPages
  ) {

    currentPage++

    renderTable()
  }
}

function previousPage() {

  if (
    currentPage > 1
  ) {

    currentPage--

    renderTable()
  }
}

/* ==========================================
   HISTORY MODAL
========================================== */

window.viewHistory =
async function (
  teamId
) {

  try {

    showLoading(true)

    const {
      data,
      error
    } =
      await window.supabaseClient
        .from(
          'team_members'
        )
        .select(`
          *,
          athletes(
            athlete_code,
            first_name,
            last_name
          ),
          role_master(
            role_name,
            role_code
          ),
          teams(
            team_name,
            team_code
          )
        `)
        .eq(
          'team_id',
          teamId
        )
        .order(
          'start_date',
          {
            ascending:true
          }
        )

    if (error) {
      throw error
    }

    if (
      !data.length
    ) {
      return
    }

    const team =
      data[0]

    setText(
      'historyTeamName',
      `
      ${team.teams?.team_code}
      -
      ${team.teams?.team_name}
      `
    )

    const pilot =
      data.find(
        x =>
          x.role_master
            ?.role_code ===
          'PILOT' &&
          x.membership_status_master
      )

    const stoker =
      data.find(
        x =>
          x.role_master
            ?.role_code ===
          'STOKER' &&
          x.membership_status_master
      )

    setText(
      'historyPilotName',
      pilot
        ? `${pilot.athletes?.first_name} ${pilot.athletes?.last_name}`
        : '-'
    )

    setText(
      'historyStokerName',
      stoker
        ? `${stoker.athletes?.first_name} ${stoker.athletes?.last_name}`
        : '-'
    )

    const activeRecord =
  data.find(
    record =>
      record.membership_status_master
  )

setText(
  'historyActiveSince',
  activeRecord
    ?.start_date || '-'
)

    const tbody =
      $('historyTimelineBody')

    tbody.innerHTML =
      data.map(
        row => `
          <tr>

            <td>
              ${row.start_date || ''}
            </td>

            <td>
              ${
                row.athletes
                  ?.first_name || ''
              }
              ${
                row.athletes
                  ?.last_name || ''
              }
            </td>

            <td>
              ${
                row.role_master
                  ?.role_name || ''
              }
            </td>

            <td>
              ${
                row.membership_status_master
                  ? 'Assigned'
                  : 'Closed'
              }
            </td>

            <td>
              ${
                row.change_reason ||
                ''
              }
            </td>

          </tr>
        `
      ).join('')

    historyModal.show()

  } catch (error) {

    console.error(error)

    alert(
      error.message
    )

  } finally {

    showLoading(false)
  }
}

/* ==========================================
   CLOSE ASSIGNMENT
========================================== */

window.openCloseAssignment =
function (
  teamMemberId
) {

  clearCloseAssignmentForm()

  $('closeAssignmentId')
    .value =
    teamMemberId

  closeAssignmentModal.show()
}

async function closeAssignment() {

  try {

    const id =
      $('closeAssignmentId')
        .value

    const endDate =
      $('closeAssignmentDate')
        .value

    const reason =
      $('closeAssignmentReason')
        .value

    const remarks =
      $('closeAssignmentRemarks')
        .value

    if (
      !endDate ||
      !reason
    ) {

      setText(
        'closeAssignmentError',
        'End date and reason are required'
      )

      return
    }

    const {
      error
    } =
      await window.supabaseClient
        .from(
          'team_members'
        )
        .update({
          membership_status_master:false,
          end_date:endDate,
          change_reason:
            `${reason} - ${remarks}`
        })
        .eq(
          'team_member_id',
          id
        )

    if (error) {
      throw error
    }

    closeAssignmentModal.hide()

    await loadTeamMembers()

    applyFilters()

  } catch (error) {

    console.error(error)

    alert(
      error.message
    )
  }
}
/* ==========================================
   EXPORTS
========================================== */

function exportCsv() {

  const rows =
    filteredTeamMembers.map(
      row => ({

        TeamCode:
          row.teams
            ?.team_code,

        TeamName:
          row.teams
            ?.team_name,

        AthleteCode:
          row.athletes
            ?.athlete_code,

        Athlete:
          `
          ${row.athletes?.first_name || ''}
          ${row.athletes?.last_name || ''}
          `,

        Role:
          row.role_master
            ?.role_name,

        StartDate:
          row.start_date,

        EndDate:
          row.end_date,

        Active:
          row.membership_status_master
      })
    )

  console.table(rows)

  alert(
    'CSV export phase complete'
  )
}

function exportExcel() {

  alert(
    'Excel export phase complete'
  )
}

function printTable() {

  window.print()
}
/* ==========================================
   EVENT WIRING
========================================== */

function wireEvents() {

  $('searchTeamMember')
    ?.addEventListener(
      'input',
      applyFilters
    )

  $('filterRole')
    ?.addEventListener(
      'change',
      applyFilters
    )

  $('filterTeam')
    ?.addEventListener(
      'change',
      applyFilters
    )

  $('filterStatus')
    ?.addEventListener(
      'change',
      applyFilters
    )

  $('activeOnly')
    ?.addEventListener(
      'change',
      applyFilters
    )

  $('btnNextTeamMemberPage')
    ?.addEventListener(
      'click',
      nextPage
    )

  $('btnPreviousTeamMemberPage')
    ?.addEventListener(
      'click',
      previousPage
    )

  $('btnRefreshTeamMembers')
    ?.addEventListener(
      'click',
      async () => {

        await loadTeamMembers()

        applyFilters()
      }
    )

  $('btnConfirmCloseAssignment')
    ?.addEventListener(
      'click',
      closeAssignment
    )

  $('btnExportTeamMembersCsv')
    ?.addEventListener(
      'click',
      exportCsv
    )

  $('btnExportTeamMembersExcel')
    ?.addEventListener(
      'click',
      exportExcel
    )

  $('btnPrintTeamMembers')
    ?.addEventListener(
      'click',
      printTable
    )

  document
    .querySelectorAll(
      '.sortable'
    )
    .forEach(
      header => {

        header.addEventListener(
          'click',
          () => {

            sortBy(
              header.dataset.sort
            )
          }
        )
      }
    )
}

/* ==========================================
   INITIALIZATION
========================================== */

async function initialize() {

  historyModal =
    new coreui.Modal(
      $('teamMemberHistoryModal')
    )

  closeAssignmentModal =
    new coreui.Modal(
      $('closeAssignmentModal')
    )

  await loadTeamsLookup()

  await loadRolesLookup()

  await loadTeamMembers()

  applyFilters()

  wireEvents()
}

document.addEventListener(
  'DOMContentLoaded',
  initialize
)
