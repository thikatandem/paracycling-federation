// =====================================================
// STAFF QUALIFICATIONS / CERTIFICATIONS PAGE CONTROLLER
// ESM controller shared only by the qualification and certification pages.
// Department access and reviews use dedicated controllers.
// =====================================================

import {
  get,
  getValue,
  setValue,
  resetForm,
  populateSelect
} from '../services/domService.js'

import {
  showModal,
  hideModal
} from '../services/modalService.js'

import {
  createPaginator,
  bindPagination,
  updatePaginationUi,
  resetPagination
} from '../services/paginationService.js'

import {
  searchCollection
} from '../services/searchService.js'

import {
  renderEntityTable,
  buildActionButtons,
  buildActionCell,
  buildTextCell
} from '../services/tableRendererService.js'

import {
  formatDate
} from '../services/formattingService.js'

import {
  STAFF_RECORD_TYPES,
  loadStaffRecordLookups,
  listStaffRecords,
  saveStaffRecord,
  deleteStaffRecord,
  getStaffRecordIdField
} from './staffRecordsService.js'

const PAGE_CONFIGS =
  Object.freeze([
    Object.freeze({
      type:
        STAFF_RECORD_TYPES.QUALIFICATION,
      markerId:
        'qualificationsTableBody',
      tableBodyId:
        'qualificationsTableBody',
      searchId:
        'searchQualification',
      addButtonId:
        'btnAddQualification',
      refreshButtonId:
        'btnRefreshQualifications',
      previousButtonId:
        'btnPreviousQualificationPage',
      nextButtonId:
        'btnNextQualificationPage',
      paginationInfoId:
        'qualificationPaginationInfo',
      modalId:
        'qualificationModal',
      modalTitleId:
        'qualificationModalTitle',
      saveButtonId:
        'btnSaveQualification',
      deleteModalId:
        'deleteQualificationModal',
      deleteButtonId:
        'btnConfirmDeleteQualification',
      deleteIdField:
        'deleteQualificationId',
      idField:
        'qualificationId',
      staffSelectId:
        'qualificationStaffId',
      loadingId:
        'qualificationLoading',
      pageFeedbackId:
        'qualificationPageFeedback',
      formFeedbackId:
        'qualificationFormError',
      addTitle:
        'Add Qualification',
      editTitle:
        'Edit Qualification',
      emptyMessage:
        'No staff qualifications found',
      colspan: 10,
      formFields:
        Object.freeze([
          'qualificationId',
          'qualificationStaffId',
          'qualificationName',
          'qualificationLevel',
          'qualificationCredentialNumber',
          'qualificationFieldOfStudy',
          'qualificationInstitution',
          'qualificationAwarded',
          'qualificationExpiry',
          'qualificationDocumentUrl',
          'qualificationNotes'
        ]),
      searchFields:
        Object.freeze([
          'staff_name',
          'staff_code',
          'qualification_name',
          'qualification_level',
          'field_of_study',
          'institution',
          'credential_number',
          'notes'
        ])
    }),
    Object.freeze({
      type:
        STAFF_RECORD_TYPES.CERTIFICATION,
      markerId:
        'certificationsTableBody',
      tableBodyId:
        'certificationsTableBody',
      searchId:
        'searchCertification',
      addButtonId:
        'btnAddCertification',
      refreshButtonId:
        'btnRefreshCertifications',
      previousButtonId:
        'btnPreviousCertificationPage',
      nextButtonId:
        'btnNextCertificationPage',
      paginationInfoId:
        'certificationPaginationInfo',
      modalId:
        'certificationModal',
      modalTitleId:
        'certificationModalTitle',
      saveButtonId:
        'btnSaveCertification',
      deleteModalId:
        'deleteCertificationModal',
      deleteButtonId:
        'btnConfirmDeleteCertification',
      deleteIdField:
        'deleteCertificationId',
      idField:
        'certificationId',
      staffSelectId:
        'certificationStaffId',
      loadingId:
        'certificationLoading',
      pageFeedbackId:
        'certificationPageFeedback',
      formFeedbackId:
        'certificationFormError',
      addTitle:
        'Add Certification',
      editTitle:
        'Edit Certification',
      emptyMessage:
        'No staff certifications found',
      colspan: 10,
      formFields:
        Object.freeze([
          'certificationId',
          'certificationStaffId',
          'certificationName',
          'certificationType',
          'certificationCredentialNumber',
          'issuingBody',
          'issueDate',
          'certificationExpiry',
          'certificationDocumentUrl',
          'certificationRenewalRequired',
          'certificationNotes'
        ]),
      searchFields:
        Object.freeze([
          'staff_name',
          'staff_code',
          'certification_name',
          'certification_type',
          'issuing_body',
          'credential_number',
          'notes'
        ])
    })
  ])

