import {
  setValues,
  getValues
}
from './domService.js'

export function populateTeamForm({

  team,

  effectiveDate = ''

}) {

  setValues({

    teamId:
      team.team_id,

    teamCode:
      team.team_code,

    teamName:
      team.team_name,

    teamNickname:
      team.team_nickname,

    pilotAthleteId:
      team.pilot_athlete_id,

    stokerAthleteId:
      team.stoker_athlete_id,

    teamStatus:
      team.status,

    effectiveDate,

    changeReason: ''

  })

}

export function buildTeamPayload() {

  const values =
    getValues([

      'teamName',
      'teamNickname',
      'pilotAthleteId',
      'stokerAthleteId',
      'teamStatus'

    ])

  return {

    team_name:
      values.teamName || null,

    team_nickname:
      values.teamNickname || null,

    status:
      values.teamStatus,

    pilot_athlete_id:
      values.pilotAthleteId,

    stoker_athlete_id:
      values.stokerAthleteId

  }

}

export function renderCurrentPairingRow(
  member
) {

  return `

<tr>

${buildTextCell(
  member.role_master?.role_name
)}

${buildTextCell(
  `${member.athletes?.first_name || ''} ${member.athletes?.last_name || ''}`
)}

${buildTextCell(
  member.start_date
)}

</tr>

`

}

export function renderTeamHistoryRow(
  member
) {

  return `

<tr>

${buildTextCell(
  member.role_master?.role_name
)}

${buildTextCell(
  `${member.athletes?.first_name || ''} ${member.athletes?.last_name || ''}`
)}

${buildTextCell(
  member.start_date
)}

${buildTextCell(
  member.end_date
)}

${buildTextCell(
  member.is_active
    ? 'Yes'
    : 'No'
)}

${buildTextCell(
  member.change_reason
)}

</tr>

`

}

export function detectPilotChange(
  team,
  selectedPilot
) {

  return (
    team.pilot_athlete_id !==
    selectedPilot
  )

}
export function detectStokerChange(
  team,
  selectedStoker
) {

  return (
    team.stoker_athlete_id !==
    selectedStoker
  )

}