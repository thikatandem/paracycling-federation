let events = []

let filteredEvents = []

let currentPage = 1

const pageSize = 10

let activeStatusId = null

let inactiveStatusId = null

let eventModal = null
let programModal = null

document.addEventListener(
  'DOMContentLoaded',
  initializeMasterEvents
)



async function initializeMasterEvents() {
  try {
    const modalElement =
      document.getElementById(
        'eventModal'
      )

    if (!modalElement) {
      throw new Error(
        'Event modal not found.'
      )
    }

    eventModal =
      new coreui.Modal(
        modalElement
      )
    programModal =
  new coreui.Modal(
    document.getElementById(
      'programModal'
    )
  )

    bindEvents()

    await loadEventCategories()

    await loadEventTypes()

    await loadProgramRecurrenceTypes()

    await loadEventStatuses()

    await loadEvents()

    await loadProgramNameSuggestions()

    await loadEventNameSuggestions()
  } catch (error) {
    console.error(error)

    showError(
      error.message ||
      'Failed to initialize Event Master.'
    )
  }
}

async function loadProgramRecurrenceTypes() {

    const select =
        document.getElementById(
            'programRecurrenceTypeId'
        )

    if (

        !select

    ) {

        return

    }

    select.innerHTML = `

        <option value="">

            Select Recurrence

        </option>

    `

    const {

        data,

        error

    } =
        await window
            .supabaseClient
            .from(
                'recurrence_type_master'
            )
            .select(`
                recurrence_type_id,
                recurrence_name,
                sort_order
            `)
            .eq(
                'active',
                true
            )
            .order(
                'sort_order'
            )

    if (

        error

    ) {

        throw error

    }

    for (

        const recurrence

        of data || []

    ) {

        select.innerHTML += `

            <option
                value="${recurrence.recurrence_type_id}">

                ${recurrence.recurrence_name}

            </option>

        `

    }

}


async function loadProgramNameSuggestions() {

    const datalist =
        document.getElementById(
            'programNameSuggestions'
        )

    if (!datalist) {

        return

    }

    datalist.innerHTML = ''

    const {

        data,

        error

    } =
        await window
            .supabaseClient
            .from(
                'program_master'
            )
            .select(
                'program_name'
            )
            .order(
                'program_name'
            )

    if (error) {

        throw error

    }

    const names =
        [

            ...new Set(

                (data || [])

                    .map(

                        program =>

                            program.program_name

                    )

                    .filter(

                        Boolean

                    )

            )

        ]

    for (

        const name

        of names

    ) {

        const option =
            document.createElement(
                'option'
            )

        option.value =
            name

        datalist.appendChild(
            option
        )

    }

}
// =====================================================
// CHECK DUPLICATE EVENT PROGRAM
// =====================================================

function clearProgramForm() {

    document.getElementById(
        'programId'
    ).value = ''

    document.getElementById(
        'programCode'
    ).value = ''

    document.getElementById(
        'programName'
    ).value = ''

    document.getElementById(
        'programDurationDays'
    ).value = 1

    document.getElementById(
        'programRecurrenceTypeId'
    ).value = ''

  clearScheduleForm()

syncProgramSummary()


}


function syncProgramSummary() {

    document
        .getElementById(
            'selectedProgramName'
        )
        .value =
        document
            .getElementById(
                'programName'
            )
            .value

    document
        .getElementById(
            'selectedProgramCode'
        )
        .value =

        document
            .getElementById(
                'programCode'
            )
            .value ||

        'Generated on Save'

    const duration =

        document
            .getElementById(
                'programDurationDays'
            )
            .value

    document
        .getElementById(
            'selectedProgramDuration'
        )
        .value =

        duration

            ? `${duration} Day(s)`

            : ''

    const recurrence =

        document
            .getElementById(
                'programRecurrenceTypeId'
            )

    document
        .getElementById(
            'selectedProgramInterval'
        )
        .value =

        recurrence.options[
            recurrence.selectedIndex
        ]?.text ||

        ''

    document
        .getElementById(
            'selectedProgramStatus'
        )
        .value =

        'New Program'

}

function normalizeProgramName(

    value

) {

    return value

        .toUpperCase()

        .replace(

            /\bDAYS\b/g,

            'DAY'

        )

        .replace(

            /\s+/g,

            ''

        )

        .trim()

}

