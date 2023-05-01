let parsedCSVData = null;

document.addEventListener('DOMContentLoaded', () => {
  // Populate the state dropdown
  populateStateDropdown();
});

const apiKey = 'ce3a74e27e9f452f88334b0c89636a45';

async function fetchData() {
  if (parsedCSVData) {
    return parsedCSVData.csv;
  }
  try {
    const response = await fetch(`https://api.covidactnow.org/v2/states.timeseries.csv?apiKey=${apiKey}`);
    const csvData = await response.text();
    parsedCSVData = {
      csv: csvData,
      parsed: parseCSVData(csvData)
    };
    return parsedCSVData.csv;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

function parseCSVData(csvData) {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',');

  const data = lines.slice(1).map(line => {
    const rowData = {};
    const values = line.split(',');

    headers.forEach((header, index) => {
      let value = values[index];

      if (!isNaN(value) && value !== '') {
        value = parseFloat(value);
      } else if (value === '') {
        value = null;
      }

      rowData[header] = value;
    });

    return rowData;
  });

  return data;
}

function createLineChart(canvasId, datasets, labels, state, chartTitle, yAxisTitle) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');

  if (canvas.chartInstance) {
    canvas.chartInstance.destroy();
  }

  canvas.chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: chartTitle + ' for ' + state,
          font: {
            size: 18,
            weight: 'bold',
            family: "'Impact', sans-serif"
          }
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date',
            font: {
              size: 14,
              weight: 'bold',
              family: "'Impact', sans-serif"
            }
          },
          ticks: {
            font: {
              size: 12,
              family: "'Impact', sans-serif"
            }
          }
        },
        y: {
          title: {
            display: true,
            text: yAxisTitle,
            font: {
              size: 14,
              weight: 'bold',
              family: "'Impact', sans-serif"
            }
          },
          ticks: {
            font: {
              size: 12,
              family: "'Impact', sans-serif"
            }
          },
          beginAtZero: true
        },
      }
    },
  });
}


const stateNameMap = {
  'AL': 'Alabama',
  'AK': 'Alaska',
  'AZ': 'Arizona',
  'AR': 'Arkansas',
  'CA': 'California',
  'CO': 'Colorado',
  'CT': 'Connecticut',
  'DE': 'Delaware',
  'DC': 'District Of Columbia',
  'FL': 'Florida',
  'GA': 'Georgia',
  'HI': 'Hawaii',
  'ID': 'Idaho',
  'IL': 'Illinois',
  'IN': 'Indiana',
  'IA': 'Iowa',
  'KS': 'Kansas',
  'KY': 'Kentucky',
  'LA': 'Louisiana',
  'ME': 'Maine',
  'MD': 'Maryland',
  'MA': 'Massachusetts',
  'MI': 'Michigan',
  'MN': 'Minnesota',
  'MS': 'Mississippi',
  'MO': 'Missouri',
  'MP': 'Northern Mariana Islands',
  'MT': 'Montana',
  'NE': 'Nebraska',
  'NV': 'Nevada',
  'NH': 'New Hampshire',
  'NJ': 'New Jersey',
  'NM': 'New Mexico',
  'NY': 'New York',
  'NC': 'North Carolina',
  'ND': 'North Dakota',
  'OH': 'Ohio',
  'OK': 'Oklahoma',
  'OR': 'Oregon',
  'PA': 'Pennsylvania',
  'PR': 'Puerto Rico',
  'RI': 'Rhode Island',
  'SC': 'South Carolina',
  'SD': 'South Dakota',
  'TN': 'Tennessee',
  'TX': 'Texas',
  'UT': 'Utah',
  'VT': 'Vermont',
  'VA': 'Virginia',
  'WA': 'Washington',
  'WV': 'West Virginia',
  'WI': 'Wisconsin',
  'WY': 'Wyoming'
};

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}


async function populateStateDropdown() {
  const csvData = await fetchData();
  const parsedData = parseCSVData(csvData);
  const stateSelectOptions = document.getElementById('stateSelectOptions');

  const uniqueStates = [...new Set(parsedData.map(row => row.state))];
  uniqueStates.forEach(state => {
    const option = document.createElement('div');
    option.setAttribute('data-value', state);
    option.textContent = state;
    if (state === 'CA') {
      option.classList.add('selected-option');
    }
    stateSelectOptions.appendChild(option);
  });

  // Set up event listeners for the custom select element
  const stateSelectContainer = document.getElementById('stateSelectContainer');
  const stateSelected = document.getElementById('stateSelected');

  stateSelected.addEventListener('click', () => {
    stateSelectContainer.classList.toggle('open');
  });

  stateSelectOptions.addEventListener('click', (e) => {
    if (e.target.tagName === 'DIV') {
      stateSelected.querySelector('span').textContent = e.target.textContent;
      stateSelected.setAttribute('data-value', e.target.getAttribute('data-value'));
      stateSelectContainer.classList.remove('open');
    }
  });
}




