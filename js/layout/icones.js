/* Ícones do site em um único sprite SVG (logo do astronauta + ícones de traço) */
const icone = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
const simbolo = (id, tracos) => `
  <symbol id="${id}" viewBox="0 0 24 24">
    <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${tracos}</g>
  </symbol>`;

const SPRITE_ICONES = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <symbol id="logo" viewBox="0 0 48 48">
      <rect width="48" height="48" rx="12" fill="#e5202b"/>
      <path d="M5 48c0-9 8-14 19-14s19 5 19 14z" fill="#fff"/>
      <circle cx="12.5" cy="44.5" r="2" fill="#e5202b"/>
      <rect x="17" y="30" width="14" height="6" rx="3" fill="#1a1a1a"/>
      <circle cx="24" cy="19" r="13" fill="#fff"/>
      <rect x="14" y="12.5" width="20" height="13" rx="6.5" fill="#1a1a1a"/>
      <path d="M17.5 17.8a5 5 0 0 1 4-2.7" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
    </symbol>
    ${simbolo('i-user', '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>')}
    ${simbolo('i-user-check', '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>')}
    ${simbolo('i-users', '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>')}
    ${simbolo('i-snow', '<path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9 4.9 19.1"/>')}
    ${simbolo('i-dumbbell', '<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/>')}
    ${simbolo('i-check', '<path d="M20 6 9 17l-5-5"/>')}
    ${simbolo('i-chevron', '<path d="m6 9 6 6 6-6"/>')}
    ${simbolo('i-dashboard', '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>')}
    ${simbolo('i-calendar', '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>')}
    ${simbolo('i-chart', '<path d="M18 20V10M12 20V4M6 20v-6"/>')}
    ${simbolo('i-logout', '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>')}
    ${simbolo('i-voltar', '<path d="M19 12H5M12 19l-7-7 7-7"/>')}
    ${simbolo('i-menu', '<path d="M3 6h18M3 12h18M3 18h18"/>')}
    ${simbolo('i-instagram', '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><path d="M17.5 6.5h.01"/>')}
    ${simbolo('i-facebook', '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>')}
    ${simbolo('i-whatsapp', '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l1.9-5.6A8.4 8.4 0 1 1 21 11.5z"/><path d="M9 8.5c.4 2.2 2.3 4.1 4.5 4.5l1.2-1.3-1.8-1-.9.7a3.2 3.2 0 0 1-1.6-1.6l.7-.9-1-1.8z"/>')}
  </svg>`;

document.body.insertAdjacentHTML('afterbegin', SPRITE_ICONES);   // disponibiliza os ícones na página
