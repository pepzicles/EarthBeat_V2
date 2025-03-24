// Earth Pulse Visualization using NASA EPIC API
// Replace YOUR_NASA_API_KEY with your actual NASA API key

// Global variables
let slider;
let earthImage = null;
let earthImages = [];  // Array to hold generated Earth images
let epicData = {};
let climateData = {  // New separate object for climate data
  temperature: 14,
  co2Level: 400,
  tempAnomaly: 0,
  tempTime: '',
  co2Time: '',
  year: 2016
};
let pulseTimer = 0;
let maxPulse = 20;
let appStartYear = 2016; // Starting year for our visualization

// Add baseline values for 2016
const BASELINE_TEMP = 14.5;  // Approximate global temperature for 2016
const BASELINE_CO2 = 404.21; // CO2 level for 2016
const BASE_PULSE_SPEED = 0.05; // Base speed for 2016

// Create default Earth images
function preload() {
  // Instead of loading from NASA's servers directly, we'll create basic Earth images
  // to avoid CORS issues for the visualization
  
  // Create a basic Earth image programmatically
  function createEarthImage(baseColor, landColor, size) {
    // Create a temporary canvas with p5.js
    let tempCanvas = createGraphics(size, size);
    
    // Draw Earth background (ocean)
    tempCanvas.background(baseColor);
    
    // Draw some basic landmass shapes
    tempCanvas.fill(landColor);
    tempCanvas.noStroke();
    
    // North America
    tempCanvas.beginShape();
    tempCanvas.vertex(size*0.2, size*0.2);
    tempCanvas.vertex(size*0.4, size*0.2);
    tempCanvas.vertex(size*0.45, size*0.4);
    tempCanvas.vertex(size*0.3, size*0.5);
    tempCanvas.vertex(size*0.2, size*0.4);
    tempCanvas.endShape(CLOSE);
    
    // South America
    tempCanvas.beginShape();
    tempCanvas.vertex(size*0.35, size*0.5);
    tempCanvas.vertex(size*0.4, size*0.5);
    tempCanvas.vertex(size*0.38, size*0.7);
    tempCanvas.vertex(size*0.3, size*0.7);
    tempCanvas.endShape(CLOSE);
    
    // Europe/Africa
    tempCanvas.beginShape();
    tempCanvas.vertex(size*0.5, size*0.25);
    tempCanvas.vertex(size*0.6, size*0.2);
    tempCanvas.vertex(size*0.65, size*0.4);
    tempCanvas.vertex(size*0.6, size*0.6);
    tempCanvas.vertex(size*0.5, size*0.55);
    tempCanvas.vertex(size*0.45, size*0.4);
    tempCanvas.endShape(CLOSE);
    
    // Asia/Australia
    tempCanvas.beginShape();
    tempCanvas.vertex(size*0.6, size*0.3);
    tempCanvas.vertex(size*0.8, size*0.25);
    tempCanvas.vertex(size*0.85, size*0.4);
    tempCanvas.vertex(size*0.75, size*0.5);
    tempCanvas.vertex(size*0.65, size*0.45);
    tempCanvas.endShape(CLOSE);
    
    // Australia
    // tempCanvas.ellipse(size*0.8, size*0.65, size*0.15, size*0.1);
    
    // Create image from the canvas
    let img = tempCanvas.get();
    tempCanvas.remove();
    return img;
  }
  
  // Create different variations of Earth images
  const size = 540; // Size of our images
  
  // Base ocean and land colors for different variations
  const variations = [
    { ocean: color(0, 105, 148), land: color(34, 139, 34) },    // Standard blue/green
    { ocean: color(0, 90, 130),  land: color(150, 113, 23) },   // Beige land
    { ocean: color(25, 25, 112), land: color(46, 139, 87) },    // Dark blue/sea green
    { ocean: color(70, 130, 180), land: color(222, 184, 135) }, // Light blue/tan
    { ocean: color(0, 0, 128),   land: color(107, 142, 35) },   // Navy/olive
    { ocean: color(30, 144, 255), land: color(85, 107, 47) },   // Deep blue/dark olive
    { ocean: color(65, 105, 225), land: color(143, 188, 143) }, // Royal blue/light green
    { ocean: color(0, 119, 190), land: color(160, 82, 45) },    // Azure/sienna
    { ocean: color(100, 149, 237), land: color(189, 183, 107) }, // Cornflower/khaki
    { ocean: color(0, 128, 128), land: color(154, 205, 50) }    // Teal/yellow green
  ];
  
  // Generate Earth images for each variation
  for (let i = 0; i < 10; i++) {
    earthImages[i] = createEarthImage(
      variations[i].ocean, 
      variations[i].land, 
      size
    );
  }
}