async function programExists(

    programName,

    excludeId = null

) {

    const {

        data,

        error

    } =
        await window
            .supabaseClient
            .from(
                'program_master'
            )
            .select(`
                program_id,
                program_name
            `)

    if (

        error

    ) {

        throw error

    }

    const normalized =

        normalizeProgramName(

            programName

        )

    return (

        data || []

    ).some(

        row =>

            row.program_id !== excludeId &&

            normalizeProgramName(

                row.program_name

            ) === normalized

    )

}


async function saveProgram() {

    clearError()

    try {

        const programId =

            document
                .getElementById(
                    'programId'
                )
                .value

        const programName =

            document
                .getElementById(
                    'programName'
                )
                .value
                .trim()

        const exists =

            await programExists(

                programName,

                programId

            )

        if (

            exists

        ) {

            showError(

                'Program already exists.'

            )

            return

        }

        const payload = {

            program_name:

                programName,

            program_duration_days:

                Number(

                    document
                        .getElementById(
                            'programDurationDays'
                        )
                        .value

                ),

            recurrence_type_id:

                document
                    .getElementById(
                        'programRecurrenceTypeId'
                    )
                    .value ||

                null,

            active: true

        }

        let error

        if (

            programId

        ) {

            const result =

                await window
                    .supabaseClient
                    .from(
                        'program_master'
                    )
                    .update(
                        payload
                    )
                    .eq(
                        'program_id',
                        programId
                    )

            error =
                result.error

        }

        else {

            const result =

                await window
                    .supabaseClient
                    .from(
                        'program_master'
                    )
                    .insert(
                        payload
                    )

            error =
                result.error

        }

                if (

            error

        ) {

            throw error

        }

        let savedProgramId =

            programId

        if (

            !programId

        ) {

            const {

                data

            } =
                await window
                    .supabaseClient
                    .from(
                        'program_master'
                    )
                    .select(
                        'program_id'
                    )
                    .eq(
                        'program_name',
                        programName
                    )
                    .single()

            savedProgramId =
                data.program_id

        }

        const hasSchedule =

            document
                .getElementById(
                    'scheduleStartDate'
                )
                .value

        if (

            hasSchedule

        ) {

            document
                .getElementById(
                    'scheduleProgramId'
                )
                .value =
                savedProgramId

            await saveSchedule()

        }

       clearProgramForm()

await loadPrograms()

await loadProgramNameSuggestions()

document
    .getElementById(
        'scheduleTableBody'
    )
    .innerHTML = ''

document
    .getElementById(
        'scheduleSection'
    )
    .classList
    .add(
        'd-none'
    )

programModal.hide()

showSuccess(

    programId

        ? 'Program updated successfully.'

        : 'Program created successfully.'

)

    }

    catch (

        error

    ) {

        console.error(

            error

        )

        showError(

            error.message

        )

    }

}

function bindEvents() {
  document
  .getElementById(
    'btnSaveProgram'
  )
  ?.addEventListener(
    'click',
    saveProgram
  )

document
    .getElementById(
        'programName'
    )
    ?.addEventListener(
        'input',
        syncProgramSummary
    )

document
    .getElementById(
        'programDurationDays'
    )
    ?.addEventListener(
        'input',
        syncProgramSummary
    )

document
    .getElementById(
        'programRecurrenceTypeId'
    )
    ?.addEventListener(
        'change',
        syncProgramSummary
    )

document
    .getElementById(
        'scheduleStartDate'
    )
    ?.addEventListener(
        'change',
        updateScheduleDay
    )


document
  .getElementById(
    'btnProgramMaster'
  )
  ?.addEventListener(
    'click',
    openProgramMaster
  )

document
.getElementById(
    'btnSaveSchedule'
)
?.addEventListener(
    'click',
    saveSchedule
)

  document
    .getElementById(
      'btnNewEvent'
    )
    ?.addEventListener(
      'click',
      openNewEventModal
    )

  document
    .getElementById(
      'btnSaveEvent'
    )
    ?.addEventListener(
      'click',
      saveEvent
    )

  document
    .getElementById(
      'searchEvent'
    )
    ?.addEventListener(
      'input',
      searchEvents
    )
}


async function openProgramMaster() {

    clearError()

    clearProgramForm()

    await loadPrograms()

    await loadProgramNameSuggestions()

    programModal.show()
}




