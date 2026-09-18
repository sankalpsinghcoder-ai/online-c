/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');

describe('Storage access restricted', () => {
  let originalWarn;
  let warnMock;

  beforeAll(() => {
    originalWarn = console.warn;
    warnMock = jest.fn();
    console.warn = warnMock;
  });

  afterAll(() => {
    console.warn = originalWarn;
  });

  beforeEach(() => {
    warnMock.mockClear();
    jest.resetModules();
  });

  it('should call console.warn with expected message when localStorage throws error', (done) => {
    // Override localStorage to throw an error
    const error = new Error('Access denied');
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => { throw error; }),
        setItem: jest.fn()
      },
      writable: true
    });

    const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');

    // Load the script
    document.body.innerHTML = html;

    // The script is inside index.html, we can extract and evaluate it
    const scripts = document.querySelectorAll('script');
    let cacheClearScriptContent = '';
    scripts.forEach(script => {
      if (script.textContent.includes('localStorage.getItem("jsdos_cache_cleared")')) {
        cacheClearScriptContent = script.textContent;
      }
    });

    // Execute the extracted script
    // Since the script uses an async IIFE, we can evaluate it
    // But since it's evaluated, we can just await its execution by adding a promise wrapper if needed,
    // or just let it execute. The try-catch block is synchronous for the localStorage.getItem part.

    eval(cacheClearScriptContent);

    // Give the async IIFE a tick to run
    setTimeout(() => {
      expect(warnMock).toHaveBeenCalledWith("Storage access restricted:", error);
      done();
    }, 0);
  });
});
