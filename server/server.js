const express = require('express');
const { exec } = require('child_process');

const app = express();
const port = 3000;

app.use(express.json());

app.post('/commit_solution', (req, res) => {
  // Extract solution content from the request
  const solutionContent = req.body.solutionContent;

  // Implement GitHub commit logic here
  // For simplicity, display the received solution content
  console.log('Received solution content:', solutionContent);

  // Respond with a success message
  res.json({ message: 'Solution committed successfully!' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
