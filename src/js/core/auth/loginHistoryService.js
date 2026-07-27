import { getDb } from '../supabase/getDb.js'
import {
  getProfile,
  getLoginId,
  clearLoginId
} from './authStateService.js'

export async function trackLogin() {
  try {
    const profile = getProfile()

    if (!profile) {
      return null
    }

    const { data, error } =
      await getDb()
        .from('login_history')
        .insert({
          profile_id: profile.profile_id,
          login_time: new Date().toISOString(),
          success: true,
          user_agent: navigator.userAgent
        })
        .select('login_id')
        .single()

    if (error) {
      throw error
    }

    return data.login_id
  } catch (error) {
    return null
  }
}

export async function trackLogout() {
  try {
    const profile = getProfile()
    const loginId = getLoginId()

    if (!profile || !loginId) {
      return
    }

    const { error } =
      await getDb()
        .from('login_history')
        .update({
          logout_time: new Date().toISOString()
        })
        .eq('login_id', loginId)

    if (error) {
      throw error
    }

    clearLoginId()
  } catch (error) {
  }
}
