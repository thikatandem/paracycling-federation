import {
  getDb
} from '../supabase/getDb.js'

import {
  getProfile
} from '../auth/authStateService.js'

function actorId() {
  return getProfile()?.profile_id || null
}

function now() {
  return new Date().toISOString()
}

function requireValue(
  value,
  label
) {
  if (!String(value || '').trim()) {
    throw new Error(
      `${label} is required.`
    )
  }
}

function normalizeText(
  value
) {
  return String(value || '').trim()
}

function sameCriterionDefinition(
  existing,
  submitted,
  index
) {
  return (
    normalizeText(existing.criterion_code) ===
      normalizeText(submitted.criterion_code) &&
    normalizeText(existing.criterion_name) ===
      normalizeText(submitted.criterion_name) &&
    normalizeText(existing.description) ===
      normalizeText(submitted.description) &&
    Number(existing.weight) ===
      Number(submitted.weight) &&
    Number(existing.max_score) ===
      Number(submitted.max_score) &&
    Number(existing.sort_order) ===
      (Number.isFinite(Number(submitted.sort_order)) ?
        Number(submitted.sort_order) :
        index) &&
    existing.is_active === true
  )
}

function validateDateRange(
  start,
  end,
  label = 'Review period'
) {
  if (
    start &&
    end &&
    Date.parse(start) > Date.parse(end)
  ) {
    throw new Error(
      `${label} end date cannot be before the start date.`
    )
  }
}

export async function loadReviewLookups() {
  const [
    staffResult,
    profileResult,
    templateResult
  ] = await Promise.all([
    getDb()
      .from('staff_registry')
      .select(`
        staff_id,
        staff_code,
        first_name,
        last_name,
        department_id,
        is_active
      `)
      .eq('is_active', true)
      .order('last_name'),
    getDb()
      .from('profiles')
      .select(`
        profile_id,
        full_name,
        email
      `)
      .order('full_name'),
    getDb()
      .from('review_template_master')
      .select('*')
      .eq('is_active', true)
      .order('template_name')
  ])

  for (const result of [
    staffResult,
    profileResult,
    templateResult
  ]) {
    if (result.error) {
      throw result.error
    }
  }

  return {
    staff:
      (staffResult.data || []).map(
        row => ({
          ...row,
          display_name:
            `${row.staff_code || ''} - ${row.first_name || ''} ${row.last_name || ''}`.trim()
        })
      ),
    reviewers:
      (profileResult.data || []).map(
        row => ({
          ...row,
          display_name:
            row.full_name || row.email
        })
      ),
    templates:
      templateResult.data || []
  }
}

export async function loadReviewTemplates({
  includeInactive = true
} = {}) {
  let query =
    getDb()
      .from('review_template_master')
      .select('*')
      .order('template_name')

  if (!includeInactive) {
    query =
      query.eq('is_active', true)
  }

  const {
    data,
    error
  } = await query

  if (error) {
    throw error
  }

  return data || []
}

export async function loadReviewCriteria(
  reviewTemplateId,
  {
    includeInactive = false
  } = {}
) {
  if (!reviewTemplateId) {
    return []
  }

  let query =
    getDb()
      .from('review_criteria_master')
      .select('*')
      .eq(
        'review_template_id',
        reviewTemplateId
      )
      .order('sort_order')
      .order('criterion_name')

  if (!includeInactive) {
    query =
      query.eq('is_active', true)
  }

  const {
    data,
    error
  } = await query

  if (error) {
    throw error
  }

  return data || []
}

