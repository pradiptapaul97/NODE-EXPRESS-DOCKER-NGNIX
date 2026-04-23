const express = require('express');       // Import the Express framework
const app = express();                    // Create an Express application instance
const PORT = process.env.PORT || 3000;   // Use PORT from environment variable, fallback to 3000

app.get('/', (req, res) => {             // Define a GET route at the root path "/"
  res.json({                             // Send a JSON response
    message: 'Hello from Node!',         // Static message to identify the server
    pid: process.pid,                    // Process ID — proves different containers handle requests
    port: PORT                           // Shows which port this instance is running on
  });
});

app.listen(PORT, () =>                   // Start the server and listen on the defined PORT
  console.log(`Server running on port ${PORT}`)  // Log confirmation when server starts
);