function setup() {
  // Create canvas and append it to the container div
  let canvas = createCanvas(600, 600);
  canvas.parent('container');

  // Create slider to simulate years
  slider = createSlider(0, 9, 9, 1);  // Min: 0, Max: 9, Default: 5, Step: 1
  slider.position(10, height - 50);
  slider.style('width', '480px');  // Made slightly smaller to accommodate new button
  slider.parent('container');

  fetchEpicData(slider.value());

  // Initialize climate data for the starting year
  fetchClimateDataForYear(appStartYear + slider.value()).then(data => {
    if (data) {
      Object.assign(climateData, data);
    }
  });
  
  // Modify slider event to update climate data
  slider.input(async () => {
    const sliderValue = slider.value();
    const selectedYear = appStartYear + sliderValue;
    console.log(`[Slider] Moved to year ${selectedYear}`);
    
    // Update climate data for the selected year
    const data = await fetchClimateDataForYear(selectedYear);
    if (data) {
      Object.assign(climateData, data);
      climateData.year = selectedYear;
    }
    
    // Fetch EPIC image separately
    await fetchEpicData(sliderValue);
  });
  
  // Label to explain the slider's functionality
  let sliderLabel = createDiv('Slide to view Earth images from 2016-2025 via NASA EPIC API');
  sliderLabel.position(10, height - 80);
  sliderLabel.style('color', 'white');
  sliderLabel.style('font-size', '14px');
  sliderLabel.parent('container');
  
  // Add API attribution
  let attribution = createDiv('Data from NASA EPIC API and global-warming.org');
  attribution.position(10, height - 30);
  attribution.style('color', 'white');
  attribution.style('font-size', '12px');
  attribution.parent('container');
  
  // Create Test API button
  let testButton = createButton('Test NASA API');
  testButton.position(360, height - 15);
  testButton.mousePressed(testNasaApi);
  testButton.style('background-color', '#0B3D91'); // NASA blue
  testButton.style('color', 'white');
  testButton.style('border', 'none');
  testButton.style('padding', '8px 16px');
  testButton.style('border-radius', '4px');
  testButton.style('cursor', 'pointer');
  testButton.parent('container');
  
  // Add "Show Current Images" button
  let showImagesButton = createButton('Show Current Images');
  showImagesButton.position(500, height - 50);
  showImagesButton.mousePressed(() => {
    // Get the year from the slider
    const year = appStartYear + slider.value();
    const month = "03"; // March 
    const day = "21";   // 7th
    const currentDate = `${year}-${month}-${day}`;
    
    // Check if date is in the future
    const today = new Date();
    const selectedDate = new Date(currentDate);
    
    if (selectedDate > today) {
      // Use a safer date for future dates
      showEpicImageGallery("2023-01-01");
    } else {
      showEpicImageGallery(currentDate);
    }
  });
  showImagesButton.style('background-color', '#4CAF50'); // Green
  showImagesButton.style('color', 'white');
  showImagesButton.style('border', 'none');
  showImagesButton.style('padding', '8px 16px');
  showImagesButton.style('border-radius', '4px');
  showImagesButton.style('cursor', 'pointer');
  showImagesButton.parent('container');
}

