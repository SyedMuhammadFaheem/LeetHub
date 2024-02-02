chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'commitSolution') {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'commitSolution' }, function(response) {
          sendResponse(response);
        });
      });
      return true;
    }
  });
  