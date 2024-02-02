document.getElementById('commitButton').addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'commitSolution' }, function(response) {
        document.getElementById('status').innerText = response.message;
      });
    });
  });
  