export async function saveReviewTemplate({
  reviewTemplateId = null,
  templateCode,
  templateName,
  description = null,
  isActive = true,
  criteria = []
}) {
  requireValue(
    templateCode,
    'Template code'
  )
  requireValue(
    templateName,
    'Template name'
  )

  if (!criteria.length) {
    throw new Error(
      'Add at least one review criterion.'
    )
  }

  const seenCodes = new Set()

  for (const criterion of criteria) {
    requireValue(
      criterion.criterion_code,
      'Criterion code'
    )
    requireValue(
      criterion.criterion_name,
      'Criterion name'
    )

    const key =
      normalizeText(
        criterion.criterion_code
      ).toUpperCase()

    if (seenCodes.has(key)) {
      throw new Error(
        `Duplicate criterion code: ${key}`
      )
    }

    seenCodes.add(key)

    if (
      Number(criterion.weight) <= 0 ||
      Number(criterion.max_score) <= 0
    ) {
      throw new Error(
        'Criterion weight and maximum score must be greater than zero.'
      )
    }
  }

  const templatePayload = {
    template_code:
      normalizeText(templateCode),
    template_name:
      normalizeText(templateName),
    description:
      normalizeText(description) || null,
    is_active:
      Boolean(isActive),
    updated_by:
      actorId(),
    updated_at:
      now()
  }

  let templateId =
    reviewTemplateId

  if (templateId) {
    const {
      error
    } = await getDb()
      .from('review_template_master')
      .update(templatePayload)
      .eq(
        'review_template_id',
        templateId
      )

    if (error) {
      throw error
    }
  } else {
    const {
      data,
      error
    } = await getDb()
      .from('review_template_master')
      .insert({
        ...templatePayload,
        created_by:
          actorId()
      })
      .select('review_template_id')
      .single()

    if (error) {
      throw error
    }

    templateId =
      data.review_template_id
  }

  const existing =
    await loadReviewCriteria(
      templateId,
      {
        includeInactive: true
      }
    )

  if (reviewTemplateId) {
    const {
      count: usageCount,
      error: usageError
    } = await getDb()
      .from('staff_reviews')
      .select('review_id', {
        count: 'exact',
        head: true
      })
      .eq(
        'review_template_id',
        reviewTemplateId
      )

    if (usageError) {
      throw usageError
    }

    if (usageCount > 0) {
      const activeExisting =
        existing.filter(row => row.is_active)

      const criteriaUnchanged =
        activeExisting.length === criteria.length &&
        criteria.every(
          (criterion, index) => {
            const match =
              criterion.review_criterion_id ?
                activeExisting.find(
                  row =>
                    row.review_criterion_id ===
                    criterion.review_criterion_id
                ) :
                null

            return Boolean(match) &&
              sameCriterionDefinition(
                match,
                criterion,
                index
              )
          }
        )

      if (!criteriaUnchanged) {
        throw new Error(
          'This review template is already used by staff reviews. Create a new template/version before changing its criteria, weights, or scoring scale so historical reviews remain comparable.'
        )
      }
    }
  }

  const submittedIds = new Set(
    criteria
      .map(row => row.review_criterion_id)
      .filter(Boolean)
  )

  const deactivateIds =
    existing
      .filter(
        row =>
          row.is_active &&
          !submittedIds.has(
            row.review_criterion_id
          )
      )
      .map(row => row.review_criterion_id)

  if (deactivateIds.length) {
    const {
      error
    } = await getDb()
      .from('review_criteria_master')
      .update({
        is_active: false,
        updated_by:
          actorId(),
        updated_at:
          now()
      })
      .in(
        'review_criterion_id',
        deactivateIds
      )

    if (error) {
      throw error
    }
  }

  for (const [index, criterion] of criteria.entries()) {
    const payload = {
      review_template_id:
        templateId,
      criterion_code:
        normalizeText(
          criterion.criterion_code
        ),
      criterion_name:
        normalizeText(
          criterion.criterion_name
        ),
      description:
        normalizeText(
          criterion.description
        ) || null,
      weight:
        Number(criterion.weight),
      max_score:
        Number(criterion.max_score),
      sort_order:
        Number.isFinite(
          Number(criterion.sort_order)
        ) ?
          Number(criterion.sort_order) :
          index,
      is_active: true,
      updated_by:
        actorId(),
      updated_at:
        now()
    }

    if (criterion.review_criterion_id) {
      const {
        error
      } = await getDb()
        .from('review_criteria_master')
        .update(payload)
        .eq(
          'review_criterion_id',
          criterion.review_criterion_id
        )

      if (error) {
        throw error
      }
    } else {
      const {
        error
      } = await getDb()
        .from('review_criteria_master')
        .insert({
          ...payload,
          created_by:
            actorId()
        })

      if (error) {
        throw error
      }
    }
  }

  return templateId
}

