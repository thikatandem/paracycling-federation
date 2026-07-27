import {
  buildActionButtons,
  buildActionCell,
  buildStatusCell
} from '../services/tableRendererService.js'

import {
  getActiveBadge
} from '../services/badgeService.js'

import {
  countProgramSchedules,
  deleteProgramRecord,
  deleteScheduleRecord,
  getProgram,
  getProgramIdByName,
  getProgramNameSuggestions,
  getProgramSchedule,
  getProgramSummary,
  listProgramRecurrenceTypes,
  listPrograms as listProgramRecords,
  listProgramSchedules,
  programExists,
  saveProgramRecord,
  saveScheduleRecord,
  scheduleExists,
  validateSchedulePayload
} from './programService.js'
import {
  createMessageController
} from '../services/errorService.js'
import {
  confirmAction
} from '../services/feedbackService.js'

import {
  createModalByElement
} from '../services/modalService.js'
const {
  showErrorMessage: showError,
  showSuccessMessage: showSuccess,
  clearMessageBox: clearError
} = createMessageController({
  containerSelector:
    '[data-feedback="program"]'
})

let programModal = null

document.addEventListener(
  'DOMContentLoaded',
  initializePrograms
)

async function initializePrograms() {
  try {
    const modalElement =
      document.getElementById(
        'programModal'
      )

    if (!modalElement) {
      throw new Error(
        'Program modal not found.'
      )
    }

    programModal =
      createModalByElement(modalElement)

    bindProgramEvents()

    await loadProgramRecurrenceTypes()
    await loadPrograms()
    await loadProgramNameSuggestions()
  } catch (error) {

    showError(
      error.message ||
      'Failed to initialize Program Master.'
    )
  }
}

function bindProgramEvents() {
  document
    .getElementById(
      'btnProgramMaster'
    )
    ?.addEventListener(
      'click',
      openProgramMaster
    )

  document
    .getElementById(
      'btnSaveProgram'
    )
    ?.addEventListener(
      'click',
      saveProgram
    )

  document
    .getElementById(
      'programName'
    )
    ?.addEventListener(
      'input',
      syncProgramSummary
    )

  document
    .getElementById(
      'programDurationDays'
    )
    ?.addEventListener(
      'input',
      syncProgramSummary
    )

  document
    .getElementById(
      'programRecurrenceTypeId'
    )
    ?.addEventListener(
      'change',
      syncProgramSummary
    )

  document
    .getElementById(
      'scheduleStartDate'
    )
    ?.addEventListener(
      'change',
      updateScheduleDay
    )

  document
    .getElementById(
      'btnSaveSchedule'
    )
    ?.addEventListener(
      'click',
      saveSchedule
    )
}

async function loadProgramRecurrenceTypes() {
  const select =
    document.getElementById(
      'programRecurrenceTypeId'
    )

  if (!select) {
    return
  }

  select.innerHTML = `
    <option value="">
      Select Recurrence
    </option>
  `

  const recurrenceTypes =
    await listProgramRecurrenceTypes()

  for (const recurrence of recurrenceTypes) {
    select.innerHTML += `
      <option
        value="${recurrence.recurrence_type_id}"
      >
        ${recurrence.recurrence_name}
      </option>
    `
  }
}


async function loadProgramNameSuggestions() {
  const datalist =
    document.getElementById(
      'programNameSuggestions'
    )

  if (!datalist) {
    return
  }

  datalist.innerHTML = ''

  const names =
    await getProgramNameSuggestions()

  for (const name of names) {
    const option =
      document.createElement(
        'option'
      )

    option.value = name
    datalist.appendChild(
      option
    )
  }
}

// =====================================================
// CHECK DUPLICATE EVENT PROGRAM
// =====================================================

function clearProgramForm() {
  document.getElementById(
    'programId'
  ).value = ''

  document.getElementById(
    'programCode'
  ).value = ''

  document.getElementById(
    'programName'
  ).value = ''

  document.getElementById(
    'programDurationDays'
  ).value = 1

  document.getElementById(
    'programRecurrenceTypeId'
  ).value = ''

  clearScheduleForm()

  syncProgramSummary()
}

