// =====================================================
// MODAL SERVICE
// ParaCycling Federation Management System
// =====================================================

const modalRegistry =
  new Map()

function getModalApi() {
  return (
    window.coreui
      ?.Modal ||
    null
  )
}

export function isModalAvailable() {
  return Boolean(
    getModalApi()
  )
}

export function createModalByElement(
  element
) {
  if (!element) {
    return null
  }

  const Modal =
    getModalApi()

  if (!Modal) {
    return null
  }

  return Modal
    .getOrCreateInstance(
      element
    )
}

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

  const modal =
    createModalByElement(
      element
    )

  if (!modal) {
    return null
  }

  modalRegistry.set(
    modalId,
    modal
  )

  return modal
}

export function createModal(
  modalId
) {
  return getModal(
    modalId
  )
}

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
    return hideModal(
      modalId
    )
  }

  return showModal(
    modalId
  )
}

export function destroyModal(
  modalId
) {
  const modal =
    modalRegistry.get(
      modalId
    )

  if (!modal) {
    return false
  }

  modal.dispose()
  modalRegistry.delete(
    modalId
  )

  return true
}

export function showModalByElement(
  element
) {
  const modal =
    createModalByElement(
      element
    )

  if (!modal) {
    return null
  }

  modal.show()

  return modal
}

export function hideModalByElement(
  element
) {
  const modal =
    createModalByElement(
      element
    )

  if (!modal) {
    return null
  }

  modal.hide()

  return modal
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
    return false
  }

  button.addEventListener(
    'click',
    async () => {
      await onConfirm?.()

      hideModal(
        modalId
      )
    }
  )

  return true
}

export function openEntityModal({
  modalId,
  titleId,
  title,
  beforeOpen = null
}) {
  if (
    typeof beforeOpen ===
    'function'
  ) {
    beforeOpen()
  }

  const titleElement =
    document.getElementById(
      titleId
    )

  if (titleElement) {
    titleElement.textContent =
      title
  }

  return showModal(
    modalId
  )
}
