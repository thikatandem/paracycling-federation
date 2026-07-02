export function renderSidebar(
  items
) {

  const container =
    document.getElementById(
      'roleSidebar'
    )

  if (
    !container
  ) {

    return

  }

  container.innerHTML =
    `
      <ul
        class="sidebar-nav"
        data-coreui="navigation"
        data-simplebar
      >
        ${items
          .map(
            item =>
              `
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="${item.href}"
                >
                  ${item.label}
                </a>
              </li>
              `
          )
          .join('')}
      </ul>
    `

}