async function loadPrograms(eventId) {

    const tbody =
        document.getElementById(
            'programTableBody'
        )

    tbody.innerHTML = ''

    const {
        data,
        error
    } =
        await window
            .supabaseClient
            .from(
    'program_master'
)
.select(`
    program_id,
    program_code,
    program_name,
    program_duration_days,
    active
`)
.order(
    'program_duration_days',
    {
        ascending: true
    }
)

    if(error){

        throw error

    }

    for (const program of data || []) {

    tbody.innerHTML += `

<tr>

<td>${program.program_code}</td>

<td>${program.program_name}</td>

<td>${program.program_duration_days} Day(s)</td>

<td>

${program.active ? 'Active' : 'Inactive'}

</td>

<td>

<button
class="btn btn-sm btn-primary me-1"
onclick="editProgram('${program.program_id}')">

Edit

</button>

<button
class="btn btn-sm btn-info me-1"
onclick="manageSchedules('${program.program_id}')">

Schedules

</button>

<button
class="btn btn-sm btn-danger"
onclick="deleteProgram('${program.program_id}')">

Delete

</button>

</td>

</tr>

`

}

}

window.editProgram =
async function (

    programId

) 


{

    clearError()

    try {

        const {

    data,

    error

} =
    await window
        .supabaseClient
        .from(
            'program_master'
        )
        .select(`
            program_id,
            program_code,
            program_name,
            program_duration_days,
            recurrence_type_id,
            active
        `)
        .eq(
            'program_id',
            programId
        )
        .single()
        if (

            error

        ) {

            throw error

        }

        document
            .getElementById(
                'programCode'
            )
            .value =
            data.program_code
        document
    .getElementById(
        'programId'
    )
    .value =
    data.program_id

        document
            .getElementById(
                'programName'
            )
            .value =
            data.program_name

        document
            .getElementById(
                'programDurationDays'
            )
            .value =
            data.program_duration_days

        document
            .getElementById(
                'programRecurrenceTypeId'
            )
            .value =
            data.recurrence_type_id || ''
syncProgramSummary()
        await loadSelectedProgram(
            programId
        )

        document
            .getElementById(
                'scheduleProgramId'
            )
            .value =
            programId

        await loadSchedules(
            programId
        )

        document
            .getElementById(
                'scheduleSection'
            )
            .classList
            .remove(
                'd-none'
            )
programModal.show()
    }

    catch (

        error

    ) {

        console.error(
            error
        )

        showError(
            error.message
        )

    }

}


window.deleteProgram =
async function (

    programId

) {

    clearError()

    try {

        const {

            count,

            error

        } =
            await window
                .supabaseClient
                .from(
                    'program_schedules'
                )
                .select(
                    '*',
                    {
                        count: 'exact',
                        head: true
                    }
                )
                .eq(
                    'program_id',
                    programId
                )

        if (

            error

        ) {

            throw error

        }

        const message =

            count > 0

                ?

                `This Program has ${count} schedule(s).\n\nDeleting this Program will also delete all of its Schedules.\n\nDo you want to continue?`

                :

                'Delete this Program?'

        if (

            !confirm(

                message

            )

        ) {

            return

        }

        const {

            error: deleteError

        } =
            await window
                .supabaseClient
                .from(
                    'program_master'
                )
                .delete()
                .eq(
                    'program_id',
                    programId
                )

        if (

            deleteError

        ) {

            throw deleteError

        }

        document
            .getElementById(
                'scheduleTableBody'
            )
            .innerHTML = ''

        document
            .getElementById(
                'scheduleSection'
            )
            .classList
            .add(
                'd-none'
            )

        clearProgramForm()

        await loadPrograms()

        showSuccess(

            'Program deleted successfully.'

        )

    }

    catch (

        error

    ) {

        console.error(

            error

        )

        showError(

            error.message ||

            'Failed to delete Program.'

        )

    }

}


async function loadSelectedProgram(

    programId

) {

    const {

        data,

        error

    } =
        await window
            .supabaseClient
            .from(
                'program_master'
            )
            .select(`
    program_code,
    program_name,
    program_duration_days,
    active,
    recurrence_type_master(
        recurrence_name
    )
`)
            .eq(
                'program_id',
                programId
            )
            .single()

    if (

        error

    ) {

        throw error

    }

    document
        .getElementById(
            'selectedProgramName'
        )
        .value =
        data.program_name

    document
        .getElementById(
            'selectedProgramCode'
        )
        .value =
        data.program_code

document
    .getElementById(
        'selectedProgramDuration'
    )
    .value =
        `${data.program_duration_days} Day(s)`

document
    .getElementById(
        'selectedProgramInterval'
    )
    .value =
        data
            .recurrence_type_master
            ?.recurrence_name || ''

    document
        .getElementById(
            'selectedProgramStatus'
        )
        .value =
        data.active
            ? 'Active'
            : 'Inactive'

}


// =====================================================
// PROGRAM SCHEDULE MANAGEMENT
// =====================================================

