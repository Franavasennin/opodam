import '@testing-library/jest-dom'

// jsdom no implementa scrollIntoView; lo stubeamos para los componentes de chat.
if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => {}
}