document.getElementById('stateDateForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const state = document.getElementById('stateSelected').getAttribute('data-value');

  if (state) {
    generateGraphs(state);
  }
});

function interpolateData(dataArray, dates) {
  const result = dataArray.slice();
  for (let i = 1; i < result.length - 1; i++) {
    if (result[i] === null || (result[i] === 0 && result[i - 1] !== 0 && result[i + 1] !== 0)) {
      let j = i + 1;
      while (j < result.length - 1 && (result[j] === null || (result[j] === 0 && result[j - 1] !== 0 && result[j + 1] !== 0))) {
        j++;
      }
      if ((result[i - 1] !== null && result[i - 1] !== 0) && (result[j] !== null && result[j] !== 0)) {
        const slope = (result[j] - result[i - 1]) / (j - i + 1);
        for (let k = i; k < j; k++) {
          if (dates[k] < '2021-01-01') {
            result[k] = 0;
          } else {
            result[k] = result[i - 1] + slope * (k - i + 1);
          }
        }
      } else if (result[j] === 0 && result[i - 1] !== 0) {
        for (let k = i; k < j; k++) {
          result[k] = result[i - 1];
        }
      }
      i = j - 1;
    }
  }
  // Remove zeros from the result after 2021
  for (let i = 0; i < result.length; i++) {
    if (dates[i] >= '2021-01-01' && result[i] === 0) {
      result[i] = null;
    }
  }
  return result;
}






function filterData(dataArray) {
  let foundNonZero = false;
  return dataArray.filter(day => {
    if (day !== null && day !== 0) {
      foundNonZero = true;
    }
    return foundNonZero || day !== 0;
  });
}

async function generateGraphs(state) {
  const csvData = await fetchData();
  const allStatesData = parseCSVData(csvData);
  const stateData = allStatesData.filter(row => row.state === state);
  const dates = stateData.map(day => day.date);
  const cases = interpolateData(stateData.map(day => day['actuals.cases'] || 0), dates);
  const deaths = interpolateData(stateData.map(day => day['actuals.deaths'] || 0), dates);
  const filteredData = allStatesData.filter(row => row.state === state);
  const vaccinesDistributedData = filteredData.map(row => row['actuals.vaccinesDistributed'] || 0);

  // Interpolate the actuals.vaccinesDistributed data
  const interpolatedVaccinesDistributedData = interpolateData(vaccinesDistributedData, dates);

  const graphs = document.getElementById('allGraphs');
  graphs.style.display = 'block';

  // Update the heading with the selected state
  document.getElementById('title').textContent = `COVID-19 Data for ${stateNameMap[state]}`;


  createLineChart('graph1', [{
    label: 'Cumulative Cases',
    data: cases,
    borderColor: 'rgb(75, 192, 192)',
    tension: 0.1,
  }], dates, stateNameMap[state], 'COVID-19 Cumulative Cases', 'Cases');

  createLineChart('graph2', [{
    label: 'Cumulative Deaths',
    data: deaths,
    borderColor: 'rgb(255, 99, 132)',
    tension: 0.1,
  }], dates, stateNameMap[state], 'COVID-19 Cumulative Deaths', 'Deaths');

  createLineChart('graph3', [{
    label: 'Cumulative Vaccinations',
    data: interpolatedVaccinesDistributedData,
    borderColor: 'rgb(153, 102, 255)',
    tension: 0.1
  }], dates, stateNameMap[state], 'COVID-19 Cumulative Vaccinations', 'Vaccinations');
}

const scrollToTopButton = document.getElementById("scrollToTop");

// Show or hide the scroll to top button depending on the scroll position
window.addEventListener("scroll", () => {
  if (window.pageYOffset > 100) {
    scrollToTopButton.style.display = "block";
  } else {
    scrollToTopButton.style.display = "none";
  }
});

// Scroll back to the top when the button is clicked
scrollToTopButton.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.querySelector(".nav-mobile").addEventListener("click", function () {
  const navLinks = document.querySelector(".nav-links");
  if (navLinks.style.display === "none" || navLinks.style.display === "") {
    navLinks.style.display = "block";
  } else {
    navLinks.style.display = "none";
  }
});