window.manageSchedules =
async function (

    programId

) {

    clearError()

    document
        .getElementById(
            'scheduleProgramId'
        )
        .value =
        programId

clearScheduleForm()
    await loadSelectedProgram(

        programId

    )

    document
        .getElementById(
            'scheduleId'
        )
        .value =
        ''

    

    const scheduleTable =
        document
            .getElementById(
                'scheduleTableBody'
            )

    if (

        scheduleTable

    ) {

        scheduleTable.innerHTML = ''

    }

    await loadRecurrenceTypes()

    await loadSchedules(

        programId

    )

    document
        .getElementById(
            'scheduleSection'
        )
        .classList
        .remove(
            'd-none'
        )

}

async function loadRecurrenceTypes() {

    const select =
        document.getElementById(
            'recurrenceTypeId'
        )

    if (
        !select
    ) {

        return

    }

    select.innerHTML = `
        <option value="">
            Select Recurrence Type
        </option>
    `

    const {

        data,

        error

    } =
        await window
            .supabaseClient
            .from(
                'recurrence_type_master'
            )
            .select(`
                recurrence_type_id,
                recurrence_code,
                recurrence_name,
                recurrence_category,
                sort_order
            `)
            .eq(
                'active',
                true
            )
            .order(
                'sort_order',
                {
                    ascending: true
                }
            )

    if (
        error
    ) {

        throw error

    }

    for (
        const recurrence
        of data || []
    ) {

        select.innerHTML += `
            <option
                value="${recurrence.recurrence_type_id}">
                ${recurrence.recurrence_name}
            </option>
        `

    }

}