function draw() {
  background(0);
  
  // Update climate data every 60 frames (about every second)
  if (frameCount % 60 === 0) {
    console.log('[Draw] Requesting climate update, frame:', frameCount);
    const selectedYear = appStartYear + slider.value();
    fetchClimateDataForYear(selectedYear).then(data => {
      if (data) {
        const oldTemp = climateData.temperature;
        const oldCO2 = climateData.co2Level;
        
        Object.assign(climateData, data);
        climateData.year = selectedYear;
        
        console.log('[Draw] Updated climate data:', {
          temperatureChange: `${oldTemp} -> ${data.temperature}`,
          co2Change: `${oldCO2} -> ${data.co2Level}`,
          year: selectedYear
        });
      }
    });
  }

  // Calculate pulse effect based on temperature and CO2 levels
  const tempFactor = map(climateData.temperature, BASELINE_TEMP, BASELINE_TEMP + 2, 1, 2);
  const co2Factor = map(climateData.co2Level, BASELINE_CO2, BASELINE_CO2 + 50, 1, 2);
  
  // Combined factor affects both pulse size and speed
  const combinedFactor = (tempFactor + co2Factor) / 2;
  
  // Calculate pulse size and Earth size
  let pulseSize = sin(pulseTimer) * maxPulse;
  let earthSize = 300 + pulseSize;
  
  // Create a glow effect for the Earth with color based on temperature
  const glowHue = map(climateData.temperature, BASELINE_TEMP, BASELINE_TEMP + 2, 180, 0); // Blue to Red
  const glowColor = color(
    map(glowHue, 0, 180, 255, 100), // Red component
    map(glowHue, 0, 180, 0, 150),   // Green component
    map(glowHue, 0, 180, 0, 255),   // Blue component
    50                               // Alpha
  );
  
  // Display Earth image with glow
  if (earthImage) {
    // Draw the glow effect first
    drawEarthGlow(width/2, height/2, earthSize + 20, glowColor);
    
    // Then draw the Earth image
    push();
    imageMode(CENTER);
    translate(width/2, height/2);
    rotate(pulseTimer * 0.02);  // Keep original rotation speed
    image(earthImage, 0, 0, earthSize*1.3, earthSize*1.3);
    pop();
    
    // Display EPIC metadata if available
    if (epicData.date) {
      fill(255);
      textSize(14);
      textAlign(LEFT, TOP);
      text(`Image Date: ${epicData.formattedDate || epicData.date.substring(0, 10)}`, 10, 100);
      
      if (epicData.centroid_coordinates) {
        text(`Centroid: ${epicData.centroid_coordinates.lat.toFixed(2)}°, ${epicData.centroid_coordinates.lon.toFixed(2)}°`, 10, 120);
      }
    }
  } else {
    // Draw the glow effect first
    drawEarthGlow(width/2, height/2, earthSize + 20, glowColor);
    
    // Draw placeholder circle if image isn't loaded
    fill(28, 60, 100);
    noStroke();
    ellipse(width/2, height/2, earthSize, earthSize);
    
    fill(255);
    textSize(16);
    textAlign(CENTER);
    text("Loading Earth Image...", width/2, height/2);
  }

  // Create a semi-transparent overlay for data visualization
  fill(0, 0, 0, 100);
  noStroke();
  rect(10, 10, width - 20, 90, 10);
  
  // Display climate data with source timestamps
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  
  text(`Temperature: ${climateData.temperature.toFixed(2)}°C`, 20, 20);
  if (climateData.tempTime) {
    textSize(12);
    text(`(Data from year ${climateData.tempTime})`, 20, 40);
  }
  
  textSize(16);
  text(`CO₂ Level: ${climateData.co2Level.toFixed(2)} ppm`, 20, 60);
  if (climateData.co2Time) {
    textSize(12);
    text(`(Data from ${climateData.co2Time})`, 20, 80);
  }
  
  // Add visual indicators for temperature and CO2
  const tempWidth = map(climateData.temperature, 13, 16, 100, 200);
  fill(map(climateData.temperature, 13, 16, 0, 255), 0, map(climateData.temperature, 13, 16, 255, 0));
  rect(180, 22, tempWidth, 12, 5);
  
  const co2Width = map(climateData.co2Level, 380, 420, 100, 200);
  fill(map(climateData.co2Level, 380, 420, 0, 255), map(climateData.co2Level, 380, 420, 255, 0), 0);
  rect(180, 62, co2Width, 12, 5);
  
  // Show the year based on slider value with larger text
  const year = appStartYear + slider.value();
  fill(255);
  textSize(24);
  textAlign(CENTER, TOP);
  text(`Earth in ${year}`, width/2, 85);
  
  // Display heartbeat in top right corner
  const pulseSpeed = BASE_PULSE_SPEED * combinedFactor;
  fill(180);
  textSize(14);
  textAlign(RIGHT, TOP);
  text(`Heartbeat: ${pulseSpeed.toFixed(2)}`, width - 20, 20);
  
  // Update pulse timer with dynamic speed
  pulseTimer += pulseSpeed;
}

