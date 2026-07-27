import {
  getDb,
  hasDb
} from './getDb.js'

export const supabase =
  getDb()

export {
  getDb,
  hasDb
}
