import { fetchWeatherApi } from "openmeteo";

interface GeocodingResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox?: string[];
  class?: string;
  type?: string;
}

interface YearLocation {
  year: number;
  location: GeocodingResult | null;
}

interface WeatherData {
  year: number;
  location: string;
  latitude: number;
  longitude: number;
  temperature_2m_mean: number | string;
  dew_point_2m_mean: number | string;
  relative_humidity_2m_mean: number | string;
  precipitation_sum: number | string;
}

// Global state
let userName: string = '';
let birthYear: number | null = null;
let birthLocation: GeocodingResult | null = null;
let yearLocations: YearLocation[] = [];
let searchDebounceTimer: number | null = null;
let currentEditingRow: number | null = null;

// Google Sheets API endpoint
const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbyXhxlnewbftEuGhSUp5XtnIphvEkzLU5I-0UGfWJqJZWk1GPJfA3I40CFeQaeVt2MO/exec';

// Color palette for location indicators
const COLORS = [
  '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b'
];
const locationColors = new Map<string, string>();

// ===== GEOCODING FUNCTIONS =====

async function searchLocations(query: string): Promise<GeocodingResult[]> {
  if (query.length < 2) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=15&featureType=city`;
    const response = await fetch(url);
    const data = await response.json();

    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
}

function getLocationDisplayName(location: GeocodingResult): string {
  return location.display_name;
}

function getSimpleLocationName(location: GeocodingResult): string {
  // Try to get the most specific location name, starting with city/town/village
  if (location.address?.city) return location.address.city;
  if (location.address?.town) return location.address.town;
  if (location.address?.village) return location.address.village;
  if (location.address?.state) return location.address.state;
  if (location.address?.country) return location.address.country;

  // Fall back to first part of display_name if address info not available
  const firstPart = location.display_name.split(',')[0].trim();
  return firstPart || location.display_name;
}

function getLocationKey(location: GeocodingResult): string {
  const lat = parseFloat(location.lat);
  const lon = parseFloat(location.lon);
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

function getColorForLocation(location: GeocodingResult): string {
  const key = getLocationKey(location);
  if (!locationColors.has(key)) {
    const colorIndex = locationColors.size % COLORS.length;
    locationColors.set(key, COLORS[colorIndex]);
  }
  return locationColors.get(key)!;
}

// ===== WEATHER DATA FUNCTIONS =====

async function fetchWeatherData(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): Promise<any> {
  try {
    const params = {
      latitude,
      longitude,
      start_date: startDate,
      end_date: endDate,
      daily: ["temperature_2m_mean", "dew_point_2m_mean", "relative_humidity_2m_mean", "precipitation_sum"],
    };
    const url = "https://archive-api.open-meteo.com/v1/archive";
    const responses = await fetchWeatherApi(url, params);

    const response = responses[0];
    const daily = response.daily()!;
    const utcOffsetSeconds = response.utcOffsetSeconds();

    const weatherData = {
      daily: {
        time: Array.from(
          { length: (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval() },
          (_, i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000)
        ),
        temperature_2m_mean: daily.variables(0)!.valuesArray(),
        dew_point_2m_mean: daily.variables(1)!.valuesArray(),
        relative_humidity_2m_mean: daily.variables(2)!.valuesArray(),
        precipitation_sum: daily.variables(3)!.valuesArray(),
      },
    };

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

function calculateYearlyAverage(weatherData: any): {
  temperature_2m_mean: number;
  dew_point_2m_mean: number;
  relative_humidity_2m_mean: number;
  precipitation_sum: number;
} {
  let tempSum = 0, dewSum = 0, humiditySum = 0, precipSum = 0;
  let count = 0;

  for (let i = 0; i < weatherData.daily.time.length; i++) {
    tempSum += weatherData.daily.temperature_2m_mean[i] || 0;
    dewSum += weatherData.daily.dew_point_2m_mean[i] || 0;
    humiditySum += weatherData.daily.relative_humidity_2m_mean[i] || 0;
    precipSum += weatherData.daily.precipitation_sum[i] || 0;
    count++;
  }

  return {
    temperature_2m_mean: count > 0 ? tempSum / count : 0,
    dew_point_2m_mean: count > 0 ? dewSum / count : 0,
    relative_humidity_2m_mean: count > 0 ? humiditySum / count : 0,
    precipitation_sum: precipSum,
  };
}

// ===== UI FUNCTIONS =====

function displaySearchResults(
  results: GeocodingResult[],
  container: HTMLElement,
  onSelect: (location: GeocodingResult) => void
) {
  if (results.length === 0) {
    container.innerHTML = '';
    container.classList.add('hidden');
    return;
  }

  container.innerHTML = results.map((location, index) => {
    const displayName = getLocationDisplayName(location);
    return `
      <div class="search-result-item" data-index="${index}">
        ${displayName}
      </div>
    `;
  }).join('');

  container.classList.remove('hidden');

  // Add click handlers
  const items = container.querySelectorAll('.search-result-item');
  items.forEach((item, index) => {
    item.addEventListener('click', () => {
      onSelect(results[index]);
      container.innerHTML = '';
      container.classList.add('hidden');
    });
  });
}

function generateYearsTable() {
  if (!userName || !birthYear || !birthLocation) return;

  const currentYear = 2025; // Don't include 2026
  yearLocations = [];

  // Initialize all years with birth location
  for (let year = birthYear; year <= currentYear; year++) {
    yearLocations.push({ year, location: birthLocation });
  }

  renderTable();

  // Show table section
  const tableSection = document.getElementById('table-section');
  if (tableSection) {
    tableSection.classList.remove('hidden');
  }
}

function renderTable() {
  const tbody = document.getElementById('years-tbody');
  if (!tbody) return;

  tbody.innerHTML = yearLocations.map((yearLoc, index) => {
    const location = yearLoc.location;
    const displayName = location ? getLocationDisplayName(location) : 'No location';
    const color = location ? getColorForLocation(location) : '#ccc';
    const age = yearLoc.year - birthYear!;

    return `
      <tr>
        <td>${yearLoc.year} (${age})</td>
        <td class="location-cell" data-row-index="${index}" style="border-left: 4px solid ${color};">
          <span class="location-name">${displayName}</span>
        </td>
      </tr>
    `;
  }).join('');

  // Add click handlers to location cells
  const locationCells = tbody.querySelectorAll('.location-cell');
  locationCells.forEach((cell) => {
    cell.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const rowIndex = parseInt(target.dataset.rowIndex || '0', 10);
      startInlineEdit(rowIndex, target);
    });
  });
}

function startInlineEdit(rowIndex: number, cell: HTMLElement) {
  if (currentEditingRow !== null) return; // Already editing
  currentEditingRow = rowIndex;

  const currentLocation = yearLocations[rowIndex].location;
  const currentName = currentLocation ? getLocationDisplayName(currentLocation) : '';

  // Replace cell content with search input
  cell.innerHTML = `<input type="text" class="inline-search" value="${currentName}" placeholder="Search for location...">`;

  const input = cell.querySelector('.inline-search') as HTMLInputElement;
  input.focus();
  input.select();

  // Create results container
  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'search-results';
  resultsContainer.style.position = 'absolute';
  resultsContainer.style.zIndex = '1000';
  resultsContainer.style.width = cell.offsetWidth + 'px';
  cell.style.position = 'relative';
  cell.appendChild(resultsContainer);

  // Handle search
  input.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value;

    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Show loading spinner
    if (query.length >= 2) {
      resultsContainer.innerHTML = '<div class="search-loading">Searching...</div>';
      resultsContainer.classList.remove('hidden');
    } else {
      resultsContainer.innerHTML = '';
      resultsContainer.classList.add('hidden');
    }

    searchDebounceTimer = window.setTimeout(async () => {
      const results = await searchLocations(query);
      displaySearchResults(results, resultsContainer, (location) => {
        updateLocationAndDownfill(rowIndex, location);
        currentEditingRow = null;
        renderTable();
      });
    }, 1000);
  });

  // Handle blur (click outside)
  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (currentEditingRow === rowIndex) {
        currentEditingRow = null;
        renderTable();
      }
    }, 200);
  });
}

function updateLocationAndDownfill(startIndex: number, newLocation: GeocodingResult) {
  // Remember the old location at this index
  const oldLocation = yearLocations[startIndex].location;
  const oldLocationKey = oldLocation ? getLocationKey(oldLocation) : null;

  // Set the clicked cell
  yearLocations[startIndex].location = newLocation;

  // Find all cells below with the same old location and change them
  for (let i = startIndex + 1; i < yearLocations.length; i++) {
    const currentLocation = yearLocations[i].location;
    const currentLocationKey = currentLocation ? getLocationKey(currentLocation) : null;

    // If this cell has a different location than the old one, stop
    if (currentLocationKey !== oldLocationKey) {
      break;
    }

    // Otherwise, update this cell to the new location
    yearLocations[i].location = newLocation;
  }
}

async function saveToGoogleSheets(weatherResults: WeatherData[]) {
  const timestamp = new Date().toISOString();
  const jsonBlob = JSON.stringify(weatherResults);

  try {
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      mode: 'no-cors', // Apps Script requires no-cors mode
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userName,
        timestamp: timestamp,
        jsonBlob: jsonBlob,
      }),
    });

    // Note: With no-cors mode, we can't read the response, but the request will succeed
    return true;
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return false;
  }
}

async function generateWeatherData() {
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
  const statusDiv = document.getElementById('status');
  const outputSection = document.getElementById('output-section');
  const successMessage = document.getElementById('success-message');

  if (!submitBtn || !statusDiv || !outputSection || !successMessage) return;

  // Disable button
  submitBtn.disabled = true;
  statusDiv.textContent = 'Gathering weather data...';
  statusDiv.className = 'info';
  statusDiv.classList.remove('hidden');

  const weatherResults: WeatherData[] = [];

  try {
    for (let i = 0; i < yearLocations.length; i++) {
      const yearLoc = yearLocations[i];
      const location = yearLoc.location;

      if (!location) {
        weatherResults.push({
          year: yearLoc.year,
          location: 'N/A',
          latitude: 0,
          longitude: 0,
          temperature_2m_mean: 'N/A',
          dew_point_2m_mean: 'N/A',
          relative_humidity_2m_mean: 'N/A',
          precipitation_sum: 'N/A',
        });
        continue;
      }

      statusDiv.textContent = `Fetching ${yearLoc.year} (${i + 1}/${yearLocations.length})...`;

      const startDate = `${yearLoc.year}-01-01`;
      const endDate = `${yearLoc.year}-12-31`;

      const weatherData = await fetchWeatherData(
        parseFloat(location.lat),
        parseFloat(location.lon),
        startDate,
        endDate
      );

      if (weatherData) {
        const averages = calculateYearlyAverage(weatherData);
        weatherResults.push({
          year: yearLoc.year,
          location: getSimpleLocationName(location),
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon),
          temperature_2m_mean: averages.temperature_2m_mean,
          dew_point_2m_mean: averages.dew_point_2m_mean,
          relative_humidity_2m_mean: averages.relative_humidity_2m_mean,
          precipitation_sum: averages.precipitation_sum,
        });
      } else {
        console.error(`Failed to fetch weather data for ${yearLoc.year} at ${getLocationDisplayName(location)}`);
        weatherResults.push({
          year: yearLoc.year,
          location: getSimpleLocationName(location),
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon),
          temperature_2m_mean: 'N/A',
          dew_point_2m_mean: 'N/A',
          relative_humidity_2m_mean: 'N/A',
          precipitation_sum: 'N/A',
        });
      }
    }

    // Save the data
    statusDiv.textContent = 'Saving your timeline...';
    const saved = await saveToGoogleSheets(weatherResults);

    // Hide status and show success
    statusDiv.classList.add('hidden');

    if (saved) {
      successMessage.textContent = 'Thank you! Your weather timeline has been submitted successfully.';
      outputSection.classList.remove('hidden');
    } else {
      statusDiv.textContent = 'There was a problem submitting your timeline. Please try again.';
      statusDiv.className = 'error';
      statusDiv.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error generating weather data:', error);
    statusDiv.textContent = 'Something went wrong. Please try again.';
    statusDiv.className = 'error';
  } finally {
    submitBtn.disabled = false;
  }
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
  const userNameInput = document.getElementById('user-name') as HTMLInputElement;
  const birthYearInput = document.getElementById('birth-year') as HTMLInputElement;
  const birthLocationInput = document.getElementById('birth-location') as HTMLInputElement;
  const birthLocationResults = document.getElementById('birth-location-results');
  const submitBtn = document.getElementById('submit-btn');

  // User name handler
  if (userNameInput) {
    userNameInput.addEventListener('change', (e) => {
      userName = (e.target as HTMLInputElement).value.trim();
      if (userName && birthYear && birthLocation) {
        generateYearsTable();
      }
    });
  }

  // Birth year handler
  if (birthYearInput) {
    birthYearInput.addEventListener('change', (e) => {
      const year = parseInt((e.target as HTMLInputElement).value, 10);
      if (year >= 1900 && year <= 2025) {
        birthYear = year;
        if (userName && birthLocation) {
          generateYearsTable();
        }
      }
    });
  }

  // Birth location search handler
  if (birthLocationInput && birthLocationResults) {
    birthLocationInput.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;

      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }

      // Show loading spinner
      if (query.length >= 2) {
        birthLocationResults.innerHTML = '<div class="search-loading">Searching...</div>';
        birthLocationResults.classList.remove('hidden');
      } else {
        birthLocationResults.innerHTML = '';
        birthLocationResults.classList.add('hidden');
      }

      searchDebounceTimer = window.setTimeout(async () => {
        const results = await searchLocations(query);
        displaySearchResults(results, birthLocationResults, (location) => {
          birthLocation = location;
          birthLocationInput.value = getLocationDisplayName(location);
          if (userName && birthYear) {
            generateYearsTable();
          }
        });
      }, 1000);
    });
  }

  // Submit button handler
  if (submitBtn) {
    submitBtn.addEventListener('click', generateWeatherData);
  }
});
