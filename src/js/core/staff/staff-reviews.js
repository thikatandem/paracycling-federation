import {
  get,
  getValue,
  setValue
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
  loadReviewLookups,
  loadReviewTemplates,
  loadReviewCriteria,
  saveReviewTemplate,
  listStaffReviews,
  loadStaffReview,
  saveStaffReview,
  deleteStaffReview
} from './staffReviewService.js'

const paginator =
  createPaginator()

let lookups = {
  staff: [],
  reviewers: [],
  templates: []
}
let rows = []
let filteredRows = []
let activeCriteria = []

function escapeHtml(
  value
) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function showFeedback(
  id,
  message,
  type = 'danger'
) {
  const element = get(id)
  if (!element) {
    return
  }

  if (!message) {
    element.className = 'alert d-none'
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
  get('reviewLoading')
    ?.classList
    .toggle('d-none', !active)
}

function populateSelect({
  id,
  items,
  valueField,
  textField,
  placeholder
}) {
  const select = get(id)
  if (!select) {
    return
  }

  select.innerHTML = ''
  const empty =
    document.createElement('option')
  empty.value = ''
  empty.textContent = placeholder
  select.append(empty)

  for (const item of items) {
    const option =
      document.createElement('option')
    option.value = item[valueField] || ''
    option.textContent = item[textField] || ''
    select.append(option)
  }
}

function refreshSelects() {
  populateSelect({
    id: 'reviewStaffId',
    items: lookups.staff,
    valueField: 'staff_id',
    textField: 'display_name',
    placeholder: 'Select Staff'
  })
  populateSelect({
    id: 'reviewerProfileId',
    items: lookups.reviewers,
    valueField: 'profile_id',
    textField: 'display_name',
    placeholder: 'Select Reviewer'
  })
  populateSelect({
    id: 'reviewTemplateId',
    items: lookups.templates,
    valueField: 'review_template_id',
    textField: 'template_name',
    placeholder: 'Select Review Template'
  })
}

function formatPeriod(
  row
) {
  if (
    !row.review_period_start &&
    !row.review_period_end
  ) {
    return '-'
  }

  return `${row.review_period_start || '?'} — ${row.review_period_end || '?'}`
}

function renderRows() {
  const tbody = get('reviewsTableBody')
  if (!tbody) {
    return
  }

  paginator.setData(filteredRows)
  const pageRows = paginator.getPage()
  tbody.innerHTML = ''

  if (!pageRows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center">No staff reviews found</td>
      </tr>
    `
  } else {
    for (const row of pageRows) {
      tbody.insertAdjacentHTML(
        'beforeend',
        `
          <tr>
            <td>${escapeHtml(row.staff_name)}</td>
            <td>${escapeHtml(formatPeriod(row))}</td>
            <td>${escapeHtml(row.review_date || '')}</td>
            <td>${escapeHtml(row.reviewer_name)}</td>
            <td>${escapeHtml(row.template_name || 'No template')}</td>
            <td>${row.score === null || row.score === undefined ? '-' : `${Number(row.score).toFixed(2)}%`}</td>
            <td>${escapeHtml(row.review_status || '')}</td>
            <td>${escapeHtml(row.next_review_date || '')}</td>
            <td>
              <button
                type="button"
                class="btn btn-sm btn-warning me-1"
                onclick="editStaffReview('${row.review_id}')"
              >Edit</button>
              <button
                type="button"
                class="btn btn-sm btn-danger"
                onclick="confirmDeleteStaffReview('${row.review_id}')"
              >Delete</button>
            </td>
          </tr>
        `
      )
    }
  }

  updatePaginationUi({
    paginator,
    infoElement: get('reviewPaginationInfo'),
    previousButton: get('btnPreviousReviewPage'),
    nextButton: get('btnNextReviewPage')
  })
}

function applySearch() {
  const term =
    String(getValue('searchReview') || '')
      .trim()
      .toLowerCase()

  filteredRows = !term ?
    [...rows] :
    rows.filter(row =>
      [
        row.staff_name,
        row.reviewer_name,
        row.template_name,
        row.review_status,
        row.review_date,
        row.comments,
        row.strengths,
        row.goals
      ].some(value =>
        String(value || '')
          .toLowerCase()
          .includes(term)
      )
    )

  resetPagination(paginator)
  renderRows()
}

async function loadRows() {
  setLoading(true)
  showFeedback('reviewPageFeedback', '')

  try {
    rows = await listStaffReviews()
    filteredRows = [...rows]
    renderRows()
  } catch (error) {
    showFeedback(
      'reviewPageFeedback',
      error.message || String(error)
    )
  } finally {
    setLoading(false)
  }
}

function clearReviewForm() {
  for (const id of [
    'reviewId',
    'reviewStaffId',
    'reviewTemplateId',
    'reviewDate',
    'reviewPeriodStart',
    'reviewPeriodEnd',
    'reviewerProfileId',
    'reviewNextDate',
    'reviewStrengths',
    'reviewImprovementAreas',
    'reviewGoals',
    'reviewTrainingNeeds',
    'reviewComments',
    'reviewEmployeeComments'
  ]) {
    setValue(id, '')
  }
  setValue('reviewStatus', 'DRAFT')
  activeCriteria = []
  get('reviewCriteriaContainer').innerHTML =
    '<div class="text-muted">Choose a review template to load its criteria.</div>'
  get('reviewOverallScore').value = ''
  showFeedback('reviewFormError', '')
}

function renderCriteria(
  criteria,
  ratingMap = new Map()
) {
  const container =
    get('reviewCriteriaContainer')

  activeCriteria = criteria

  if (!criteria.length) {
    container.innerHTML = `
      <div class="alert alert-warning mb-0">
        This template has no active criteria. Use Manage Review Templates first.
      </div>
    `
    return
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-bordered align-middle">
        <thead>
          <tr>
            <th>Criterion</th>
            <th style="width:100px">Weight</th>
            <th style="width:150px">Score</th>
            <th>Evidence / Reviewer Comment</th>
          </tr>
        </thead>
        <tbody>
          ${criteria.map(criterion => {
            const rating =
              ratingMap.get(
                criterion.review_criterion_id
              ) || {}
            return `
              <tr data-criterion-id="${criterion.review_criterion_id}">
                <td>
                  <strong>${escapeHtml(criterion.criterion_name)}</strong>
                  <span class="d-block small text-muted">${escapeHtml(criterion.criterion_code)}</span>
                  ${criterion.description ? `<span class="d-block small mt-1">${escapeHtml(criterion.description)}</span>` : ''}
                </td>
                <td>${Number(criterion.weight)}</td>
                <td>
                  <input
                    type="number"
                    class="form-control review-rating-score"
                    min="0"
                    max="${Number(criterion.max_score)}"
                    step="0.01"
                    data-criterion-id="${criterion.review_criterion_id}"
                    value="${rating.score ?? ''}"
                    placeholder="0-${Number(criterion.max_score)}"
                  >
                </td>
                <td>
                  <textarea
                    class="form-control review-rating-comment"
                    rows="2"
                    data-criterion-id="${criterion.review_criterion_id}"
                  >${escapeHtml(rating.comments || '')}</textarea>
                </td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    </div>
  `

  for (const input of container.querySelectorAll('.review-rating-score')) {
    input.addEventListener(
      'input',
      updateDisplayedOverall
    )
  }
  updateDisplayedOverall()
}

function readRatings() {
  const container = get('reviewCriteriaContainer')

  return activeCriteria.map(criterion => ({
    review_criterion_id:
      criterion.review_criterion_id,
    score:
      container.querySelector(
        `.review-rating-score[data-criterion-id="${criterion.review_criterion_id}"]`
      )?.value ?? '',
    comments:
      container.querySelector(
        `.review-rating-comment[data-criterion-id="${criterion.review_criterion_id}"]`
      )?.value ?? ''
  }))
}

function calculatePreviewOverall() {
  const ratings = readRatings()
  const criteriaMap = new Map(
    activeCriteria.map(row => [
      row.review_criterion_id,
      row
    ])
  )

  let weighted = 0
  let totalWeight = 0

  for (const rating of ratings) {
    if (rating.score === '') {
      continue
    }

    const criterion =
      criteriaMap.get(rating.review_criterion_id)
    const score = Number(rating.score)
    const maxScore = Number(criterion?.max_score)
    const weight = Number(criterion?.weight)

    if (
      !Number.isFinite(score) ||
      !Number.isFinite(maxScore) ||
      !Number.isFinite(weight) ||
      maxScore <= 0 ||
      weight <= 0
    ) {
      continue
    }

    weighted += (score / maxScore) * weight
    totalWeight += weight
  }

  return totalWeight ?
    (weighted / totalWeight) * 100 :
    null
}

function updateDisplayedOverall() {
  const score = calculatePreviewOverall()
  get('reviewOverallScore').value =
    score === null ?
      '' :
      `${score.toFixed(2)}%`
}

async function loadTemplateCriteria(
  ratingMap = new Map()
) {
  const templateId =
    getValue('reviewTemplateId')

  if (!templateId) {
    renderCriteria([])
    return
  }

  const criteria =
    await loadReviewCriteria(templateId)
  renderCriteria(criteria, ratingMap)
}

async function openAddReview() {
  clearReviewForm()
  showModal('reviewModal')
}

async function editStaffReview(
  reviewId
) {
  clearReviewForm()

  const { review, ratings } =
    await loadStaffReview(reviewId)

  setValue('reviewId', review.review_id)
  setValue('reviewStaffId', review.staff_id || '')
  setValue('reviewTemplateId', review.review_template_id || '')
  setValue('reviewDate', review.review_date || '')
  setValue('reviewPeriodStart', review.review_period_start || '')
  setValue('reviewPeriodEnd', review.review_period_end || '')
  setValue('reviewerProfileId', review.reviewer_profile_id || '')
  setValue('reviewStatus', review.review_status || 'DRAFT')
  setValue('reviewNextDate', review.next_review_date || '')
  setValue('reviewStrengths', review.strengths || '')
  setValue('reviewImprovementAreas', review.improvement_areas || '')
  setValue('reviewGoals', review.goals || '')
  setValue('reviewTrainingNeeds', review.training_needs || '')
  setValue('reviewComments', review.comments || '')
  setValue('reviewEmployeeComments', review.employee_comments || '')

  const ratingMap = new Map(
    ratings.map(row => [
      row.review_criterion_id,
      row
    ])
  )

  await loadTemplateCriteria(ratingMap)
  showModal('reviewModal')
}

async function saveCurrentReview() {
  showFeedback('reviewFormError', '')

  try {
    await saveStaffReview({
      reviewId:
        getValue('reviewId') || null,
      staffId:
        getValue('reviewStaffId'),
      reviewTemplateId:
        getValue('reviewTemplateId'),
      reviewDate:
        getValue('reviewDate'),
      reviewPeriodStart:
        getValue('reviewPeriodStart') || null,
      reviewPeriodEnd:
        getValue('reviewPeriodEnd') || null,
      reviewerProfileId:
        getValue('reviewerProfileId'),
      reviewStatus:
        getValue('reviewStatus'),
      nextReviewDate:
        getValue('reviewNextDate') || null,
      strengths:
        getValue('reviewStrengths'),
      improvementAreas:
        getValue('reviewImprovementAreas'),
      goals:
        getValue('reviewGoals'),
      trainingNeeds:
        getValue('reviewTrainingNeeds'),
      reviewerComments:
        getValue('reviewComments'),
      employeeComments:
        getValue('reviewEmployeeComments'),
      ratings:
        readRatings()
    })

    hideModal('reviewModal')
    lookups = await loadReviewLookups()
    refreshSelects()
    await loadRows()
    showFeedback(
      'reviewPageFeedback',
      'Review saved successfully.',
      'success'
    )
  } catch (error) {
    showFeedback(
      'reviewFormError',
      error.message || String(error)
    )
  }
}

function confirmDeleteStaffReview(
  reviewId
) {
  setValue('deleteReviewId', reviewId)
  showModal('deleteReviewModal')
}

async function deleteCurrentReview() {
  try {
    await deleteStaffReview(
      getValue('deleteReviewId')
    )
    hideModal('deleteReviewModal')
    await loadRows()
    showFeedback(
      'reviewPageFeedback',
      'Review deleted successfully.',
      'success'
    )
  } catch (error) {
    showFeedback(
      'reviewPageFeedback',
      error.message || String(error)
    )
  }
}

function newCriterionRow(
  criterion = {}
) {
  const tbody =
    get('reviewTemplateCriteriaBody')

  const row = document.createElement('tr')
  row.dataset.criterionId =
    criterion.review_criterion_id || ''
  row.innerHTML = `
    <td>
      <input class="form-control criterion-code" value="${escapeHtml(criterion.criterion_code || '')}">
    </td>
    <td>
      <input class="form-control criterion-name" value="${escapeHtml(criterion.criterion_name || '')}">
    </td>
    <td>
      <textarea class="form-control criterion-description" rows="2">${escapeHtml(criterion.description || '')}</textarea>
    </td>
    <td>
      <input type="number" min="0.01" step="0.01" class="form-control criterion-weight" value="${criterion.weight ?? 1}">
    </td>
    <td>
      <input type="number" min="0.01" step="0.01" class="form-control criterion-max-score" value="${criterion.max_score ?? 5}">
    </td>
    <td>
      <button type="button" class="btn btn-sm btn-outline-danger remove-criterion">Remove</button>
    </td>
  `

  row.querySelector('.remove-criterion')
    .addEventListener(
      'click',
      () => row.remove()
    )

  tbody.append(row)
}

function clearTemplateForm() {
  for (const id of [
    'reviewTemplateAdminId',
    'reviewTemplateCode',
    'reviewTemplateName',
    'reviewTemplateDescription'
  ]) {
    setValue(id, '')
  }
  get('reviewTemplateActive').checked = true
  get('reviewTemplateCriteriaBody').innerHTML = ''
  newCriterionRow()
  showFeedback('reviewTemplateFeedback', '')
}

async function renderTemplateTable() {
  const templates =
    await loadReviewTemplates({
      includeInactive: true
    })

  const tbody =
    get('reviewTemplatesTableBody')
  tbody.innerHTML = ''

  for (const template of templates) {
    tbody.insertAdjacentHTML(
      'beforeend',
      `
        <tr>
          <td>${escapeHtml(template.template_code)}</td>
          <td>${escapeHtml(template.template_name)}</td>
          <td>${template.is_active ? 'Active' : 'Inactive'}</td>
          <td>
            <button
              type="button"
              class="btn btn-sm btn-warning"
              onclick="editReviewTemplate('${template.review_template_id}')"
            >Edit</button>
          </td>
        </tr>
      `
    )
  }
}

async function openTemplateManager() {
  clearTemplateForm()
  await renderTemplateTable()
  showModal('reviewTemplateModal')
}

async function editReviewTemplate(
  templateId
) {
  const templates =
    await loadReviewTemplates({
      includeInactive: true
    })
  const template =
    templates.find(row =>
      row.review_template_id === templateId
    )

  if (!template) {
    return
  }

  setValue(
    'reviewTemplateAdminId',
    template.review_template_id
  )
  setValue(
    'reviewTemplateCode',
    template.template_code
  )
  setValue(
    'reviewTemplateName',
    template.template_name
  )
  setValue(
    'reviewTemplateDescription',
    template.description || ''
  )
  get('reviewTemplateActive').checked =
    Boolean(template.is_active)

  const criteria =
    await loadReviewCriteria(
      templateId,
      {
        includeInactive: true
      }
    )

  const tbody =
    get('reviewTemplateCriteriaBody')
  tbody.innerHTML = ''

  for (const criterion of criteria.filter(row => row.is_active)) {
    newCriterionRow(criterion)
  }

  if (!tbody.children.length) {
    newCriterionRow()
  }
}

function readTemplateCriteria() {
  return [
    ...get('reviewTemplateCriteriaBody')
      .querySelectorAll('tr')
  ].map((row, index) => ({
    review_criterion_id:
      row.dataset.criterionId || null,
    criterion_code:
      row.querySelector('.criterion-code').value,
    criterion_name:
      row.querySelector('.criterion-name').value,
    description:
      row.querySelector('.criterion-description').value,
    weight:
      row.querySelector('.criterion-weight').value,
    max_score:
      row.querySelector('.criterion-max-score').value,
    sort_order:
      index
  }))
}

async function saveTemplate() {
  showFeedback('reviewTemplateFeedback', '')

  try {
    await saveReviewTemplate({
      reviewTemplateId:
        getValue('reviewTemplateAdminId') || null,
      templateCode:
        getValue('reviewTemplateCode'),
      templateName:
        getValue('reviewTemplateName'),
      description:
        getValue('reviewTemplateDescription'),
      isActive:
        Boolean(get('reviewTemplateActive')?.checked),
      criteria:
        readTemplateCriteria()
    })

    lookups = await loadReviewLookups()
    refreshSelects()
    clearTemplateForm()
    await renderTemplateTable()
    showFeedback(
      'reviewTemplateFeedback',
      'Review template saved successfully.',
      'success'
    )
  } catch (error) {
    showFeedback(
      'reviewTemplateFeedback',
      error.message || String(error)
    )
  }
}

async function initialize() {
  try {
    lookups = await loadReviewLookups()
    refreshSelects()

    bindPagination({
      paginator,
      previousButtonId: 'btnPreviousReviewPage',
      nextButtonId: 'btnNextReviewPage',
      infoElementId: 'reviewPaginationInfo',
      onChange: renderRows
    })

    get('searchReview')
      ?.addEventListener('input', applySearch)
    get('btnRefreshReviews')
      ?.addEventListener('click', loadRows)
    get('btnAddReview')
      ?.addEventListener('click', openAddReview)
    get('btnManageReviewTemplates')
      ?.addEventListener('click', openTemplateManager)
    get('reviewTemplateId')
      ?.addEventListener('change', () =>
        loadTemplateCriteria()
          .catch(error =>
            showFeedback(
              'reviewFormError',
              error.message || String(error)
            )
          )
      )
    get('btnSaveReview')
      ?.addEventListener('click', saveCurrentReview)
    get('btnConfirmDeleteReview')
      ?.addEventListener('click', deleteCurrentReview)
    get('btnAddReviewCriterion')
      ?.addEventListener('click', () => newCriterionRow())
    get('btnNewReviewTemplate')
      ?.addEventListener('click', clearTemplateForm)
    get('btnSaveReviewTemplate')
      ?.addEventListener('click', saveTemplate)

    window.editStaffReview = editStaffReview
    window.confirmDeleteStaffReview = confirmDeleteStaffReview
    window.editReviewTemplate = editReviewTemplate

    await loadRows()
  } catch (error) {
    showFeedback(
      'reviewPageFeedback',
      error.message || String(error)
    )
  }
}

document.addEventListener(
  'DOMContentLoaded',
  initialize
)
