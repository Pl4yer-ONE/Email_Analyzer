/// <reference types="chrome"/>

// Message handling
chrome.runtime.onMessage.addListener((
  request: { headers: string },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  if (request.headers) {
    analyzeEmailHeaders(request.headers)
      .then((result: any) => sendResponse({ result }))
      .catch((error: Error) => sendResponse({ error: error.message }));
    return true; // Keep message channel open for async response
  }
});

// Port connection handling
chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
  port.onMessage.addListener((msg: any) => {
    if (msg.type === 'ANALYZE_HEADERS') {
      analyzeEmailHeaders(msg.headers)
        .then((result: any) => port.postMessage({ result }))
        .catch((error: Error) => port.postMessage({ error: error.message }));
    }
  });
});

// Email header analysis function
function analyzeEmailHeaders(headers: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      // Add your header parsing logic here
      const analysisResult = {
        spf: 'pass',
        dkim: ['valid'],
        dmarc: 'fail'
      };
      resolve(analysisResult);
    } catch (error) {
      reject(error);
    }
  });
} 