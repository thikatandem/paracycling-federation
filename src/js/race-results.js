/* global coreui */
/* eslint-disable no-alert */

const PAGE_SIZE = 10;

let currentPage = 1;

let results = [];
let filteredResults = [];

let events = [];
let eventTeams = [];

let resultModal = null;
let deleteResultModal = null;
const db = window.supabaseClient;

const $ = id => document.getElementById(id);
function getMedal(position) {
  const pos = Number(position);

  if (pos === 1) return 'Gold';
  if (pos === 2) return 'Silver';
  if (pos === 3) return 'Bronze';

  return '';
}
function showLoading() {
  $('resultLoading').classList.remove('d-none');
}

function hideLoading() {
  $('resultLoading').classList.add('d-none');
}
async function loadEvents() {

  const { data, error } = await db
    .from('events')
    .select(`
      event_id,
      event_name
    `)
    .order('event_name');

  if (error) {
    console.error(error);
    return;
  }

  events = data || [];

  $('eventId').innerHTML =
    '<option value="">Select Event</option>';

  events.forEach(event => {

    $('eventId').insertAdjacentHTML(
      'beforeend',
      `
      <option value="${event.event_id}">
        ${event.event_name}
      </option>
      `
    );

  });
}
async function loadTeamsForEvent(eventId) {

  $('teamId').innerHTML =
    '<option value="">Loading...</option>';

  if (!eventId) {

    $('teamId').innerHTML =
      '<option value="">Select Event First</option>';

    return;
  }

  const { data, error } = await db
    .from('event_participants')
    .select(`
      team_id,
      teams (
        team_name
      )
    `)
    .eq('event_id', eventId);

  if (error) {
    console.error(error);
    return;
  }

  eventTeams = data || [];

  $('teamId').innerHTML =
    '<option value="">Select Team</option>';

  eventTeams.forEach(item => {

    $('teamId').insertAdjacentHTML(
      'beforeend',
      `
      <option value="${item.team_id}">
        ${item.teams?.team_name || ''}
      </option>
      `
    );

  });
}
async function loadResults() {

  showLoading();

  const { data, error } = await db
    .from('race_results')
    .select(`
      result_id,
      event_id,
      team_id,
      position,
      finish_time,
      points,
      medal,

      events (
        event_name
      ),

      teams (
        team_name
      )
    `)
    .order('position');

  hideLoading();

  if (error) {
    console.error(error);
    return;
  }

  results = data || [];
  filteredResults = [...results];

  renderResults();
}
function renderResults() {

  const start =
    (currentPage - 1) * PAGE_SIZE;

  const pageData =
    filteredResults.slice(
      start,
      start + PAGE_SIZE
    );

  $('resultsTableBody').innerHTML = '';

  pageData.forEach(result => {

    $('resultsTableBody').insertAdjacentHTML(
      'beforeend',
      `
      <tr>

        <td>
          ${result.events?.event_name || ''}
        </td>

        <td>
          ${result.teams?.team_name || ''}
        </td>

        <td>
          ${result.position || ''}
        </td>

        <td>
          ${result.finish_time || ''}
        </td>

        <td>
          ${result.points || 0}
        </td>

        <td>
          ${result.medal || ''}
        </td>

        <td>

          <button
            class="btn btn-sm btn-primary me-1"
            onclick="editResult('${result.result_id}')"
          >
            Edit
          </button>

          <button
            class="btn btn-sm btn-danger"
            onclick="deleteResult('${result.result_id}')"
          >
            Delete
          </button>

        </td>

      </tr>
      `
    );

  });

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredResults.length / PAGE_SIZE
      )
    );

  $('paginationInfo').textContent =
    `Page ${currentPage} of ${totalPages}`;
}
function searchResults() {

  const search =
    (
      $('searchResult')?.value || ''
    )
      .trim()
      .toLowerCase();

  if (!search) {

    filteredResults =
      [...results];

  } else {

    filteredResults =
      results.filter(result =>

        (
          result.events?.event_name || ''
        )
          .toLowerCase()
          .includes(search)

        ||

        (
          result.teams?.team_name || ''
        )
          .toLowerCase()
          .includes(search)

        ||

        (
          result.medal || ''
        )
          .toLowerCase()
          .includes(search)

      );

  }

  currentPage = 1;

  renderResults();
}
async function saveResult() {

  try {

    const resultId =
      $('resultId').value;

    const eventId =
      $('eventId').value;

    const teamId =
      $('teamId').value;

    const position =
      Number(
        $('position').value
      );

    const finishTime =
      $('finishTime').value;

    const points =
      Number(
        $('points').value || 0
      );

    if (!eventId) {
      throw new Error(
        'Event is required'
      );
    }

    if (!teamId) {
      throw new Error(
        'Team is required'
      );
    }

    if (!position) {
      throw new Error(
        'Position is required'
      );
    }

    const duplicateQuery =
      db
        .from('race_results')
        .select('result_id')
        .eq('event_id', eventId)
        .eq('team_id', teamId);

    if (resultId) {
      duplicateQuery.neq(
        'result_id',
        resultId
      );
    }

    const {
      data: duplicates,
      error: duplicateError
    } = await duplicateQuery;

    if (duplicateError) {
      throw duplicateError;
    }

    if (
      duplicates &&
      duplicates.length
    ) {

      throw new Error(
        'Team already has a result for this event'
      );

    }

    const payload = {

      event_id:
        eventId,

      team_id:
        teamId,

      position:
        position,

      finish_time:
        finishTime,

      points:
        points
    };

    let error;

    if (resultId) {

      const response =
        await db
          .from('race_results')
          .update(payload)
          .eq(
            'result_id',
            resultId
          );

      error =
        response.error;

    } else {

      const response =
        await db
          .from('race_results')
          .insert(payload);

      error =
        response.error;
    }

    if (error) {
      throw error;
    }

    coreui.Modal
      .getInstance(
        $('resultModal')
      )
      ?.hide();

    await loadResults();

  } catch (error) {

    console.error(error);

    $('resultFormError').textContent =
      error.message;
  }
}
window.editResult =
async function (
  resultId
) {

  const result =
    results.find(
      item =>
        item.result_id ===
        resultId
    );

  if (!result) {
    return;
  }

  $('resultFormError').textContent =
    '';

  $('resultId').value =
    result.result_id;

  $('eventId').value =
    result.event_id;

  await loadTeamsForEvent(
    result.event_id
  );

  $('teamId').value =
    result.team_id;

  $('position').value =
    result.position || '';

  $('finishTime').value =
    result.finish_time || '';

  $('points').value =
    result.points || '';

  $('medal').value =
    getMedal(
      result.position
    );

  if (!resultModal) {

    resultModal =
      new coreui.Modal(
        $('resultModal')
      );
  }

  resultModal.show();
};
window.deleteResult =
function (
  resultId
) {

  $('deleteResultId').value =
    resultId;

  if (
    !deleteResultModal
  ) {

    deleteResultModal =
      new coreui.Modal(
        $('deleteResultModal')
      );
  }

  deleteResultModal.show();
};

