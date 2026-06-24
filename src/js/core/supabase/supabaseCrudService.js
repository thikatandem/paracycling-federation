// =====================================================
// SUPABASE CRUD SERVICE
// =====================================================

import {
  supabase
}
from './supabaseClient.js'

export async function getRecords({

  table,

  select = '*',

  orderBy = null,

  ascending = true

}) {

  let query =
    window.supabaseClient
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
    await window.supabaseClient
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
    await window.supabaseClient
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
    await window.supabaseClient
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
    await window.supabaseClient
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