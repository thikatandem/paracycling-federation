// =====================================================
// SUPABASE CRUD SERVICE
// =====================================================

import { getDb } from './getDb.js'

export async function getRecords({

  table,

  select = '*',

  orderBy = null,

  ascending = true

}) {
  let query =
    getDb()
      .from(table)
      .select(select)

  if (orderBy) {
    query =
      query.order(
        orderBy,
        { ascending }
      )
  }

  const {
    data,
    error
  } =
    await query

  if (error) {
    throw error
  }

  return data || []
}

export async function getById({

  table,

  idColumn,

  id,

  select = '*'

}) {
  const {
    data,
    error
  } =
    await getDb()
      .from(table)
      .select(select)
      .eq(
        idColumn,
        id
      )
      .single()

  if (error) {
    throw error
  }

  return data
}

export async function insertRecord({

  table,

  payload

}) {
  const {
    data,
    error
  } =
    await getDb()
      .from(table)
      .insert(payload)
      .select()

  if (error) {
    throw error
  }

  return data
}

export async function updateRecord({

  table,

  idColumn,

  id,

  payload

}) {
  const {
    data,
    error
  } =
    await getDb()
      .from(table)
      .update(payload)
      .eq(
        idColumn,
        id
      )
      .select()

  if (error) {
    throw error
  }

  return data
}

export async function deleteRecord({

  table,

  idColumn,

  id

}) {
  const {
    error
  } =
    await getDb()
      .from(table)
      .delete()
      .eq(
        idColumn,
        id
      )

  if (error) {
    throw error
  }
}