async function confirmDeleteResult() {

  try {

    const resultId =
      $('deleteResultId').value;

    const { error } =
      await db
        .from('race_results')
        .delete()
        .eq(
          'result_id',
          resultId
        );

    if (error) {
      throw error;
    }

    deleteResultModal?.hide();

    await loadResults();

  } catch (error) {

    console.error(error);

    alert(
      error.message
    );
  }
}
function wireButtons() {

  $('searchResult')
    ?.addEventListener(
      'input',
      searchResults
    );

  $('btnRefreshResults')
    ?.addEventListener(
      'click',
      loadResults
    );

  $('btnSaveResult')
    ?.addEventListener(
      'click',
      saveResult
    );

  $('btnConfirmDeleteResult')
    ?.addEventListener(
      'click',
      confirmDeleteResult
    );

  $('btnAddResult')
    ?.addEventListener(
      'click',
      () => {

        $('resultId').value = '';

        $('eventId').value = '';

        $('teamId').innerHTML =
          `
          <option value="">
            Select Event First
          </option>
          `;

        $('position').value = '';

        $('finishTime').value = '';

        $('points').value = '';

        $('medal').value = '';

        $('resultFormError').textContent =
          '';

        if (!resultModal) {

          resultModal =
            new coreui.Modal(
              $('resultModal')
            );
        }

        resultModal.show();
      }
    );

  $('eventId')
    ?.addEventListener(
      'change',
      async event => {

        await loadTeamsForEvent(
          event.target.value
        );
      }
    );

  $('position')
    ?.addEventListener(
      'input',
      event => {

        $('medal').value =
          getMedal(
            event.target.value
          );
      }
    );

  $('btnPreviousPage')
    ?.addEventListener(
      'click',
      () => {

        if (
          currentPage > 1
        ) {

          currentPage--;

          renderResults();
        }
      }
    );

  $('btnNextPage')
    ?.addEventListener(
      'click',
      () => {

        const totalPages =
          Math.ceil(
            filteredResults.length /
            PAGE_SIZE
          );

        if (
          currentPage <
          totalPages
        ) {

          currentPage++;

          renderResults();
        }
      }
    );
}
async function initializeRaceResults() {

  try {

    resultModal =
      new coreui.Modal(
        $('resultModal')
      );

    deleteResultModal =
      new coreui.Modal(
        $('deleteResultModal')
      );

    await loadEvents();

    await loadResults();

    wireButtons();

  } catch (error) {

    console.error(error);

    alert(
      error.message
    );
  }
}

document.addEventListener(
  'DOMContentLoaded',
  initializeRaceResults
);