export async function listStaffReviews() {
  const [
    reviewResult,
    lookups
  ] = await Promise.all([
    getDb()
      .from('staff_reviews')
      .select('*')
      .order(
        'review_date',
        {
          ascending: false
        }
      ),
    loadReviewLookups()
  ])

  if (reviewResult.error) {
    throw reviewResult.error
  }

  const staffMap = new Map(
    lookups.staff.map(
      row => [row.staff_id, row]
    )
  )
  const reviewerMap = new Map(
    lookups.reviewers.map(
      row => [row.profile_id, row]
    )
  )
  const templateMap = new Map(
    lookups.templates.map(
      row => [row.review_template_id, row]
    )
  )

  return (reviewResult.data || []).map(
    review => ({
      ...review,
      staff_name:
        staffMap.get(
          review.staff_id
        )?.display_name || '',
      reviewer_name:
        reviewerMap.get(
          review.reviewer_profile_id
        )?.display_name ||
        review.reviewer || '',
      template_name:
        templateMap.get(
          review.review_template_id
        )?.template_name || ''
    })
  )
}

export async function loadStaffReview(
  reviewId
) {
  requireValue(
    reviewId,
    'Review'
  )

  const [
    reviewResult,
    ratingResult
  ] = await Promise.all([
    getDb()
      .from('staff_reviews')
      .select('*')
      .eq('review_id', reviewId)
      .single(),
    getDb()
      .from('staff_review_ratings')
      .select('*')
      .eq('review_id', reviewId)
  ])

  if (reviewResult.error) {
    throw reviewResult.error
  }

  if (ratingResult.error) {
    throw ratingResult.error
  }

  return {
    review:
      reviewResult.data,
    ratings:
      ratingResult.data || []
  }
}

function calculateOverallScore(
  criteria,
  ratings
) {
  const criteriaMap = new Map(
    criteria.map(
      row => [
        row.review_criterion_id,
        row
      ]
    )
  )

  let weightedScore = 0
  let totalWeight = 0

  for (const rating of ratings) {
    const criterion =
      criteriaMap.get(
        rating.review_criterion_id
      )

    if (!criterion) {
      continue
    }

    const score =
      Number(rating.score)
    const maxScore =
      Number(criterion.max_score)
    const weight =
      Number(criterion.weight)

    if (
      !Number.isFinite(score) ||
      !Number.isFinite(maxScore) ||
      !Number.isFinite(weight) ||
      maxScore <= 0 ||
      weight <= 0
    ) {
      continue
    }

    if (
      score < 0 ||
      score > maxScore
    ) {
      throw new Error(
        `${criterion.criterion_name}: score must be between 0 and ${maxScore}.`
      )
    }

    weightedScore +=
      (score / maxScore) * weight
    totalWeight += weight
  }

  if (!totalWeight) {
    return null
  }

  return Number(
    (
      (weightedScore / totalWeight) * 100
    ).toFixed(2)
  )
}