const config =
  PAGE_CONFIGS.find(
    candidate =>
      Boolean(get(candidate.markerId))
  ) || null

const paginator =
  createPaginator()

let allRows = []
let filteredRows = []
let lookups = {
  staff: [],
  staffMap: new Map()
}

function showFeedback(
  id,
  message = '',
  type = 'danger'
) {
  const element = get(id)
  if (!element) {
    return
  }

  if (!message) {
    element.className =
      'alert d-none'
    element.textContent = ''
    return
  }

  element.className =
    `alert alert-${type}`
  element.textContent = message
}

function setLoading(
  active
) {
  get(config?.loadingId)
    ?.classList
    .toggle(
      'd-none',
      !active
    )
}

function staffLabel(
  row
) {
  return (
    row.staff_name ||
    row.staff_code ||
    ''
  )
}

function linkCell(
  url,
  label = 'View'
) {
  if (!url) {
    return buildTextCell('')
  }

  const safeUrl =
    String(url)
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')

  return `
    <td>
      <a
        class="btn btn-sm btn-outline-primary"
        href="${safeUrl}"
        target="_blank"
        rel="noopener noreferrer"
      >
        ${label}
      </a>
    </td>
  `
}

function qualificationRow(
  row
) {
  const buttons =
    buildActionButtons({
      buttons: [
        {
          type: 'edit',
          onClick:
            `editStaffRecord('${row.qualification_id}')`
        },
        {
          type: 'delete',
          onClick:
            `confirmDeleteStaffRecord('${row.qualification_id}')`
        }
      ]
    })

  return `
    <tr>
      ${buildTextCell(staffLabel(row))}
      ${buildTextCell(row.qualification_name)}
      ${buildTextCell(row.qualification_level)}
      ${buildTextCell(row.field_of_study)}
      ${buildTextCell(row.institution)}
      ${buildTextCell(row.credential_number)}
      ${buildTextCell(formatDate(row.date_awarded))}
      ${buildTextCell(formatDate(row.expiry_date))}
      ${linkCell(row.document_url)}
      ${buildActionCell(buttons)}
    </tr>
  `
}

function certificationRow(
  row
) {
  const buttons =
    buildActionButtons({
      buttons: [
        {
          type: 'edit',
          onClick:
            `editStaffRecord('${row.certification_id}')`
        },
        {
          type: 'delete',
          onClick:
            `confirmDeleteStaffRecord('${row.certification_id}')`
        }
      ]
    })

  return `
    <tr>
      ${buildTextCell(staffLabel(row))}
      ${buildTextCell(row.certification_name)}
      ${buildTextCell(row.certification_type)}
      ${buildTextCell(row.issuing_body)}
      ${buildTextCell(row.credential_number)}
      ${buildTextCell(formatDate(row.issue_date))}
      ${buildTextCell(formatDate(row.expiry_date))}
      ${buildTextCell(row.renewal_required ? 'Yes' : 'No')}
      ${linkCell(row.document_url)}
      ${buildActionCell(buttons)}
    </tr>
  `
}

function rowRenderer(
  row
) {
  return config.type ===
    STAFF_RECORD_TYPES.QUALIFICATION ?
    qualificationRow(row) :
    certificationRow(row)
}