function syncProgramSummary() {
  document
        .getElementById(
          'selectedProgramName'
        )
        .value =
        document
            .getElementById(
              'programName'
            )
            .value

  document
        .getElementById(
          'selectedProgramCode'
        )
        .value =

        document
            .getElementById(
              'programCode'
            )
            .value ||

        'Generated on Save'

  const duration =

        document
            .getElementById(
              'programDurationDays'
            )
            .value

  document
        .getElementById(
          'selectedProgramDuration'
        )
        .value =

        duration ?

          `${duration} Day(s)` :

          ''

  const recurrence =

        document
            .getElementById(
              'programRecurrenceTypeId'
            )

  document
        .getElementById(
          'selectedProgramInterval'
        )
        .value =

        recurrence.options[
            recurrence.selectedIndex
        ]?.text ||

        ''

  document
        .getElementById(
          'selectedProgramStatus'
        )
        .value =

        'New Program'
}



async function saveProgram() {
  clearError()

  try {
    const programId =
      document.getElementById(
        'programId'
      ).value

    const programName =
      document.getElementById(
        'programName'
      ).value.trim()

    const exists =
      await programExists(
        programName,
        programId || null
      )

    if (exists) {
      showError(
        'Program already exists.'
      )

      return
    }

    const payload = {
      program_name:
        programName,
      program_duration_days:
        Number(
          document.getElementById(
            'programDurationDays'
          ).value
        ),
      recurrence_type_id:
        document.getElementById(
          'programRecurrenceTypeId'
        ).value || null,
      active: true
    }

    await saveProgramRecord({
      programId:
        programId || null,
      payload
    })

    let savedProgramId =
      programId

    if (!savedProgramId) {
      savedProgramId =
        await getProgramIdByName(
          programName
        )
    }

    const hasSchedule =
      document.getElementById(
        'scheduleStartDate'
      ).value

    if (hasSchedule) {
      document.getElementById(
        'scheduleProgramId'
      ).value =
        savedProgramId

      await saveSchedule()
    }

    clearProgramForm()

    await loadPrograms()
    await loadProgramNameSuggestions()

    const scheduleTable =
      document.getElementById(
        'scheduleTableBody'
      )

    if (scheduleTable) {
      scheduleTable.innerHTML = ''
    }

    document.getElementById(
      'scheduleSection'
    )?.classList.add(
      'd-none'
    )

    programModal?.hide()

    showSuccess(
      programId ?
        'Program updated successfully.' :
        'Program created successfully.'
    )
  } catch (error) {
    showError(
      error.message ||
      'Failed to save Program.'
    )
  }
}


async function openProgramMaster() {
  clearError()

  clearProgramForm()

  await loadPrograms()

  await loadProgramNameSuggestions()

  programModal.show()
}

async function loadPrograms() {
  const tbody =
    document.getElementById(
      'programTableBody'
    )

  if (!tbody) {
    return
  }

  tbody.innerHTML = ''

  const programs =
    await listProgramRecords({
      orderBy:
        'program_duration_days',
      ascending: true
    })

  for (const program of programs) {
    tbody.innerHTML += `
      <tr>
        <td>${program.program_code}</td>
        <td>${program.program_name}</td>
        <td>${program.program_duration_days} Day(s)</td>
        ${buildStatusCell(
          getActiveBadge(
            program.active
          )
        )}
        ${buildActionCell(
          buildActionButtons({
            buttons: [
              {
                type: 'edit',
                onClick:
                  `editProgram('${program.program_id}')`
              },
              {
                type: 'manage',
                label: 'Schedules',
                onClick:
                  `manageSchedules('${program.program_id}')`
              },
              {
                type: 'delete',
                onClick:
                  `deleteProgram('${program.program_id}')`
              }
            ]
          })
        )}
      </tr>
    `
  }
}


window.editProgram =
async function (
  programId
) {
  clearError()

  try {
    const data =
      await getProgram(
        programId
      )

    document.getElementById(
      'programCode'
    ).value =
      data.program_code

    document.getElementById(
      'programId'
    ).value =
      data.program_id

    document.getElementById(
      'programName'
    ).value =
      data.program_name

    document.getElementById(
      'programDurationDays'
    ).value =
      data.program_duration_days

    document.getElementById(
      'programRecurrenceTypeId'
    ).value =
      data.recurrence_type_id || ''

    syncProgramSummary()

    await loadSelectedProgram(
      programId
    )

    document.getElementById(
      'scheduleProgramId'
    ).value =
      programId

    await loadSchedules(
      programId
    )

    document.getElementById(
      'scheduleSection'
    ).classList.remove(
      'd-none'
    )

    programModal?.show()
  } catch (error) {
    showError(
      error.message ||
      'Failed to load Program.'
    )
  }
}


