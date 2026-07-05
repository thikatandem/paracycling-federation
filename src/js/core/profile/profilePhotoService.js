import {
  getCurrentProfile
}
from '../auth/authService.js'

import {
  setProfile
}
from '../auth/authStateService.js'
import {
  getDb
}
from '../supabase/getDb.js'

import {
  logAuditEvent
}
from '../auth/auditService.js'

export function initializeProfilePhotoUpload() {

  const avatar =
    document.getElementById(
      'profileAvatar'
    )

  const dropdownAvatar =
    document.getElementById(
      'profileAvatarDropdown'
    )

  const profilePhoto =
    document.getElementById(
      'profilePhoto'
    )

  const uploader =
    document.getElementById(
      'profilePhotoUpload'
    )

  if (
    !uploader
  ) {
    return
  }

  const openUploader =
    () => {

      uploader.click()

    }

  profilePhoto
  ?.addEventListener(
    'click',
    openUploader
  )

  uploader.addEventListener(
    'change',
    async event => {

      const file =
        event.target.files?.[0]

      if (!file) {

        return

      }

      try {

        await uploadProfilePhoto(
          file
        )

      } catch (error) {

        console.error(
          'Profile photo upload failed',
          error
        )

      }

    }
  )

}

export async function uploadProfilePhoto(
  file
) {

  const profile =
    getCurrentProfile()

  if (!profile) {

    throw new Error(
      'Profile not found.'
    )

  }

  const extension =
    file.name
      .split('.')
      .pop()

  const fileName =
    `${profile.profile_id}.${extension}`

  const filePath =
    `profile-photos/${fileName}`

  const {
    error: uploadError
  } =
    await window
      .supabaseClient
      .storage
      .from(
        'documents'
      )
      .upload(
        filePath,
        file,
        {
          upsert: true
        }
      )

  if (
    uploadError
  ) {

    throw uploadError

  }

  const {
    data: publicUrlData
  } =
    window
      .supabaseClient
      .storage
      .from(
        'documents'
      )
      .getPublicUrl(
        filePath
      )

  const photoUrl =
    publicUrlData.publicUrl

  const {
    error: documentError
  } =
    await getDb()
      .from(
        'documents'
      )
      .insert({

        document_type:
          'PROFILE_PHOTO',

        file_name:
          file.name,

        file_url:
          photoUrl,

        uploaded_by:
          profile.profile_id,

        file_size:
          file.size,

        mime_type:
          file.type,

        storage_bucket:
          'documents'

      })

  if (
    documentError
  ) {

    throw documentError

  }

  const {
    error: profileError
  } =
    await getDb()
      .from(
        'profiles'
      )
      .update({

        profile_photo_url:
          photoUrl

      })
      .eq(
        'profile_id',
        profile.profile_id
      )

  if (
    profileError
  ) {

    throw profileError

  }
setProfile({

  ...profile,

  profile_photo_url:
    photoUrl

})
  await logAuditEvent({

    tableName:
      'profiles',

    recordId:
      profile.profile_id,

    action:
      'PROFILE_PHOTO_UPDATED',

    newValues: {

      profile_photo_url:
        photoUrl

    }

  })

  avatarRefresh(
    photoUrl
  )

}

function avatarRefresh(
  photoUrl
) {

  const navbarAvatar =
    document.getElementById(
      'profileAvatar'
    )

  const dropdownAvatar =
    document.getElementById(
      'profileAvatarDropdown'
    )

  const profilePhoto =
    document.getElementById(
      'profilePhoto'
    )

  if (
    navbarAvatar
  ) {

    navbarAvatar.src =
      photoUrl

  }

  if (
    dropdownAvatar
  ) {

    dropdownAvatar.src =
      photoUrl

  }

  if (
    profilePhoto
  ) {

    profilePhoto.src =
      photoUrl

  }

}