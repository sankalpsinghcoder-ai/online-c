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

describe('Keyboard helper input security', () => {
  it('should reset value to empty string when input event is triggered', () => {
    const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
    document.body.innerHTML = html;

    const hiddenInput = document.getElementById('keyboard-helper');
    expect(hiddenInput).not.toBeNull();

    window.Dos = jest.fn().mockImplementation(() => ({
      then: jest.fn().mockReturnThis(),
      catch: jest.fn().mockReturnThis()
    }));

    const scripts = document.querySelectorAll('script');
    let mainScriptContent = '';
    scripts.forEach(script => {
      if (script.textContent.includes('hiddenInput.addEventListener("input"')) {
        mainScriptContent = script.textContent;
      }
    });

    eval(mainScriptContent);

    const startBtn = document.getElementById('start-btn');
    startBtn.click();

    hiddenInput.value = 'sensitive data';
    hiddenInput.dispatchEvent(new Event('input'));

    expect(hiddenInput.value).toBe('');
  });

  it('should reset value even if beforeinput handler encounters an error during keyPress', async () => {
    const originalWarn = console.warn;
    const warnMock = jest.fn();
    console.warn = warnMock;

    try {
      const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
      document.body.innerHTML = html;

      const hiddenInput = document.getElementById('keyboard-helper');

      const mockKeyboard = {
        keyPress: jest.fn().mockImplementation(() => {
          throw new Error('keyPress failure');
        })
      };

      window.Dos = jest.fn().mockImplementation(() => {
        const promiseMock = {
          then: jest.fn().mockImplementation((cb) => {
            cb({
              events: jest.fn().mockResolvedValue({ keyboard: mockKeyboard }),
              run: jest.fn()
            });
            return promiseMock;
          }),
          catch: jest.fn().mockReturnThis()
        };
        return promiseMock;
      });

      const scripts = document.querySelectorAll('script');
      let mainScriptContent = '';
      scripts.forEach(script => {
        if (script.textContent.includes('hiddenInput.addEventListener("input"')) {
          mainScriptContent = script.textContent;
        }
      });

      eval(mainScriptContent);

      const startBtn = document.getElementById('start-btn');
      startBtn.click();

      // Wait tick for async Dos().then callback to initialize keyboard
      await new Promise(resolve => setTimeout(resolve, 0));

      hiddenInput.value = 'A';
      const beforeInputEvent = new Event('beforeinput');
      Object.defineProperty(beforeInputEvent, 'data', { value: 'A' });
      hiddenInput.dispatchEvent(beforeInputEvent);

      expect(hiddenInput.value).toBe('');
      expect(warnMock).toHaveBeenCalledWith('Error processing beforeinput event:', expect.any(Error));
    } finally {
      console.warn = originalWarn;
    }
  });
});

describe('Service Worker URL validation', () => {
  it('should ignore malformed or non-http(s) URLs without throwing', () => {
    const swCode = fs.readFileSync(path.resolve(__dirname, 'service-worker.js'), 'utf8');

    let fetchListener;
    const selfMock = {
      addEventListener: (event, callback) => {
        if (event === 'fetch') fetchListener = callback;
      },
      location: { origin: 'https://sankalpsinghcoder-ai.github.io' }
    };

    const runSW = new Function('self', 'caches', 'fetch', swCode);
    runSW(selfMock, {}, jest.fn());

    expect(fetchListener).toBeDefined();

    // Test malformed URL
    const invalidEvent = {
      request: {
        method: 'GET',
        url: 'invalid-url-string'
      },
      respondWith: jest.fn()
    };
    expect(() => fetchListener(invalidEvent)).not.toThrow();
    expect(invalidEvent.respondWith).not.toHaveBeenCalled();

    // Test unsupported protocol (e.g., chrome-extension:// or data:)
    const chromeExtEvent = {
      request: {
        method: 'GET',
        url: 'chrome-extension://abcdef/script.js'
      },
      respondWith: jest.fn()
    };
    expect(() => fetchListener(chromeExtEvent)).not.toThrow();
    expect(chromeExtEvent.respondWith).not.toHaveBeenCalled();
  });

  it('should clone response synchronously before awaiting getCache in fetch handlers', async () => {
    const swCode = fs.readFileSync(path.resolve(__dirname, 'service-worker.js'), 'utf8');

    let fetchListener;
    let cachePutCalled = false;
    let cloneCalled = false;

    const mockResponse = {
      ok: true,
      headers: { get: () => null },
      clone: jest.fn().mockImplementation(() => {
        cloneCalled = true;
        return { cloned: true };
      })
    };

    const mockCache = {
      put: jest.fn().mockImplementation(() => {
        cachePutCalled = true;
      })
    };

    const mockCaches = {
      match: jest.fn().mockResolvedValue(null),
      open: jest.fn().mockResolvedValue(mockCache),
      keys: jest.fn().mockResolvedValue([])
    };

    const mockFetch = jest.fn().mockResolvedValue(mockResponse);

    const selfMock = {
      addEventListener: (event, callback) => {
        if (event === 'fetch') fetchListener = callback;
      },
      location: { origin: 'https://sankalpsinghcoder-ai.github.io' }
    };

    // Override fetch inside closure by replacing 'fetch(' in swCode with 'myFetch('
    const testSWCode = swCode.replaceAll('fetch(', 'myFetch(');
    const runSW = new Function('self', 'caches', 'myFetch', testSWCode);
    runSW(selfMock, mockCaches, mockFetch);

    let handlePromise;
    const event = {
      request: {
        method: 'GET',
        url: 'https://sankalpsinghcoder-ai.github.io/online-c/icon-1-48.png',
        destination: 'script'
      },
      respondWith: jest.fn().mockImplementation(promise => {
        handlePromise = promise;
      })
    };

    fetchListener(event);

    await handlePromise;

    expect(mockFetch).toHaveBeenCalled();
    expect(mockResponse.clone).toHaveBeenCalled();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(cachePutCalled).toBe(true);
  });
});