function render() {
  const body =
    get(config.tableBodyId)

  if (!body) {
    return
  }

  renderEntityTable({
    tableBody: body,
    data: filteredRows,
    paginator,
    colspan: config.colspan,
    emptyMessage:
      config.emptyMessage,
    rowRenderer
  })

  updatePaginationUi({
    paginator,
    infoElement:
      get(config.paginationInfoId),
    previousButton:
      get(config.previousButtonId),
    nextButton:
      get(config.nextButtonId)
  })
}

function applySearch() {
  const term =
    getValue(config.searchId)
      .trim()

  filteredRows =
    searchCollection({
      data: allRows,
      searchTerm: term,
      fields:
        config.searchFields
    })

  resetPagination(
    paginator
  )
  render()
}

async function loadRows() {
  setLoading(true)
  showFeedback(
    config.pageFeedbackId,
    ''
  )

  try {
    allRows =
      await listStaffRecords(
        config.type,
        { enrich: true }
      )
    filteredRows =
      [...allRows]
    resetPagination(
      paginator
    )
    render()
  } catch (error) {
    showFeedback(
      config.pageFeedbackId,
      error.message || String(error)
    )
  } finally {
    setLoading(false)
  }
}

function populateStaffLookup() {
  populateSelect({
    selectId:
      config.staffSelectId,
    items:
      lookups.staff,
    valueField:
      'staff_id',
    textFormatter:
      person =>
        `${person.staff_code || ''} - ${person.staff_display_name}`,
    placeholder:
      'Select Staff'
  })
}

function clearForm() {
  resetForm({
    fields:
      config.formFields
  })

  if (
    config.type ===
    STAFF_RECORD_TYPES.CERTIFICATION
  ) {
    const renewal =
      get('certificationRenewalRequired')
    if (renewal) {
      renewal.checked = false
    }
  }

  showFeedback(
    config.formFeedbackId,
    ''
  )
}

function openAdd() {
  clearForm()
  const title =
    get(config.modalTitleId)
  if (title) {
    title.textContent =
      config.addTitle
  }
  showModal(config.modalId)
}

function findCurrentRow(
  id
) {
  const idField =
    getStaffRecordIdField(
      config.type
    )

  return allRows.find(
    row =>
      String(row[idField]) ===
      String(id)
  ) || null
}

function editStaffRecord(
  id
) {
  const row =
    findCurrentRow(id)
  if (!row) {
    return
  }

  clearForm()
  setValue(config.idField, id)

  if (
    config.type ===
    STAFF_RECORD_TYPES.QUALIFICATION
  ) {
    setValue(
      'qualificationStaffId',
      row.staff_id || ''
    )
    setValue(
      'qualificationName',
      row.qualification_name || ''
    )
    setValue(
      'qualificationLevel',
      row.qualification_level || ''
    )
    setValue(
      'qualificationFieldOfStudy',
      row.field_of_study || ''
    )
    setValue(
      'qualificationInstitution',
      row.institution || ''
    )
    setValue(
      'qualificationCredentialNumber',
      row.credential_number || ''
    )
    setValue(
      'qualificationAwarded',
      row.date_awarded || ''
    )
    setValue(
      'qualificationExpiry',
      row.expiry_date || ''
    )
    setValue(
      'qualificationDocumentUrl',
      row.document_url || ''
    )
    setValue(
      'qualificationNotes',
      row.notes || ''
    )
  } else {
    setValue(
      'certificationStaffId',
      row.staff_id || ''
    )
    setValue(
      'certificationName',
      row.certification_name || ''
    )
    setValue(
      'certificationType',
      row.certification_type || ''
    )
    setValue(
      'issuingBody',
      row.issuing_body || ''
    )
    setValue(
      'certificationCredentialNumber',
      row.credential_number || ''
    )
    setValue(
      'issueDate',
      row.issue_date || ''
    )
    setValue(
      'certificationExpiry',
      row.expiry_date || ''
    )
    setValue(
      'certificationDocumentUrl',
      row.document_url || ''
    )
    setValue(
      'certificationNotes',
      row.notes || ''
    )
    const renewal =
      get('certificationRenewalRequired')
    if (renewal) {
      renewal.checked =
        Boolean(row.renewal_required)
    }
  }

  const title =
    get(config.modalTitleId)
  if (title) {
    title.textContent =
      config.editTitle
  }

  showModal(config.modalId)
}

