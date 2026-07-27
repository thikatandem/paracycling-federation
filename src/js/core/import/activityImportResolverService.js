import * as lookup from './lookupResolver.js'

export function verifyOccurrenceOwnership(
  participant
) {
  if (
    !participant.event ||
    !participant.occurrence
  ) {
    return
  }

  if (
    participant.occurrence.event_id !==
    participant.event.event_id
  ) {
    throw new Error(
      `Occurrence '${participant.event_area}' does not belong to Event '${participant.event_code}'.`
    )
  }
}

export async function resolveEventOccurrence(
  participant,
  resolveEvent,
  resolveOccurrence
) {
  participant.event =
    await resolveEvent(participant)

  participant.occurrence =
    await resolveOccurrence(participant)

  verifyOccurrenceOwnership(
    participant
  )

  return participant
}

export async function resolveActivityProgram(
  participant
) {
  const program =
    await lookup.resolveProgramCode(
      participant.program_code
    )

  if (!program || !program.found) {
    throw new Error(
      `Program '${participant.program_code}' was not found.`
    )
  }

  return program
}

export async function resolveActivityParticipant(
  participant
) {
  const participantRecord =
    await lookup.resolveParticipant(
      participant.participant_type_code,
      participant.participant_code
    )

  if (
    !participantRecord ||
    !participantRecord.found
  ) {
    throw new Error(
      `Participant '${participant.participant_code}' was not found.`
    )
  }

  return participantRecord
}

export async function resolveActivityParticipantRegistration(
  participant
) {
  participant.participant =
    await resolveActivityParticipant(
      participant
    )

  const registration =
    await lookup.resolveParticipantRegistration(
      participant.occurrence.event_instance_id,
      participant.program.program_id,
      participant.participant.participant_ref_id
    )

  if (!registration || !registration.found) {
    throw new Error(
      `Participant '${participant.participant_code}' is not registered for Program '${participant.program_code}'.`
    )
  }

  return registration
}

export function verifyProgramRegistration(
  participant
) {
  if (
    participant.registration.program_id !==
    participant.program.program_id
  ) {
    throw new Error(
      `Participant is not registered for Program '${participant.program_code}'.`
    )
  }
}
