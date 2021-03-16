const path = require('path')
const { Tray } = require('electron')
const i18n = require('hydra-i18n')
const { trayAttachedWindowFactory } = require('hydra-electron-browser-windows')

// tray needs to be a global variable, else it gets GC'd and the icon vanishes
let tray

/**
 * When the tray browser window is open, this will be a reference to the
 * Electron BrowserWindow. When it is closed, it will be null. 
 */
this.trayBrowserWindow = null

/**
 * Creates the tray icon on macOS and Windows.
 *
 * @param {string} options.theme - The theme name to load.
 * @param {function} options.onTrayIconClick - Callback to run before any click
 * logic. Recieves all Electron tray click args. Return false to prevent click action.
 * @param {function} options.afterTrayIconClick - Callback to run after all
 * click logic. Recieves the BrowserWindow instance if the click action opened
 * it, else recieves `null` to indicate that the window no longer exists
 * (because it was actually destroyed - the process is gone).
 */
exports.create = (options = {}) => {
  console.log('creating tray icon')

  if (!('theme' in options)) {
    throw new Error('Hydra tray requires a theme.')
  }

  tray = new Tray(path.join(__dirname, 'icon', 'tray.png'))
  tray.setToolTip(i18n.string('server.app-name'))

  // clicking the icon should open and close the server browser window unless
  // the callback prevents it
  tray.on('click', async (event, bounds, point) => {
    let cbReturn

    if (typeof options.onTrayIconClick === 'function') {
      cbReturn = options.onTrayIconClick(event, bounds, point)
    }
    
    // block the click action
    if (cbReturn === false) return

    // create the window if it doesn't already exist
    if (!this.trayBrowserWindow) {
      console.log('Creating tray icon browser window')

      this.trayBrowserWindow = await trayAttachedWindowFactory.create({
        'theme': options.theme,
        'bounds': bounds,
        'onClosed': () => {
          this.trayBrowserWindow = null
        }
      })

      if (typeof options.afterTrayIconClick === 'function') {
        options.afterTrayIconClick(this.trayBrowserWindow)
      }
    }
    // close the window if it already exists
    else {
      console.log('Closing tray icon browser window')
      this.trayBrowserWindow.close()
      this.trayBrowserWindow = null

      if (typeof options.afterTrayIconClick === 'function') {
        options.afterTrayIconClick(null)
      }
    }
  })
}