window.deleteProgram =
async function (
  programId
) {
  clearError()

  try {
    const count =
      await countProgramSchedules(
        programId
      )

    const message =
      count > 0 ?
        `This Program has ${count} schedule(s).\n\nDeleting this Program will also delete all of its Schedules.\n\nDo you want to continue?` :
        'Delete this Program?'

    const confirmed =
      await confirmAction({
        title:
          'Confirm Delete',
        message,
        confirmText:
          'Delete',
        type:
          'warning'
      })

    if (!confirmed) {
      return
    }

    await deleteProgramRecord(
      programId
    )

    const scheduleTable =
      document.getElementById(
        'scheduleTableBody'
      )

    if (scheduleTable) {
      scheduleTable.innerHTML = ''
    }

    document.getElementById(
      'scheduleSection'
    )?.classList.add(
      'd-none'
    )

    clearProgramForm()

    await loadPrograms()

    showSuccess(
      'Program deleted successfully.'
    )
  } catch (error) {
    showError(
      error.message ||
      'Failed to delete Program.'
    )
  }
}


async function loadSelectedProgram(
  programId
) {
  const data =
    await getProgramSummary(
      programId
    )

  document.getElementById(
    'selectedProgramName'
  ).value =
    data.program_name

  document.getElementById(
    'selectedProgramCode'
  ).value =
    data.program_code

  document.getElementById(
    'selectedProgramDuration'
  ).value =
    `${data.program_duration_days} Day(s)`

  document.getElementById(
    'selectedProgramInterval'
  ).value =
    data
      .recurrence_type_master
      ?.recurrence_name || ''

  document.getElementById(
    'selectedProgramStatus'
  ).value =
    data.active ?
      'Active' :
      'Inactive'
}


// =====================================================
// PROGRAM SCHEDULE MANAGEMENT
// =====================================================

window.manageSchedules =
async function (

  programId

) {
  clearError()

  document
        .getElementById(
          'scheduleProgramId'
        )
        .value =
        programId

  clearScheduleForm()
  await loadSelectedProgram(

    programId

  )

  document
        .getElementById(
          'scheduleId'
        )
        .value =
        ''

  const scheduleTable =
        document
            .getElementById(
              'scheduleTableBody'
            )

  if (

    scheduleTable

  ) {
    scheduleTable.innerHTML = ''
  }

  await loadSchedules(

    programId

  )

  document
        .getElementById(
          'scheduleSection'
        )
        .classList
        .remove(
          'd-none'
        )

  programModal.show()
}


