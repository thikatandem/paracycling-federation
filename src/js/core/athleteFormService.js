import {
  setValue
}
from './domService.js'

export function populateAthleteForm(
  athlete
) {

  setValue(
    'athleteId',
    athlete.athlete_id
  )

  setValue(
    'athleteCode',
    athlete.athlete_code
  )

  setValue(
    'firstName',
    athlete.first_name
  )

  setValue(
    'lastName',
    athlete.last_name
  )

  setValue(
    'dob',
    athlete.dob
  )

  setValue(
    'gender',
    athlete.gender
  )

  setValue(
    'role',
    athlete.role
  )

  setValue(
    'classificationId',
    athlete.classification_id
  )

  setValue(
    'countyId',
    athlete.county_id
  )

  setValue(
    'subcountyId',
    athlete.subcounty_id
  )

  setValue(
    'passportNo',
    athlete.passport_no
  )

  setValue(
    'nationalId',
    athlete.national_id
  )

  setValue(
    'phone',
    athlete.phone
  )

  setValue(
    'email',
    athlete.email
  )

  setValue(
    'emergencyContactName',
    athlete.emergency_contact_name
  )

  setValue(
    'emergencyContactPhone',
    athlete.emergency_contact_phone
  )

  setValue(
    'registrationDate',
    athlete.registration_date
  )

}

import {
  getValue
}
from './domService.js'

export function buildAthletePayload({

  townId

}) {

  return {

    first_name:
      getValue('firstName'),

    last_name:
      getValue('lastName'),

    dob:
      getValue('dob'),

    gender:
      getValue('gender'),

    role:
      getValue('role'),

    classification_id:
      getValue('classificationId') || null,

    county_id:
      getValue('countyId') || null,

    subcounty_id:
      getValue('subcountyId') || null,

    town_id:
      townId,

    passport_no:
      getValue('passportNo') || null,

    national_id:
      getValue('nationalId') || null,

    phone:
      getValue('phone') || null,

    email:
      getValue('email') || null,

    emergency_contact_name:
      getValue(
        'emergencyContactName'
      ) || null,

    emergency_contact_phone:
      getValue(
        'emergencyContactPhone'
      ) || null,

    status:
      getValue('status')

  }

}