// Modify the drawEarthGlow function to create a more dynamic glow effect
function drawEarthGlow(x, y, size, glowColor) {
  push();
  noStroke();
  // Draw multiple expanding circles with decreasing opacity
  for (let i = 0; i < 8; i++) {
    const glowSize = size + i * 3;
    const opacity = map(i, 0, 8, 50, 0);
    fill(red(glowColor), green(glowColor), blue(glowColor), opacity);
    ellipse(x, y, glowSize, glowSize);
  }
  pop();
}

// Function to display the NASA EPIC image gallery
function showEpicImageGallery(date) {
  // Create or update gallery display
  let galleryDiv = select('#epic-gallery');
  if (!galleryDiv) {
    galleryDiv = createDiv('');
    galleryDiv.id('epic-gallery');
    galleryDiv.position(50, 150);
    galleryDiv.style('background-color', 'rgba(0, 0, 0, 0.8)');
    galleryDiv.style('padding', '15px');
    galleryDiv.style('border-radius', '10px');
    galleryDiv.style('width', '500px');
    galleryDiv.style('max-height', '300px');
    galleryDiv.style('overflow-y', 'auto');
    galleryDiv.style('z-index', '10');
    galleryDiv.parent('container');
  }
  
  // Clear the gallery
  galleryDiv.html('<h3 style="color: white; text-align: center;">NASA EPIC Images</h3><div id="close-gallery" style="position: absolute; top: 10px; right: 15px; color: white; cursor: pointer; font-size: 20px;">×</div><div id="gallery-content" style="display: flex; flex-wrap: wrap; justify-content: center;"></div>');
  
  // Add close button functionality
  let closeButton = select('#close-gallery');
  closeButton.mousePressed(() => {
    galleryDiv.remove();
  });
  
  let galleryContent = select('#gallery-content');
  
  // Show loading indicator
  galleryContent.html('<p style="color: white; text-align: center;">Loading NASA EPIC images...</p>');
  
  // Use the proxy to get the API data
  const apiKey = "XVbWVugQF44fR70E1zijo79TcsrNJEP61Sx3EzWB";
  const url = `http://localhost:3000/epic-api?date=${date}&apiKey=${apiKey}`;
  
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data && data.length > 0) {
        // Create links to each image
        let imagesHtml = `<p style="color: white; width: 100%; text-align: center;">${data.length} images available for ${date}</p>`;
        
        data.forEach((image, index) => {
          const dateStr = image.date.substring(0, 10);
          const dateParts = dateStr.split('-');
          const year = dateParts[0];
          const month = dateParts[1];
          const day = dateParts[2];
          
          // Use the proxy URL for the image
          const proxyImageUrl = `http://localhost:3000/epic-image?year=${year}&month=${month}&day=${day}&imageName=${image.image}`;
          
          // Add the image to the gallery
          // You can now actually display the images directly
          imagesHtml += `<div style="margin: 10px; text-align: center;">
                           <img src="${proxyImageUrl}" alt="EPIC image ${index + 1}" 
                                style="width: 150px; height: 150px; object-fit: cover; border: 2px solid #333;">
                           <div style="margin-top: 5px;">
                             Image #${index + 1}<br>
                             <small>Centroid: ${image.centroid_coordinates.lat.toFixed(2)}°, 
                                     ${image.centroid_coordinates.lon.toFixed(2)}°</small>
                           </div>
                         </div>`;
        });
        
        galleryContent.html(imagesHtml);
      } else {
        galleryContent.html('<p style="color: white; text-align: center;">No images found for this date.</p>');
      }
    })
    .catch(error => {
      galleryContent.html(`<p style="color: #F44336; text-align: center;">Error loading images: ${error.message}</p>`);
    });
}