async function loadSchedules(
  programId
) {
  const tbody =
    document.getElementById(
      'scheduleTableBody'
    )

  if (!tbody) {
    return
  }

  tbody.innerHTML = ''

  const schedules =
    await listProgramSchedules(
      programId
    )

  if (schedules.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="text-center text-muted"
        >
          No schedules defined.
        </td>
      </tr>
    `

    return
  }

  for (const schedule of schedules) {
    const day =
      new Date(
        schedule.schedule_start_date
      ).toLocaleDateString(
        'en-US',
        {
          weekday: 'long'
        }
      )

    tbody.innerHTML += `
      <tr>
        <td>${schedule.schedule_name}</td>
        <td>${schedule.schedule_start_date}</td>
        <td>${day}</td>
        <td>${schedule.schedule_end_date || ''}</td>
        <td>
          ${schedule.start_time || ''}
          -
          ${schedule.end_time || ''}
        </td>
        ${buildStatusCell(
          getActiveBadge(
            schedule.active
          )
        )}
        ${buildActionCell(
          buildActionButtons({
            buttons: [
              {
                type: 'edit',
                onClick:
                  `editSchedule('${schedule.program_schedule_id}')`
              }
            ]
          })
        )}
      </tr>
    `
  }
}


function clearScheduleForm() {
  document.getElementById(
    'scheduleId'
  ).value = ''
  document
    .getElementById(
      'scheduleName'
    )
    .value = ''
  document.getElementById(
    'scheduleStartDate'
  ).value = ''

  document.getElementById(
    'scheduleEndDate'
  ).value = ''

  document.getElementById(
    'scheduleStartTime'
  ).value = ''

  document.getElementById(
    'scheduleEndTime'
  ).value = ''

  document.getElementById(
    'scheduleDay'
  ).value = ''
}

function updateScheduleDay() {
  const startDate =

        document
            .getElementById(
              'scheduleStartDate'
            )
            .value

  document
        .getElementById(
          'scheduleDay'
        )
        .value = ''

  if (

    !startDate

  ) {
    return
  }

  const day =

        new Date(

          startDate

        )

        .toLocaleDateString(

          'en-US',

          {

            weekday: 'long'

          }

        )

  document
        .getElementById(
          'scheduleDay'
        )
        .value = day
}

function buildSchedulePayload(
  validate = true
) {
  const payload = {
    program_id:
      document.getElementById(
        'scheduleProgramId'
      ).value,
    schedule_name:
      document.getElementById(
        'scheduleName'
      ).value.trim(),
    schedule_start_date:
      document.getElementById(
        'scheduleStartDate'
      ).value,
    schedule_end_date:
      document.getElementById(
        'scheduleEndDate'
      ).value || null,
    start_time:
      document.getElementById(
        'scheduleStartTime'
      ).value || null,
    end_time:
      document.getElementById(
        'scheduleEndTime'
      ).value || null,
    active: true
  }

  if (validate) {
    const validation =
      validateSchedulePayload(
        payload
      )

    if (!validation.valid) {
      throw new Error(
        validation.message
      )
    }
  }

  return payload
}

// =====================================================
// SCHEDULE VALIDATION
// =====================================================

// =====================================================
// CHECK DUPLICATE SCHEDULE
// =====================================================


// =====================================================
// SAVE / UPDATE PROGRAM SCHEDULE
// =====================================================

async function saveSchedule() {
  clearError()

  try {
    const scheduleId =
      document.getElementById(
        'scheduleId'
      ).value

    const programId =
      document.getElementById(
        'scheduleProgramId'
      ).value

    const scheduleName =
      document.getElementById(
        'scheduleName'
      ).value.trim()

    const payload =
      buildSchedulePayload()

    const exists =
      await scheduleExists(
        programId,
        scheduleName,
        scheduleId || null
      )

    if (exists) {
      showError(
        'A schedule with this name already exists for this Program.'
      )

      return
    }

    await saveScheduleRecord({
      scheduleId:
        scheduleId || null,
      payload
    })

    clearScheduleForm()

    await loadSchedules(
      programId
    )

    showSuccess(
      scheduleId ?
        'Schedule updated successfully.' :
        'Schedule saved successfully.'
    )
  } catch (error) {
    showError(
      error.message ||
      'Failed to save Program Schedule.'
    )
  }
}


// =====================================================
// EDIT PROGRAM SCHEDULE
// =====================================================

window.editSchedule =
async function (
  scheduleId
) {
  clearError()

  try {
    const data =
      await getProgramSchedule(
        scheduleId
      )

    document.getElementById(
      'scheduleId'
    ).value =
      data.program_schedule_id

    document.getElementById(
      'scheduleProgramId'
    ).value =
      data.program_id

    document.getElementById(
      'scheduleName'
    ).value =
      data.schedule_name || ''

    document.getElementById(
      'scheduleStartDate'
    ).value =
      data.schedule_start_date || ''

    updateScheduleDay()

    document.getElementById(
      'scheduleEndDate'
    ).value =
      data.schedule_end_date || ''

    document.getElementById(
      'scheduleStartTime'
    ).value =
      data.start_time || ''

    document.getElementById(
      'scheduleEndTime'
    ).value =
      data.end_time || ''
  } catch (error) {
    showError(
      error.message ||
      'Failed to load Schedule.'
    )
  }
}


// =====================================================
// DELETE PROGRAM SCHEDULE
// =====================================================

window.deleteSchedule =
async function (
  scheduleId
) {
  clearError()

  try {
    const confirmed =
      await confirmAction({
        title:
          'Confirm Delete',
        message:
          'Delete this Program Schedule?',
        confirmText:
          'Delete',
        type:
          'warning'
      })

    if (!confirmed) {
      return
    }

    const programId =
      document.getElementById(
        'scheduleProgramId'
      ).value

    await deleteScheduleRecord(
      scheduleId
    )

    clearScheduleForm()

    await loadSchedules(
      programId
    )

    showSuccess(
      'Schedule deleted successfully.'
    )
  } catch (error) {
    showError(
      error.message ||
      'Failed to delete Schedule.'
    )
  }
}