async function loadSchedules(
    programId
) {

    const tbody =
        document.getElementById(
            'scheduleTableBody'
        )

    if (
        !tbody
    ) {

        return

    }

    tbody.innerHTML = ''

    const {

        data,

        error

    } =
        await window
            .supabaseClient
            .from(
                'program_schedules'
            )
            .select(`

    program_schedule_id,

    schedule_name,

    schedule_start_date,

    schedule_end_date,

    start_time,

    end_time,

    active

`)
            
            .eq(
                'program_id',
                programId
            )
            .eq(
                'active',
                true
            )
            .order(
                'schedule_start_date',
                {
                    ascending: true
                }
            )

    if (
        error
    ) {

        throw error

    }

    if (
        !data ||
        data.length === 0
    ) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="7"
                    class="text-center text-muted">

                    No schedules defined.

                </td>

            </tr>
        `

        return

    }

   for (

    const schedule

    of data

) {

    const day =

        new Date(

            schedule.schedule_start_date

        ).toLocaleDateString(

            'en-US',

            {

                weekday: 'long'

            }

        )

    tbody.innerHTML += `

<tr>

<td>

${schedule.schedule_name}

</td>

<td>

${schedule.schedule_start_date}

</td>

<td>

${day}

</td>

<td>

${schedule.schedule_end_date || ''}

</td>

<td>

${schedule.start_time || ''}

 -

${schedule.end_time || ''}

</td>

<td>

${schedule.active ? 'Active' : 'Inactive'}

</td>

<td>

<button
class="btn btn-sm btn-primary me-1"
onclick="editSchedule('${schedule.program_schedule_id}')">

Edit

</button>

</td>

</tr>

`

}

}

function clearScheduleForm() {

    document.getElementById(
        'scheduleId'
    ).value = ''
    document
    .getElementById(
        'scheduleName'
    )
    .value = ''
    document.getElementById(
        'scheduleStartDate'
    ).value = ''

    document.getElementById(
        'scheduleEndDate'
    ).value = ''

    document.getElementById(
        'scheduleStartTime'
    ).value = ''

    document.getElementById(
        'scheduleEndTime'
    ).value = ''

    document.getElementById(
        'scheduleDay'
    ).value = ''

    

}


function updateScheduleDay() {

    const startDate =

        document
            .getElementById(
                'scheduleStartDate'
            )
            .value

    document
        .getElementById(
            'scheduleDay'
        )
        .value = ''

    if (

        !startDate

    ) {

        return

    }

    const day =

        new Date(

            startDate

        )

        .toLocaleDateString(

            'en-US',

            {

                weekday: 'long'

            }

        )

    document
        .getElementById(
            'scheduleDay'
        )
        .value = day

}


function validateSchedule() {

    const programId =

        document
            .getElementById(
                'scheduleProgramId'
            )
            .value

    const scheduleStartDate =

        document
            .getElementById(
                'scheduleStartDate'
            )
            .value

    const scheduleEndDate =

        document
            .getElementById(
                'scheduleEndDate'
            )
            .value

    const startTime =

        document
            .getElementById(
                'scheduleStartTime'
            )
            .value

    const endTime =

        document
            .getElementById(
                'scheduleEndTime'
            )
            .value

    if (

        !programId

    ) {

        throw new Error(
            'Program is required.'
        )

    }

    if (

        !scheduleStartDate

    ) {

        throw new Error(
            'Start Date is required.'
        )

    }

    if (

        scheduleEndDate &&
        scheduleEndDate < scheduleStartDate

    ) {

        throw new Error(
            'End Date cannot be earlier than Start Date.'
        )

    }

    if (

        startTime &&
        endTime &&
        endTime <= startTime

    ) {

        throw new Error(
            'End Time must be later than Start Time.'
        )

    }

    return true

}

function buildSchedulePayload() {

    validateSchedule()

 return {

    program_id:

        document
            .getElementById(
                'scheduleProgramId'
            )
            .value,

    schedule_name:

        document
            .getElementById(
                'scheduleName'
            )
            .value
            .trim(),

    schedule_start_date:

        document
            .getElementById(
                'scheduleStartDate'
            )
            .value,

    schedule_end_date:

        document
            .getElementById(
                'scheduleEndDate'
            )
            .value || null,

    start_time:

        document
            .getElementById(
                'scheduleStartTime'
            )
            .value || null,

    end_time:

        document
            .getElementById(
                'scheduleEndTime'
            )
            .value || null,

    active: true

}
}
// =====================================================
// SCHEDULE VALIDATION
// =====================================================



// =====================================================
// CHECK DUPLICATE SCHEDULE
// =====================================================

async function scheduleExists(

    programId,

    scheduleName,

    excludeId = null

) {

    const {

        data,

        error

    } =
        await window
            .supabaseClient
            .from(
                'program_schedules'
            )
            .select(`
                program_schedule_id
            `)
            .eq(
                'program_id',
                programId
            )
            .ilike(
                'schedule_name',
                scheduleName
            )

    if (
        error
    ) {

        throw error

    }

    const duplicates =
        (data || [])
            .filter(

                row =>

                    row.program_schedule_id !==
                    excludeId

            )

    return (

        duplicates.length > 0

    )

}

// =====================================================
// SAVE / UPDATE PROGRAM SCHEDULE
// =====================================================

async function saveSchedule() {

    clearError()

    clearError()

if (

    !document
        .getElementById(
            'scheduleStartDate'
        )
        .value

) {

    return

}

validateSchedule()

    try {

        const scheduleId =
            document.getElementById(
                'scheduleId'
            ).value

        const programId =
            document.getElementById(
                'scheduleProgramId'
            ).value

        const scheduleName =
            document.getElementById(
                'scheduleName'
            ).value
            .trim()

       

        const exists =
            await scheduleExists(

                programId,

                scheduleName,

                scheduleId

            )

        if (
            exists
        ) {

            showError(
                'A schedule with this name already exists for this Program.'
            )

            return

        }

       const payload =
    buildSchedulePayload()

        let error

        if (
            scheduleId
        ) {

            const result =
                await window
                    .supabaseClient
                    .from(
                        'program_schedules'
                    )
                    .update(
                        payload
                    )
                    .eq(
                        'program_schedule_id',
                        scheduleId
                    )

            error =
                result.error

        } else {

            const result =
                await window
                    .supabaseClient
                    .from(
                        'program_schedules'
                    )
                    .insert(
                        payload
                    )

            error =
                result.error

        }

        if (
            error
        ) {

            throw error

        }

        document
    .getElementById(
        'scheduleId'
    )
    .value = ''

document
    .getElementById(
        'scheduleName'
    )
    .value = ''

document
    .getElementById(
        'scheduleStartDate'
    )
    .value = ''

document
    .getElementById(
        'scheduleEndDate'
    )
    .value = ''

document
    .getElementById(
        'scheduleStartTime'
    )
    .value = ''

document
    .getElementById(
        'scheduleEndTime'
    )
    .value = ''

document
    .getElementById(
        'scheduleDay'
    )
    .value = ''

await loadSchedules(
    programId
)

        showSuccess(
            scheduleId
                ? 'Schedule updated successfully.'
                : 'Schedule saved successfully.'
        )

    } catch (
        error
    ) {

        console.error(
            error
        )

        showError(

            error.message ||

            'Failed to save Program Schedule.'

        )

    }

}


// =====================================================
// EDIT PROGRAM SCHEDULE
// =====================================================

window.editSchedule =
async function (

    scheduleId

) {

    clearError()

    try {

        const {

            data,

            error

        } =
            await window
                .supabaseClient
                .from(
                    'program_schedules'
                )
                .select(`

program_schedule_id,

program_id,

schedule_name,

schedule_start_date,

schedule_end_date,

start_time,

end_time,

active

`)
                .eq(
                    'program_schedule_id',
                    scheduleId
                )
                .single()

        if (
            error
        ) {

            throw error

        }

        document.getElementById(
    'scheduleId'
).value =
    data.program_schedule_id

        document.getElementById(
            'scheduleProgramId'
        ).value =
            data.program_id

        

        
        document
    .getElementById(
        'scheduleName'
    )
    .value =
    data.schedule_name || ''
       

        

        document.getElementById(
            'scheduleStartDate'
        ).value =
            data.schedule_start_date || ''
       
       updateScheduleDay()


        document.getElementById(
            'scheduleEndDate'
        ).value =
            data.schedule_end_date || ''

        document.getElementById(
            'scheduleStartTime'
        ).value =
            data.start_time || ''

        document.getElementById(
            'scheduleEndTime'
        ).value =
            data.end_time || ''

    } catch (
        error
    ) {

        console.error(
            error
        )

        showError(

            error.message ||

            'Failed to load Schedule.'

        )

    }

}

// =====================================================
// DELETE PROGRAM SCHEDULE
// =====================================================

window.deleteSchedule =
async function (

    scheduleId

) {

    clearError()

    try {

        if (

            !confirm(

                'Delete this Program Schedule?'

            )

        ) {

            return

        }

        const programId =

            document
                .getElementById(
                    'scheduleProgramId'
                )
                .value

        const {

            error

        } =
            await window
                .supabaseClient
                .from(
                    'program_schedules'
                )
                .delete()
                .eq(
                    'program_schedule_id',
                    scheduleId
                )

        if (

            error

        ) {

            throw error

        }

        document
            .getElementById(
                'scheduleId'
            )
            .value = ''

        document
            .getElementById(
                'scheduleName'
            )
            .value = ''

        document
            .getElementById(
                'scheduleStartDate'
            )
            .value = ''

        document
            .getElementById(
                'scheduleEndDate'
            )
            .value = ''

        document
            .getElementById(
                'scheduleStartTime'
            )
            .value = ''

        document
            .getElementById(
                'scheduleEndTime'
            )
            .value = ''

        document
            .getElementById(
                'scheduleDay'
            )
            .value = ''

        await loadSchedules(

            programId

        )

        showSuccess(

            'Schedule deleted successfully.'

        )

    }

    catch (

        error

    ) {

        console.error(

            error

        )

        showError(

            error.message ||

            'Failed to delete Schedule.'

        )

    }

}


function showError(message) {
  const errorBox =
    document.getElementById(
      'eventError'
    )

  if (!errorBox) {
    alert(message)

    return
  }

  errorBox.textContent =
    message

  errorBox.classList.remove(
    'd-none'
  )
}

function clearError() {
  const errorBox =
    document.getElementById(
      'eventError'
    )

  if (!errorBox) {
    return
  }

  errorBox.textContent = ''

  errorBox.classList.add(
    'd-none'
  )
}

async function loadEventNameSuggestions() {
  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from('events')
      .select(
        'event_name'
      )
      .order(
        'event_name'
      )

  if (error) {
    throw error
  }

  const datalist =
    document.getElementById(
      'eventNameSuggestions'
    )

  if (!datalist) {
    return
  }

  datalist.innerHTML = ''

  const uniqueNames =
    [
      ...new Set(
        (data || [])
          .map(
            row =>
              row.event_name
          )
          .filter(Boolean)
      )
    ]

  for (const name of uniqueNames) {
    const option =
        document.createElement(
          'option'
        )

    option.value = name

    datalist.append(
      option
    )
  }
}

async function loadEventCategories() {
  const select =
    document.getElementById(
      'eventCategoryId'
    )

  if (!select) {
    return
  }

  select.innerHTML = `
    <option value="">
      Select Event Category
    </option>
  `

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from(
        'event_category_master'
      )
      .select('*')
      .order(
        'category_name'
      )

  if (error) {
    throw error
  }

  for (const category of data) {
    select.innerHTML += `
        <option
          value="${category.event_category_id}">
          ${category.category_name}
        </option>
      `
  }
}

async function loadEventTypes() {
  const select =
    document.getElementById(
      'eventTypeId'
    )

  if (!select) {
    return
  }

  select.innerHTML = `
    <option value="">
      Select Event Type
    </option>
  `

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from(
        'event_type_master'
      )
      .select('*')
      .order(
        'event_type_name'
      )

  if (error) {
    throw error
  }

  for (const type of data) {
    select.innerHTML += `
        <option
          value="${type.event_type_id}">
          ${type.event_type_name}
        </option>
      `
  }
}

async function loadEventStatuses() {
  const select =
    document.getElementById(
      'eventStatusId'
    )

  if (!select) {
    return
  }

  select.innerHTML = `
    <option value="">
      Select Status
    </option>
  `

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from(
        'event_master_status_master'
      )
.select(`
  event_master_status_id,
  status_name,
  status_code
`)

  if (error) {
    throw error
  }

  for (const status of data) {
    if (
      status.status_code
    ?.toUpperCase() ===
  'ACTIVE'
    ) {
      activeStatusId =
    status.event_master_status_id
    }

    if (
      status.status_code
          ?.toUpperCase() ===
        'DEACTIVATED'
    ) {
      inactiveStatusId =
          status.event_master_status_id
    }

    select.innerHTML += `
        <option
          value="${status.event_master_status_id}">
          ${status.status_name}
        </option>
      `
  }
}


async function loadProgramMaster() {

    const select =
        document.getElementById(
            'programId'
        )

    if (
        !select
    ) {

        return

    }

    select.innerHTML = `
        <option value="">
            Select Program
        </option>
    `

    const {

        data,

        error

    } =
        await window
            .supabaseClient
            .from(
                'program_master'
            )
            .select(`
                program_id,
                program_code,
                program_name,
                sort_order
            `)
            .eq(
                'active',
                true
            )
            .order(
                'sort_order',
                {
                    ascending: true
                }
            )

    if (
        error
    ) {

        throw error

    }

    for (

        const program

        of data || []

    ) {

        select.innerHTML += `
            <option
                value="${program.program_id}">
                ${program.program_code} - ${program.program_name}
            </option>
        `

    }

}


async function loadEvents() {
  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from('events')
      .select(`
        *,
        event_category_master(
          category_name
        ),
        event_type_master(
          event_type_name
        ),
        event_master_status_master(
          status_name
        )
      `)
      .order(
        'created_at',
        {
          ascending: false
        }
      )

  if (error) {
    throw error
  }

  events =
    data || []

  filteredEvents =
    [...events]

  renderEvents()
}

function renderEvents() {
  const tbody =
    document.getElementById(
      'eventTableBody'
    )

  if (!tbody) {
    return
  }

  tbody.innerHTML = ''

  const start =
    (currentPage - 1) *
    pageSize

  const pageData =
    filteredEvents.slice(
      start,
      start + pageSize
    )

  for (const event of pageData) {
    tbody.innerHTML += `
        <tr>

          <td>
            ${event.event_name || ''}
          </td>

          <td>
            ${
  event
                .event_category_master
                ?.category_name || ''
}
          </td>

          <td>
            ${
  event
                .event_type_master
                ?.event_type_name || ''
}
          </td>

          <td>
            ${
  event
                .event_master_status_master
                ?.status_name || ''
}
          </td>

         <td class="text-center">

  <button
    class="btn btn-sm btn-primary me-1"
    onclick="editEvent('${event.event_id}')">
    Edit
  </button>

  

  <button
    class="btn btn-sm btn-danger"
    onclick="deleteEvent('${event.event_id}')">
    Delete
  </button>

</td>

        </tr>
      `
  }

  renderPagination()
}

function searchEvents() {
  const search =
    document
      .getElementById(
        'searchEvent'
      )
      .value
      .trim()
      .toLowerCase()

  filteredEvents =
    events.filter(
      event =>

        event.event_name
          ?.toLowerCase()
          .includes(search) ||

        event
          .event_category_master
          ?.category_name
          ?.toLowerCase()
          .includes(search) ||

        event
          .event_type_master
          ?.event_type_name
          ?.toLowerCase()
          .includes(search)
    )

  currentPage = 1

  renderEvents()
}

function renderPagination() {
  const container =
    document.getElementById(
      'paginationContainer'
    )

  const info =
    document.getElementById(
      'paginationInfo'
    )

  if (
    !container ||
    !info
  ) {
    return
  }

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredEvents.length /
        pageSize
      )
    )

  info.textContent =
    `${filteredEvents.length} record(s)`

  container.innerHTML = ''

  for (
    let i = 1;
    i <= totalPages;
    i++
  ) {
    container.innerHTML += `
      <li class="page-item ${
  i === currentPage ?
    'active' :
    ''
}">

        <a
          class="page-link"
          href="#"
          onclick="goToPage(${i})">

          ${i}

        </a>

      </li>
    `
  }
}

function goToPage(page) {
  currentPage = page

  renderEvents()
}

function validateEvent() {
  return Boolean(

    document
      .getElementById(
        'eventName'
      )
      .value
      .trim() &&

    document
      .getElementById(
        'eventCategoryId'
      )
      .value &&

    document
      .getElementById(
        'eventTypeId'
      )
      .value

  )
}

function openNewEventModal() {
  clearError()

  clearEventForm()

  document
    .getElementById(
      'eventStatusContainer'
    )
    .classList
    .add('d-none')

  eventModal.show()
}

function clearEventForm() {
  document.getElementById(
    'eventId'
  ).value = ''

  document.getElementById(
    'eventName'
  ).value = ''

  document.getElementById(
    'eventCategoryId'
  ).value = ''

  document.getElementById(
    'eventTypeId'
  ).value = ''

  document.getElementById(
    'eventStatusId'
  ).value = ''
}

window.editEvent =
function (eventId) {
  const event =
    events.find(
      row =>
        row.event_id ===
        eventId
    )

  if (!event) {
    return
  }

  clearError()

  document
    .getElementById(
      'eventId'
    )
    .value =
      event.event_id

  document
    .getElementById(
      'eventName'
    )
    .value =
      event.event_name

  document
    .getElementById(
      'eventCategoryId'
    )
    .value =
      event.event_category_id

  document
    .getElementById(
      'eventTypeId'
    )
    .value =
      event.event_type_id

  document
    .getElementById(
      'eventStatusId'
    )
    .value =
      event.event_master_status_id

  document
    .getElementById(
      'eventStatusContainer'
    )
    .classList
    .remove('d-none')

  eventModal.show()
}

window.deleteEvent =
async function (
  eventId
) {
  if (
    !confirm(
      'Delete this Event Master?'
    )
  ) {
    return
  }

  const {
    error
  } =
    await window
      .supabaseClient
      .from('events')
      .delete()
      .eq(
        'event_id',
        eventId
      )

  if (error) {
    showError(
      error.message
    )

    return
  }

  await loadEvents()
}

async function eventExists(
  eventName,
  eventTypeId,
  excludeId = null
) {
  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from('events')
      .select(
        'event_id'
      )
      .eq(
        'event_name',
        eventName
      )
      .eq(
        'event_type_id',
        eventTypeId
      )

  if (error) {
    throw error
  }

  const rows =
    (data || [])
      .filter(
        row =>
          row.event_id !==
          excludeId
      )

  return rows.length > 0
}

async function saveEvent() {
  clearError()

  if (
    !validateEvent()
  ) {
    showError(
      'All fields are required.'
    )

    return
  }

  try {
    const eventId =
      document
        .getElementById(
          'eventId'
        )
        .value

    const eventName =
      document
        .getElementById(
          'eventName'
        )
        .value
        .trim()

    const eventTypeId =
      document
        .getElementById(
          'eventTypeId'
        )
        .value

    const exists =
      await eventExists(
        eventName,
        eventTypeId,
        eventId
      )

    if (exists) {
      showError(
        'Event Name and Event Type already exist.'
      )

      return
    }

    const payload = {

      event_name:
        eventName,

      event_category_id:
        document
          .getElementById(
            'eventCategoryId'
          )
          .value,

      event_type_id:
        eventTypeId

    }

    if (eventId) {
      payload.event_master_status_id =
        document
          .getElementById(
            'eventStatusId'
          )
          .value

      const {
        error
      } =
        await window
          .supabaseClient
          .from('events')
          .update(
            payload
          )
          .eq(
            'event_id',
            eventId
          )

      if (error) {
        throw error
      }
    } else {
      payload.event_master_status_id =
        activeStatusId

      const {
        error
      } =
        await window
          .supabaseClient
          .from('events')
          .insert(
            payload
          )

      if (error) {
        throw error
      }
    }

    eventModal.hide()

    await loadEvents()

    await loadEventNameSuggestions()

  } catch (error) {
    console.error(error)

    showError(
      error.message ||
      'Failed to save Event Master.'
    )
  }
}

window.openNewEventModal =
  openNewEventModal

window.saveEvent =
  saveEvent

window.goToPage =
  goToPage

window.searchEvents =
  searchEvents