// Add API testing function
function testNasaApi() {
  // Create or update status display
  let statusDiv = select('#api-status');
  if (!statusDiv) {
    statusDiv = createDiv('Testing NASA API connection...');
    statusDiv.id('api-status');
    statusDiv.position(10, 140);
    statusDiv.style('color', 'yellow');
    statusDiv.style('background-color', 'rgba(0, 0, 0, 0.5)');
    statusDiv.style('padding', '10px');
    statusDiv.style('border-radius', '5px');
    statusDiv.style('max-width', '580px');
    statusDiv.parent('container');
  } else {
    statusDiv.html('Testing NASA API connection...');
    statusDiv.style('color', 'yellow');
  }
  
  // Get a random date from the past few years that's likely to have EPIC data
  const randomYear = 2019 + floor(random(4)); // Random year between 2019-2022
  const randomMonth = floor(random(1, 13)).toString().padStart(2, '0');
  const randomDay = floor(random(1, 28)).toString().padStart(2, '0');
  const randomDate = `${randomYear}-${randomMonth}-${randomDay}`;
  
  const apiKey = "XVbWVugQF44fR70E1zijo79TcsrNJEP61Sx3EzWB";
  const url = `https://api.nasa.gov/EPIC/api/natural/date/${randomDate}?api_key=${apiKey}`;
  
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`NASA API returned status ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data && data.length > 0) {
        // Success - got data from the API
        statusDiv.html(`✅ API test successful!<br>
                      Connected to NASA EPIC API<br>
                      Retrieved ${data.length} images for ${randomDate}<br>
                      First image: ${data[0].identifier || data[0].image}`);
        statusDiv.style('color', '#4CAF50');
        
        // Display the date in the response to show real data
        const responseDate = data[0].date.substring(0, 10);
        statusDiv.html(statusDiv.html() + `<br>Image date: ${responseDate}`);
        
        // Add a button to view the images
        let viewImagesButton = createButton('View Images');
        viewImagesButton.position(10, 230);
        viewImagesButton.mousePressed(() => {
          viewImagesButton.remove(); // Remove the button after clicking
          showEpicImageGallery(responseDate);
        });
        
        viewImagesButton.style('background-color', '#4CAF50');
        viewImagesButton.style('color', 'white');
        viewImagesButton.style('border', 'none');
        viewImagesButton.style('padding', '8px 16px');
        viewImagesButton.style('border-radius', '4px');
        viewImagesButton.style('cursor', 'pointer');
        viewImagesButton.parent('container');
      } else {
        // Got a response but no data
        statusDiv.html(`⚠️ API connection successful, but no images found for ${randomDate}`);
        statusDiv.style('color', 'orange');
      }
      
      // Set a timer to fade out the message
      setTimeout(() => {
        statusDiv.style('opacity', '0.8');
        setTimeout(() => {
          statusDiv.style('opacity', '0.6');
          setTimeout(() => {
            statusDiv.style('opacity', '0.4');
            setTimeout(() => {
              statusDiv.style('opacity', '0.2');
              setTimeout(() => {
                statusDiv.remove();
              }, 1000);
            }, 1000);
          }, 1000);
        }, 1000);
      }, 5000);
    })
    .catch(error => {
      // Error connecting to the API
      statusDiv.html(`❌ API test failed: ${error.message}`);
      statusDiv.style('color', '#F44336');
    });
}

// New function to fetch climate data for a specific year
async function fetchClimateDataForYear(year) {
  console.log(`[Climate] Fetching climate data for year ${year}...`);
  try {
    // Fetch temperature data
    const tempResponse = await fetch('https://global-warming.org/api/temperature-api');
    const tempData = await tempResponse.json();
    
    // Fetch CO2 data
    const co2Response = await fetch('https://global-warming.org/api/co2-api');
    const co2Data = await co2Response.json();
    
    if (!tempData.result || !co2Data.co2) {
      throw new Error('Invalid data received from climate APIs');
    }
    
    // Find temperature data closest to the selected year
    const targetYearDecimal = year + 0.5; // Middle of the year
    const tempDataPoint = tempData.result.reduce((closest, current) => {
      return Math.abs(parseFloat(current.time) - targetYearDecimal) < 
             Math.abs(parseFloat(closest.time) - targetYearDecimal) ? current : closest;
    });
    
    // Find CO2 data closest to the selected year
    const co2DataPoint = co2Data.co2.reduce((closest, current) => {
      return Math.abs(parseInt(current.year) - year) < 
             Math.abs(parseInt(closest.year) - year) ? current : closest;
    });
    
    const result = {
      temperature: 14 + parseFloat(tempDataPoint.station),
      co2Level: parseFloat(co2DataPoint.cycle),
      tempAnomaly: parseFloat(tempDataPoint.station),
      tempTime: tempDataPoint.time,
      co2Time: `${co2DataPoint.year}-${co2DataPoint.month}-${co2DataPoint.day}`
    };
    
    console.log(`[Climate] Found data for year ${year}:`, result);
    return result;
  } catch (error) {
    console.error(`[Climate] Error fetching data for year ${year}:`, error);
    return null;
  }
}

// Modify fetchEpicData to only handle image data
async function fetchEpicData(sliderValue) {
  console.log('[EPIC] Fetching image data for slider value:', sliderValue);
  const apiKey = "XVbWVugQF44fR70E1zijo79TcsrNJEP61Sx3EzWB";
  const epicDate = getEpicDateFromSlider(sliderValue);
  
  try {
    const url = `http://localhost:3000/epic-api?date=${epicDate}&apiKey=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      epicData = data[0];
      
      // Extract date parts for image URL construction
      const dateStr = epicData.date.substring(0, 10);
      const dateParts = dateStr.split('-');
      const year = dateParts[0];
      const month = dateParts[1];
      const day = dateParts[2];
      
      // Load the image using the proxy
      const proxyImageUrl = `http://localhost:3000/epic-image?year=${year}&month=${month}&day=${day}&imageName=${epicData.image}`;
      
      loadImage(proxyImageUrl, img => {
        earthImage = img;
      }, (err) => {
        console.error("Failed to load Earth image", err);
        const yearIndex = int(sliderValue) % earthImages.length;
        earthImage = earthImages[yearIndex];
      });
      
      epicData.formattedDate = dateStr;
    } else {
      console.log('[EPIC] No image data available, using fallback');
      generateFallbackData(sliderValue);
    }
  } catch (error) {
    console.error('[EPIC] Error:', error);
    generateFallbackData(sliderValue);
  }
}

