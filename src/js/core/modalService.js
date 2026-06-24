// =====================================================
// MODAL SERVICE
// ParaCycling Federation Management System
// =====================================================

const modalRegistry =
  new Map()

// =====================================================
// GET MODAL
// =====================================================

export function getModal(
  modalId
) {

  if (
    modalRegistry.has(
      modalId
    )
  ) {
    return modalRegistry.get(
      modalId
    )
  }

  const element =
    document.getElementById(
      modalId
    )

  if (!element) {
    return null
  }

  const modal =
    new coreui.Modal(
      element
    )

  modalRegistry.set(
    modalId,
    modal
  )

  return modal

}

// =====================================================
// SHOW
// =====================================================

export function showModal(
  modalId
) {

  const modal =
    getModal(
      modalId
    )

  if (!modal) {
    return false
  }

  modal.show()

  return true

}

// =====================================================
// HIDE
// =====================================================

export function hideModal(
  modalId
) {

  const modal =
    getModal(
      modalId
    )

  if (!modal) {
    return false
  }

  modal.hide()

  return true

}

// =====================================================
// TOGGLE
// =====================================================

export function toggleModal(
  modalId
) {

  const element =
    document.getElementById(
      modalId
    )

  if (!element) {
    return false
  }

  if (
    element.classList.contains(
      'show'
    )
  ) {

    hideModal(
      modalId
    )

  } else {

    showModal(
      modalId
    )

  }

  return true

}

// =====================================================
// DESTROY
// =====================================================

export function destroyModal(
  modalId
) {

  const modal =
    modalRegistry.get(
      modalId
    )

  if (!modal) {
    return
  }

  modal.dispose()

  modalRegistry.delete(
    modalId
  )

}

export function showModalByElement(
  element
) {

  if (!element) {
    return null
  }

  const modal =
    coreui.Modal
      .getOrCreateInstance(
        element
      )

  modal.show()

  return modal

}

export function hideModalByElement(
  element
) {

  if (!element) {
    return null
  }

  const modal =
    coreui.Modal
      .getOrCreateInstance(
        element
      )

  modal.hide()

  return modal

}

export function createModal(
  modalId
) {

  const element =
    document.getElementById(
      modalId
    )

  if (!element) {
    return null
  }

  return coreui.Modal
    .getOrCreateInstance(
      element
    )

}

export function confirmModal({

  modalId,

  onConfirm,

  confirmButtonId

}) {

  const button =
    document.getElementById(
      confirmButtonId
    )

  if (!button) {
    return
  }

  button.onclick =
    async () => {

      await onConfirm?.()

      hideModal(
        modalId
      )

    }

}