function buildPayload() {
  if (
    config.type ===
    STAFF_RECORD_TYPES.QUALIFICATION
  ) {
    return {
      staff_id:
        getValue('qualificationStaffId'),
      qualification_name:
        getValue('qualificationName'),
      qualification_level:
        getValue('qualificationLevel'),
      field_of_study:
        getValue('qualificationFieldOfStudy'),
      institution:
        getValue('qualificationInstitution'),
      credential_number:
        getValue('qualificationCredentialNumber'),
      date_awarded:
        getValue('qualificationAwarded'),
      expiry_date:
        getValue('qualificationExpiry'),
      document_url:
        getValue('qualificationDocumentUrl'),
      notes:
        getValue('qualificationNotes')
    }
  }

  return {
    staff_id:
      getValue('certificationStaffId'),
    certification_name:
      getValue('certificationName'),
    certification_type:
      getValue('certificationType'),
    issuing_body:
      getValue('issuingBody'),
    credential_number:
      getValue('certificationCredentialNumber'),
    issue_date:
      getValue('issueDate'),
    expiry_date:
      getValue('certificationExpiry'),
    renewal_required:
      Boolean(
        get('certificationRenewalRequired')
          ?.checked
      ),
    document_url:
      getValue('certificationDocumentUrl'),
    notes:
      getValue('certificationNotes')
  }
}

async function saveCurrent() {
  showFeedback(
    config.formFeedbackId,
    ''
  )

  try {
    await saveStaffRecord({
      type: config.type,
      id:
        getValue(config.idField) || null,
      payload:
        buildPayload()
    })

    hideModal(config.modalId)
    await loadRows()
    showFeedback(
      config.pageFeedbackId,
      'Record saved successfully.',
      'success'
    )
  } catch (error) {
    showFeedback(
      config.formFeedbackId,
      error.message || String(error)
    )
  }
}

function confirmDeleteStaffRecord(
  id
) {
  setValue(
    config.deleteIdField,
    id
  )
  showModal(
    config.deleteModalId
  )
}

async function deleteCurrent() {
  try {
    await deleteStaffRecord({
      type:
        config.type,
      id:
        getValue(
          config.deleteIdField
        )
    })

    hideModal(
      config.deleteModalId
    )
    await loadRows()
    showFeedback(
      config.pageFeedbackId,
      'Record deleted successfully.',
      'success'
    )
  } catch (error) {
    showFeedback(
      config.pageFeedbackId,
      error.message || String(error)
    )
  }
}

async function initialize() {
  if (!config) {
    return
  }

  try {
    lookups =
      await loadStaffRecordLookups()
    populateStaffLookup()

    bindPagination({
      paginator,
      previousButtonId:
        config.previousButtonId,
      nextButtonId:
        config.nextButtonId,
      infoElementId:
        config.paginationInfoId,
      onChange: render
    })

    get(config.addButtonId)
      ?.addEventListener(
        'click',
        openAdd
      )
    get(config.refreshButtonId)
      ?.addEventListener(
        'click',
        loadRows
      )
    get(config.searchId)
      ?.addEventListener(
        'input',
        applySearch
      )
    get(config.saveButtonId)
      ?.addEventListener(
        'click',
        saveCurrent
      )
    get(config.deleteButtonId)
      ?.addEventListener(
        'click',
        deleteCurrent
      )

    window.editStaffRecord =
      editStaffRecord
    window.confirmDeleteStaffRecord =
      confirmDeleteStaffRecord

    await loadRows()
  } catch (error) {
    showFeedback(
      config.pageFeedbackId,
      error.message || String(error)
    )
  }
}

document.addEventListener(
  'DOMContentLoaded',
  initialize
)