// Modify generateFallbackData to only handle EPIC image data
function generateFallbackData(sliderValue) {
  const selectedYear = appStartYear + sliderValue;
  
  epicData = {
    date: `${selectedYear}-03-21T00:00:00.000Z`,
    formattedDate: `${selectedYear}-03-21`,
    image: "fallback",
    centroid_coordinates: { lat: 0, lon: 0 }
  };
  
  // Use one of our generated Earth images
  const yearIndex = int(sliderValue) % earthImages.length;
  earthImage = earthImages[yearIndex];
}

function getEpicDateFromSlider(sliderValue) {
  // EPIC data is available from 2016 to present, but with some delay
  // Map slider 0-9 to years 2016-2025
  const baseYear = appStartYear; // Use appStartYear (2016) instead of hardcoded 2015
  const yearsToAdd = int(sliderValue);
  
  // Create a date object for the selected year
  const date = new Date();
  date.setFullYear(baseYear + yearsToAdd);
  
  // Set month and day to March 7 for consistency
  date.setMonth(date.getMonth());
  date.setDate(date.getDate()-1);  
  
  // If the date is in the future, use a safe past date
  const currentDate = new Date();
  
  if (date > currentDate) {
    // Use January 1, 2023 as a safe date that should have EPIC data
    return "2023-01-01";
  }
  
  // Format as YYYY-MM-DD
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
