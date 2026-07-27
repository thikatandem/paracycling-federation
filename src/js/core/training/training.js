import {
  getProgramsForEvent
} from '../programs/programService.js'

/* eslint camelcase: 0 */
import {
  loadTrainingEventOptions } from '../services/lookupService.js'
import { createSimplePaginationUpdater } from '../services/paginationService.js'
import { createLoadingController } from '../services/uiService.js'
import { getInputValue as getValue,
  setFalsyEmptyValue as setValue } from '../services/domService.js'
import { showInlineError,
  createFeedbackController } from '../services/feedbackService.js'
import { PAGE_SIZE } from '../services/constants.js'
import { getDb } from '../supabase/getDb.js'
import { createModal,
  hideModal
} from '../services/modalService.js'
const loadTrainingEvents = () =>
  loadTrainingEventOptions({
    selectId: 'eventId',
    onLoad: data => {
      events = data
    }
  })

const {
  show: showLoading,
  hide: hideLoading
} = createLoadingController(
  'trainingLoading'
)

const trainingFeedback =
  createFeedbackController({
    containerId: 'trainingFormError',
    errorOptions: {
      sticky: true
    }
  })

const showError =
  trainingFeedback.error
    .bind(trainingFeedback)

const clearError =
  trainingFeedback.clear
    .bind(trainingFeedback)

const updatePagination =
  createSimplePaginationUpdater({
    getItemCount: () =>
      filteredTrainingLogs.length,
    getCurrentPage: () =>
      currentPage,
    pageSize: PAGE_SIZE,
    infoElementId:
      'paginationInfo',
    previousButtonId:
      'btnPreviousPage',
    nextButtonId:
      'btnNextPage'
  })

const db =
  getDb()

let trainingLogs = []

let filteredTrainingLogs = []

let events = []

let programs = []

const participants = []

let currentPage = 1

const trainingLoading =
  document.getElementById(
    'trainingLoading'
  )

const trainingFormError =
  document.getElementById(
    'trainingFormError'
  )

const trainingTableBody =
  document.getElementById(
    'trainingTableBody'
  )

const searchTraining =
  document.getElementById(
    'searchTraining'
  )

const paginationInfo =
  document.getElementById(
    'paginationInfo'
  )







async function loadPrograms(
  eventId
) {
  programs =
    await getProgramsForEvent(
      eventId
    )

  const select =
    document.getElementById(
      'programId'
    )

  if (!select) {
    return
  }

  select.innerHTML =
    `
    <option value="">
      Select Program
    </option>
    `

  for (
    const program
    of programs
  ) {
    select.innerHTML += `
      <option
        value="${program.program_id}"
      >
        ${program.program_name}
      </option>
    `
  }
}

async function loadTrainingLogs() {
  try {
    showLoading()

    const {
      data,
      error
    } =
      await db
        .from(
          'training_log'
        )
        .select(`
          *,
          teams(
            team_name
          )
        `)
        .order(
          'training_date',
          {
            ascending: false
          }
        )

    if (error) {
      throw error
    }

    trainingLogs =
      data || []

    filteredTrainingLogs =
      [...trainingLogs]

    renderTrainingLogs()
  } catch (error) {

    showInlineError(
      'Failed to load training logs'
    )
  } finally {
    hideLoading()
  }
}

function renderTrainingLogs() {
  if (
    !trainingTableBody
  ) {
    return
  }

  const start =
    (
      currentPage - 1
    ) * PAGE_SIZE

  const end =
    start + PAGE_SIZE

  const pageRows =
    filteredTrainingLogs.slice(
      start,
      end
    )

  trainingTableBody.innerHTML =
    ''

  if (
    pageRows.length === 0
  ) {
    trainingTableBody.innerHTML =
      `
      <tr>

        <td
          colspan="8"
          class="text-center"
        >
          No Training Records Found
        </td>

      </tr>
      `

    updatePagination()

    return
  }

  for (
    const training
    of pageRows
  ) {
    trainingTableBody.innerHTML += `
      <tr>

        <td>
          ${
  training.training_date || ''
}
        </td>

        <td>
          ${
  training.teams
              ?.team_name || ''
}
        </td>

        <td>
          ${
  training.session_type || ''
}
        </td>

        <td>
          ${
  training.distance_km || 0
}
        </td>

        <td>
          ${
  training.duration_minutes || 0
}
        </td>

        <td>
          ${
  training.attendance ?
    'Present' :
    'Absent'
}
        </td>

        <td>
          ${
  training.notes || ''
}
        </td>

        <td>

          <button
            class="btn btn-sm btn-warning me-1"
            onclick="editTraining('${training.training_id}')"
          >
            Edit
          </button>

          <button
            class="btn btn-sm btn-danger"
            onclick="confirmDeleteTraining('${training.training_id}')"
          >
            Delete
          </button>

        </td>

      </tr>
    `
  }

  updatePagination()
}


function searchTrainingLogs() {
  const search =
    (
      searchTraining?.value || ''
    )
      .trim()
      .toLowerCase()

  filteredTrainingLogs =

    search ?

      trainingLogs.filter(
        training => {
          return (

            (
              training.teams
                ?.team_name || ''
            )
              .toLowerCase()
              .includes(search) ||

            (
              training.session_type || ''
            )
              .toLowerCase()
              .includes(search) ||

            (
              training.notes || ''
            )
              .toLowerCase()
              .includes(search)

          )
        }
      ) :

      [...trainingLogs]

  currentPage = 1

  renderTrainingLogs()
}

