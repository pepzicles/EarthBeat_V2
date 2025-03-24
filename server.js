const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Proxy endpoint for NASA EPIC images
app.get('/epic-image', async (req, res) => {
  try {
    const { year, month, day, imageName } = req.query;
    
    if (!year || !month || !day || !imageName) {
      return res.status(400).send('Missing required parameters');
    }
    
    // Construct the NASA EPIC image URL
    const imageUrl = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${imageName}.png`;
    
    console.log(`Fetching image: ${imageUrl}`);
    
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`NASA API responded with status: ${response.status}`);
    }
    
    const imageBuffer = await response.buffer();
    
    // Forward the content type
    res.set('Content-Type', response.headers.get('content-type'));
    
    // Send the image data
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error proxying the image:', error);
    res.status(500).send(`Error fetching the image: ${error.message}`);
  }
});

// Proxy endpoint for NASA EPIC API data
app.get('/epic-api', async (req, res) => {
  try {
    const { date, apiKey } = req.query;
    
    if (!date || !apiKey) {
      return res.status(400).send('Missing required parameters');
    }
    
    const apiUrl = `https://api.nasa.gov/EPIC/api/natural/date/${date}?api_key=${apiKey}`;
    
    console.log(`Fetching API data for date: ${date}`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`NASA API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying API request:', error);
    res.status(500).send(`Error fetching API data: ${error.message}`);
  }
});

// Basic homepage
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>NASA EPIC Proxy Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>NASA EPIC Proxy Server</h1>
        <p>This server proxies requests to NASA's EPIC API and images to solve CORS issues.</p>
        
        <h2>Endpoints:</h2>
        
        <h3>1. Proxy for EPIC API</h3>
        <code>GET /epic-api?date=YYYY-MM-DD&apiKey=YOUR_API_KEY</code>
        <p>Returns the EPIC API data for the specified date.</p>
        
        <h3>2. Proxy for EPIC Images</h3>
        <code>GET /epic-image?year=YYYY&month=MM&day=DD&imageName=image_name</code>
        <p>Returns the actual image from NASA's servers.</p>
        
        <h3>Example Usage:</h3>
        <p>API Data: <a href="/epic-api?date=2022-01-01&apiKey=DEMO_KEY">/epic-api?date=2022-01-01&apiKey=DEMO_KEY</a></p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`NASA EPIC Proxy Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});