export async function saveStaffReview({
  reviewId = null,
  staffId,
  reviewTemplateId,
  reviewDate,
  reviewPeriodStart = null,
  reviewPeriodEnd = null,
  reviewerProfileId,
  reviewStatus = 'DRAFT',
  strengths = null,
  improvementAreas = null,
  goals = null,
  trainingNeeds = null,
  reviewerComments = null,
  employeeComments = null,
  nextReviewDate = null,
  ratings = []
}) {
  requireValue(
    staffId,
    'Staff member'
  )
  requireValue(
    reviewTemplateId,
    'Review template'
  )
  requireValue(
    reviewDate,
    'Review date'
  )
  requireValue(
    reviewerProfileId,
    'Reviewer'
  )

  validateDateRange(
    reviewPeriodStart,
    reviewPeriodEnd
  )

  if (
    nextReviewDate &&
    Date.parse(nextReviewDate) <
      Date.parse(reviewDate)
  ) {
    throw new Error(
      'Next review date cannot be before the current review date.'
    )
  }

  const criteria =
    await loadReviewCriteria(
      reviewTemplateId
    )

  if (!criteria.length) {
    throw new Error(
      'The selected review template has no active criteria.'
    )
  }

  const criteriaIds = new Set(
    criteria.map(
      row => row.review_criterion_id
    )
  )

  const normalizedRatings =
    ratings
      .filter(
        row =>
          criteriaIds.has(
            row.review_criterion_id
          ) &&
          row.score !== '' &&
          row.score !== null &&
          row.score !== undefined
      )
      .map(row => ({
        review_criterion_id:
          row.review_criterion_id,
        score:
          Number(row.score),
        comments:
          normalizeText(
            row.comments
          ) || null
      }))

  if (!normalizedRatings.length) {
    throw new Error(
      'Rate at least one review criterion.'
    )
  }

  for (const rating of normalizedRatings) {
    if (!Number.isFinite(rating.score)) {
      throw new Error(
        'Every entered criterion score must be a valid number.'
      )
    }
  }

  if (
    ['COMPLETED', 'ACKNOWLEDGED']
      .includes(
        String(reviewStatus || '')
          .toUpperCase()
      ) &&
    normalizedRatings.length !==
      criteria.length
  ) {
    throw new Error(
      'A completed or acknowledged review must score every active criterion in the selected template.'
    )
  }

  const overallScore =
    calculateOverallScore(
      criteria,
      normalizedRatings
    )

  const reviewerResult =
    await getDb()
      .from('profiles')
      .select('full_name, email')
      .eq(
        'profile_id',
        reviewerProfileId
      )
      .single()

  if (reviewerResult.error) {
    throw reviewerResult.error
  }

  const payload = {
    staff_id:
      staffId,
    review_template_id:
      reviewTemplateId,
    review_date:
      reviewDate,
    review_period_start:
      reviewPeriodStart || null,
    review_period_end:
      reviewPeriodEnd || null,
    reviewer_profile_id:
      reviewerProfileId,
    reviewer:
      reviewerResult.data.full_name ||
      reviewerResult.data.email,
    score:
      overallScore,
    review_status:
      reviewStatus || 'DRAFT',
    strengths:
      normalizeText(strengths) || null,
    improvement_areas:
      normalizeText(improvementAreas) || null,
    goals:
      normalizeText(goals) || null,
    training_needs:
      normalizeText(trainingNeeds) || null,
    comments:
      normalizeText(reviewerComments) || null,
    employee_comments:
      normalizeText(employeeComments) || null,
    next_review_date:
      nextReviewDate || null,
    updated_by:
      actorId(),
    updated_at:
      now()
  }

  let savedReviewId =
    reviewId

  if (reviewId) {
    const {
      error
    } = await getDb()
      .from('staff_reviews')
      .update(payload)
      .eq('review_id', reviewId)

    if (error) {
      throw error
    }
  } else {
    const {
      data,
      error
    } = await getDb()
      .from('staff_reviews')
      .insert({
        ...payload,
        created_by:
          actorId()
      })
      .select('review_id')
      .single()

    if (error) {
      throw error
    }

    savedReviewId =
      data.review_id
  }

  const ratingPayload =
    normalizedRatings.map(
      rating => ({
        review_id:
          savedReviewId,
        review_criterion_id:
          rating.review_criterion_id,
        score:
          rating.score,
        comments:
          rating.comments,
        created_by:
          actorId(),
        updated_by:
          actorId(),
        updated_at:
          now()
      })
    )

  const {
    error: ratingError
  } = await getDb()
    .from('staff_review_ratings')
    .upsert(
      ratingPayload,
      {
        onConflict:
          'review_id,review_criterion_id'
      }
    )

  if (ratingError) {
    throw ratingError
  }

  const submittedRatingIds =
    new Set(
      normalizedRatings.map(
        row => row.review_criterion_id
      )
    )

  const {
    data: existingRatings,
    error: existingRatingsError
  } = await getDb()
    .from('staff_review_ratings')
    .select(
      'staff_review_rating_id, review_criterion_id'
    )
    .eq('review_id', savedReviewId)

  if (existingRatingsError) {
    throw existingRatingsError
  }

  const staleRatingIds =
    (existingRatings || [])
      .filter(
        row =>
          !submittedRatingIds.has(
            row.review_criterion_id
          )
      )
      .map(
        row => row.staff_review_rating_id
      )

  if (staleRatingIds.length) {
    const {
      error: staleDeleteError
    } = await getDb()
      .from('staff_review_ratings')
      .delete()
      .in(
        'staff_review_rating_id',
        staleRatingIds
      )

    if (staleDeleteError) {
      throw staleDeleteError
    }
  }

  return savedReviewId
}

export async function deleteStaffReview(
  reviewId
) {
  requireValue(
    reviewId,
    'Review'
  )

  const {
    error
  } = await getDb()
    .from('staff_reviews')
    .delete()
    .eq('review_id', reviewId)

  if (error) {
    throw error
  }
}
