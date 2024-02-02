chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'commitSolution') {
      // Extract solution content from the text area on the LeetCode page
      const solutionTextArea = document.querySelector('.monaco-editor textarea'); // Adjust the selector based on LeetCode's actual structure
      const solutionContent = solutionTextArea ? solutionTextArea.value : null;
  
      if (solutionContent) {
        // Send solution content to the server for GitHub commit
        fetch('http://localhost:3000/commit_solution', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ solutionContent }),
        })
          .then(response => response.json())
          .then(data => {
            sendResponse({ message: data.message });
          })
          .catch(error => {
            console.error('Error committing solution:', error);
            sendResponse({ message: 'Error committing solution' });
          });
      } else {
        sendResponse({ message: 'No solution found on the LeetCode page' });
      }
  
      return true;
    }
  });
  