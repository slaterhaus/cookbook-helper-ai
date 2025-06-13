import { BrowserWindow, shell, screen } from 'electron';
import { rendererAppName, rendererAppPort } from './constants';
import { environment } from '../environments/environment';
import { join } from 'path';
import { format } from 'url';

export default class App {
  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is garbage collected.
  static mainWindow: Electron.BrowserWindow;
  static application: Electron.App;
  static BrowserWindow;

  public static isDevelopmentMode() {
    const isEnvironmentSet: boolean = 'ELECTRON_IS_DEV' in process.env;
    const getFromEnvironment: boolean =
      parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;

    return isEnvironmentSet ? getFromEnvironment : !environment.production;
  }

  private static onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      App.application.quit();
    }
  }

  private static onClose() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    App.mainWindow = null;
  }

  private static onRedirect(event: any, url: string) {
    if (url !== App.mainWindow.webContents.getURL()) {
      // this is a normal external redirect, open it in a new browser window
      event.preventDefault();
      shell.openExternal(url);
    }
  }

  private static onReady() {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    if (rendererAppName) {
      App.initMainWindow();
      App.loadMainWindow();
    }
  }

  private static onActivate() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (App.mainWindow === null) {
      App.onReady();
    }
  }

  private static initMainWindow() {
    const workAreaSize = screen.getPrimaryDisplay().workAreaSize;
    const width = Math.min(1280, workAreaSize.width || 1280);
    const height = Math.min(720, workAreaSize.height || 720);

    // Create the browser window.
    App.mainWindow = new BrowserWindow({
      width: width,
      height: height,
      show: false,
      webPreferences: {
        contextIsolation: true,
        backgroundThrottling: false,
        preload: join(__dirname, 'main.preload.js'),
        devTools: true,
        webSecurity: false, // Disable web security to allow loading local resources
      },
    });

    // Open DevTools in production for debugging
    App.mainWindow.webContents.openDevTools();
    App.mainWindow.setMenu(null);
    App.mainWindow.center();

    // if main window is ready to show, close the splash window and show the main window
    App.mainWindow.once('ready-to-show', () => {
      App.mainWindow.show();
    });

    // handle all external redirects in a new browser window
    // App.mainWindow.webContents.on('will-navigate', App.onRedirect);
    // App.mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options) => {
    //     App.onRedirect(event, url);
    // });

    // Emitted when the window is closed.
    App.mainWindow.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      App.mainWindow = null;
    });
  }

  private static loadMainWindow() {
    // load the index.html of the app.
    if (!App.application.isPackaged) {
      console.log('Loading from development server');
      App.mainWindow.loadURL(`http://localhost:${rendererAppPort}`);
    } else {
      console.log('Loading from packaged app');
      console.log('__dirname:', __dirname);

      // Try multiple possible paths to find the frontend
      const possiblePaths = [

        join(process.resourcesPath, 'frontend', 'index.html'),
        // Try frontend/browser - this is where the Angular application builder puts the files
        join(process.resourcesPath, 'frontend', 'browser', 'index.html'),
        // Try frontend/dist/frontend
        join(process.resourcesPath, 'frontend', 'dist', 'frontend', 'index.html'),
        // Try frontend/dist
        join(process.resourcesPath, 'frontend', 'dist', 'index.html'),
        // Try just frontend directory (might contain index.html directly)
        join(process.resourcesPath, 'frontend'),
        // Path in app.asar/frontend
        join(App.application.getAppPath(), 'frontend', 'index.html'),
        // Path in app.asar/frontend/browser
        join(App.application.getAppPath(), 'frontend', 'browser', 'index.html'),
        // Original path
        join(__dirname, '..', rendererAppName, 'index.html'),
        // Path relative to resources directory
        join(process.resourcesPath, rendererAppName, 'index.html'),
        // Path relative to app directory
        join(App.application.getAppPath(), rendererAppName, 'index.html'),
        // Try app.asar directly
        join(process.resourcesPath, 'app.asar', 'frontend', 'index.html'),
        // Try app.asar/frontend/browser
        join(process.resourcesPath, 'app.asar', 'frontend', 'browser', 'index.html'),
        // Try dist directory
        join(process.resourcesPath, 'dist', 'frontend', 'index.html'),
        // Try dist/frontend/browser
        join(process.resourcesPath, 'dist', 'frontend', 'browser', 'index.html'),
        // Try with app name
        join(process.resourcesPath, 'CookbookAI.app', 'Contents', 'Resources', 'frontend', 'index.html'),
        // Try with app name and browser
        join(process.resourcesPath, 'CookbookAI.app', 'Contents', 'Resources', 'frontend', 'browser', 'index.html'),
        // Try with app name and app.asar
        join(process.resourcesPath, 'CookbookAI.app', 'Contents', 'Resources', 'app.asar', 'frontend', 'index.html'),
        // Try with app name, app.asar, and browser
        join(process.resourcesPath, 'CookbookAI.app', 'Contents', 'Resources', 'app.asar', 'frontend', 'browser', 'index.html')
      ];

      // Check if files exist
      const fs = require('fs');
      console.log('Checking if files exist:');
      possiblePaths.forEach(path => {
        try {
          const exists = fs.existsSync(path);
          console.log(` - ${path}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);

          if (exists) {
            // If it's a directory, list its contents
            const stats = fs.statSync(path);
            if (stats.isDirectory()) {
              console.log(`   Directory contents of ${path}:`);
              const files = fs.readdirSync(path);
              files.forEach(file => console.log(`     - ${file}`));
            }
          }
        } catch (error) {
          console.error(` - Error checking ${path}:`, error.message);
        }
      });

      // List contents of resources directory
      try {
        console.log('Contents of resources directory:');
        const resourcesContents = fs.readdirSync(process.resourcesPath);
        resourcesContents.forEach(item => {
          console.log(` - ${item}`);
          // If it's a directory, list its contents
          try {
            const itemPath = join(process.resourcesPath, item);
            const stats = fs.statSync(itemPath);
            if (stats.isDirectory()) {
              console.log(`   Contents of ${item}:`);
              const subItems = fs.readdirSync(itemPath);
              subItems.forEach(subItem => {
                console.log(`     - ${subItem}`);
                // If it's a directory, list its contents
                try {
                  const subItemPath = join(itemPath, subItem);
                  const subStats = fs.statSync(subItemPath);
                  if (subStats.isDirectory()) {
                    console.log(`       Contents of ${subItem}:`);
                    const subSubItems = fs.readdirSync(subItemPath);
                    subSubItems.forEach(subSubItem => console.log(`         - ${subSubItem}`));
                  }
                } catch (error) {
                  // Ignore errors when trying to read subdirectories
                }
              });
            }
          } catch (error) {
            // Ignore errors when trying to read subdirectories
          }
        });
      } catch (error) {
        console.error('Error listing resources directory:', error.message);
      }

      // List contents of app path directory
      try {
        console.log('Contents of app path directory:');
        const appPathContents = fs.readdirSync(App.application.getAppPath());
        appPathContents.forEach(item => {
          console.log(` - ${item}`);
          // If it's a directory, list its contents
          try {
            const itemPath = join(App.application.getAppPath(), item);
            const stats = fs.statSync(itemPath);
            if (stats.isDirectory()) {
              console.log(`   Contents of ${item}:`);
              const subItems = fs.readdirSync(itemPath);
              subItems.forEach(subItem => console.log(`     - ${subItem}`));
            }
          } catch (error) {
            // Ignore errors when trying to read subdirectories
          }
        });
      } catch (error) {
        console.error('Error listing app path directory:', error.message);
      }

      console.log('Trying these paths:');
      possiblePaths.forEach(path => console.log(' - ' + path));

      // Try each path until one works
      let loaded = false;

      // Add error handler for page load failures
      App.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load page:', errorCode, errorDescription);
      });

      // Try to load from the first path
      try {
        const frontendPath = possiblePaths[0];
        console.log('Trying to load from:', frontendPath);

        // Use loadFile which is more reliable for local files
        App.mainWindow.loadFile(frontendPath).catch(error => {
          console.error('Error loading first path:', error);

          // Try the remaining paths
          const tryNextPath = async () => {
            for (let i = 1; i < possiblePaths.length; i++) {
              try {
                const path = possiblePaths[i];
                console.log('Trying alternate path:', path);

                await App.mainWindow.loadFile(path);
                loaded = true;
                console.log('Successfully loaded from alternate path:', path);
                break;
              } catch (error) {
                console.error(`Error loading from path ${possiblePaths[i]}:`, error);
              }
            }

            // If none of the paths worked, create a basic HTML file and load it
            if (!loaded) {
              console.log('All paths failed, creating and loading basic HTML file');
              App.createAndLoadFallbackHtml('Failed to find frontend files');
            }
          };

          tryNextPath();
        });
      } catch (error) {
        console.error('Error loading frontend:', error);

        // Create and load fallback HTML
        App.createAndLoadFallbackHtml('Error loading frontend: ' + error.message);
      }
    }
  }

  private static createAndLoadFallbackHtml(errorMessage: string) {
    console.log('Creating and loading fallback HTML with error:', errorMessage);

    // Create a basic HTML file in the app's user data directory
    const fs = require('fs');
    const path = require('path');
    const userDataPath = App.application.getPath('userData');
    const fallbackHtmlPath = path.join(userDataPath, 'fallback.html');

    // Get additional debugging information
    let resourcesContents = 'Unable to list resources directory';
    try {
      resourcesContents = fs.readdirSync(process.resourcesPath).join(', ');
    } catch (error) {
      resourcesContents = `Error: ${error.message}`;
    }

    let appPathContents = 'Unable to list app path directory';
    try {
      appPathContents = fs.readdirSync(App.application.getAppPath()).join(', ');
    } catch (error) {
      appPathContents = `Error: ${error.message}`;
    }

    const fallbackHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'unsafe-inline'">
      <title>CookbookAI</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
          color: #333;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background-color: white;
          padding: 20px;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #e74c3c;
        }
        pre {
          background-color: #f8f8f8;
          padding: 10px;
          border-radius: 3px;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Failed to load frontend</h1>
        <p>Error: ${errorMessage}</p>
        <h2>Debugging Information</h2>
        <p>Please provide this information when reporting the issue:</p>
        <pre id="debug-info">
App path: ${App.application.getAppPath()}
Resources path: ${process.resourcesPath}
User data path: ${userDataPath}
__dirname: ${__dirname}

Resources directory contents: ${resourcesContents}
App path directory contents: ${appPathContents}
        </pre>
      </div>
    </body>
    </html>
    `;

    try {
      fs.writeFileSync(fallbackHtmlPath, fallbackHtml);
      console.log(`Created fallback HTML at ${fallbackHtmlPath}`);
      App.mainWindow.loadFile(fallbackHtmlPath).catch(err => {
        console.error('Error loading fallback HTML file:', err);
        // If loading the file fails, use a data URL as a last resort
        App.mainWindow.loadURL('data:text/html,<html><body><h1>Failed to load frontend</h1><p>Check console for details</p></body></html>');
      });
    } catch (error) {
      console.error('Error creating fallback HTML file:', error);
      // If we can't create a file, fall back to data URL
      App.mainWindow.loadURL('data:text/html,<html><body><h1>Failed to load frontend</h1><p>Check console for details</p></body></html>');
    }
  }

  static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
    // we pass the Electron.App object and the
    // Electron.BrowserWindow into this function
    // so this class has no dependencies. This
    // makes the code easier to write tests for

    App.BrowserWindow = browserWindow;
    App.application = app;

    // Log app paths for debugging
    console.log('App paths:');
    console.log('App path:', app.getAppPath());
    console.log('User data path:', app.getPath('userData'));
    console.log('Exe path:', app.getPath('exe'));
    console.log('Module path:', app.getPath('module'));
    console.log('Is packaged:', app.isPackaged);

    // Log process information
    console.log('Process information:');
    console.log('Process.cwd():', process.cwd());
    console.log('Process.resourcesPath:', process.resourcesPath);
    console.log('Process.execPath:', process.execPath);

    App.application.on('window-all-closed', App.onWindowAllClosed); // Quit when all windows are closed.
    App.application.on('ready', App.onReady); // App is ready to load data
    App.application.on('activate', App.onActivate); // App is activated
  }
}