function clearTrainingForm() {
  clearError()

  setValue(
    'trainingId',
    ''
  )

  setValue(
    'teamId',
    ''
  )

  setValue(
    'sessionType',
    ''
  )

  setValue(
    'distanceKm',
    ''
  )

  setValue(
    'durationMinutes',
    ''
  )

  setValue(
    'notes',
    ''
  )

  setValue(
    'attendance',
    'true'
  )

  setValue(
    'trainingDate',
    new Date()
      .toISOString()
      .split('T')[0]
  )
}

function openNewTrainingModal() {
  clearTrainingForm()

  const modal =
    createModal('trainingModal')

  modal.show()
}

function validateTraining() {
  clearError()

  if (
    !getValue(
      'trainingDate'
    )
  ) {
    showError(
      'Training Date is required'
    )

    return false
  }

  if (
    !getValue(
      'teamId'
    )
  ) {
    showError(
      'Team is required'
    )

    return false
  }

  if (
    !getValue(
      'sessionType'
    )
  ) {
    showError(
      'Session Type is required'
    )

    return false
  }

  if (
    !getValue(
      'distanceKm'
    )
  ) {
    showError(
      'Distance is required'
    )

    return false
  }

  if (
    !getValue(
      'durationMinutes'
    )
  ) {
    showError(
      'Duration is required'
    )

    return false
  }

  if (
    getValue(
      'attendance'
    ) === ''
  ) {
    showError(
      'Attendance is required'
    )

    return false
  }

  return true
}

async function saveTraining() {
  try {
    if (
      !validateTraining()
    ) {
      return
    }

    const trainingId =
      getValue(
        'trainingId'
      )

    const payload = {

      training_date:
        getValue(
          'trainingDate'
        ),

      participant_id:
  getValue(
    'participantId'
  ),

      session_type:
        getValue(
          'sessionType'
        ),

      distance_km:
        Number(
          getValue(
            'distanceKm'
          )
        ),

      duration_minutes:
        Number(
          getValue(
            'durationMinutes'
          )
        ),

      attendance:
        getValue(
          'attendance'
        ) === 'true',

      notes:
        getValue(
          'notes'
        )
    }

    let error

    if (
      trainingId
    ) {
      const response =
        await db
          .from(
            'training_log'
          )
          .update(
            payload
          )
          .eq(
            'training_id',
            trainingId
          )

      error =
        response.error
    } else {
      const response =
        await db
          .from(
            'training_log'
          )
          .insert(
            payload
          )

      error =
        response.error
    }

    if (
      error
    ) {
      throw error
    }

    hideModal(
      'trainingModal'
    )

    await loadTrainingLogs()
  } catch (
    error
  ) {

    showError(
      error.message
    )
  }
}

window.editTraining =
function (
  trainingId
) {
  const training =
    trainingLogs.find(
      item =>
        item.training_id ===
        trainingId
    )

  if (
    !training
  ) {
    return
  }

  clearError()

  setValue(
    'trainingId',
    training.training_id
  )

  setValue(
    'trainingDate',
    training.training_date
  )

  setValue(
    'teamId',
    training.team_id
  )

  setValue(
    'sessionType',
    training.session_type
  )

  setValue(
    'distanceKm',
    training.distance_km
  )

  setValue(
    'durationMinutes',
    training.duration_minutes
  )

  setValue(
    'attendance',
    training.attendance ?
      'true' :
      'false'
  )

  setValue(
    'notes',
    training.notes
  )

  const modal =
    createModal('trainingModal')

  modal.show()
}

window.confirmDeleteTraining =
function (
  trainingId
) {
  setValue(
    'deleteTrainingId',
    trainingId
  )

  const modal =
    createModal('deleteTrainingModal')

  modal.show()
}

async function deleteTraining() {
  try {
    const trainingId =
      getValue(
        'deleteTrainingId'
      )

    const {
      error
    } =
      await db
        .from(
          'training_log'
        )
        .delete()
        .eq(
          'training_id',
          trainingId
        )

    if (
      error
    ) {
      throw error
    }

    hideModal(
      'deleteTrainingModal'
    )

    await loadTrainingLogs()
  } catch (
    error
  ) {

    showInlineError(
      error.message
    )
  }
}

function wireEvents() {
  document
    .getElementById(
      'btnAddTraining'
    )
    ?.addEventListener(
      'click',
      openNewTrainingModal
    )

  document
    .getElementById(
      'btnSaveTraining'
    )
    ?.addEventListener(
      'click',
      saveTraining
    )

  document
    .getElementById(
      'btnRefreshTraining'
    )
    ?.addEventListener(
      'click',
      loadTrainingLogs
    )

  document
    .getElementById(
      'btnConfirmDeleteTraining'
    )
    ?.addEventListener(
      'click',
      deleteTraining
    )

  searchTraining
    ?.addEventListener(
      'input',
      searchTrainingLogs
    )

  document
    .getElementById(
      'btnPreviousPage'
    )
    ?.addEventListener(
      'click',
      () => {
        if (
          currentPage > 1
        ) {
          currentPage--

          renderTrainingLogs()
        }
      }
    )

  document
    .getElementById(
      'btnNextPage'
    )
    ?.addEventListener(
      'click',
      () => {
        const totalPages =
          Math.max(
            1,
            Math.ceil(
              filteredTrainingLogs.length /
              PAGE_SIZE
            )
          )

        if (
          currentPage <
          totalPages
        ) {
          currentPage++

          renderTrainingLogs()
        }
      }
    )
}

async function initializeTrainingLogs() {
  try {
    await loadTrainingEvents()

    await loadTrainingLogs()

    wireEvents()
  } catch (
    error
  ) {

    showInlineError(
      error.message
    )
  }
}

document.addEventListener(
  'DOMContentLoaded',
  initializeTrainingLogs
)
