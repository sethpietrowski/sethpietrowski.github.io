import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Users, GraduationCap, Vote, Calendar, Palette, RefreshCw, AlertTriangle } from 'lucide-react';
import Banner from '../components/Banner/banner.jsx';

//US state positions (approx) 
const US_STATE_POSITIONS = {
    'AK': { row: 10, col: 0 }, 
    'HI': { row: 10, col: 1 },
    'WA': { row: 1, col: 1 },
    'OR': { row: 2, col: 1 },
    'CA': { row: 3, col: 1 },
    'NV': { row: 3, col: 2 },
    'ID': { row: 2, col: 2 },
    'MT': { row: 1, col: 3 },
    'WY': { row: 2, col: 3 },
    'UT': { row: 3, col: 3 },
    'CO': { row: 3, col: 4 },
    'AZ': { row: 4, col: 2 },
    'NM': { row: 4, col: 3 },
    'ND': { row: 1, col: 4 },
    'SD': { row: 2, col: 4 },
    'NE': { row: 3, col: 5 },
    'KS': { row: 4, col: 5 },
    'OK': { row: 5, col: 5 },
    'TX': { row: 6, col: 4 },
    'MN': { row: 1, col: 5 },
    'IA': { row: 2, col: 5 },
    'MO': { row: 3, col: 6 },
    'AR': { row: 4, col: 6 },
    'LA': { row: 5, col: 6 },
    'WI': { row: 1, col: 6 },
    'IL': { row: 2, col: 6 },
    'MS': { row: 5, col: 7 },
    'AL': { row: 5, col: 8 },
    'TN': { row: 4, col: 7 },
    'KY': { row: 3, col: 7 },
    'IN': { row: 2, col: 7 },
    'MI': { row: 1, col: 7 },
    'OH': { row: 2, col: 8 },
    'WV': { row: 3, col: 8 },
    'VA': { row: 4, col: 9 },
    'NC': { row: 5, col: 9 },
    'SC': { row: 6, col: 9 },
    'GA': { row: 6, col: 8 },
    'FL': { row: 7, col: 9 },
    'PA': { row: 2, col: 9 },
    'NY': { row: 1, col: 9 },
    'VT': { row: 1, col: 10 },
    'NH': { row: 1, col: 11 },
    'ME': { row: 0, col: 11 },
    'MA': { row: 2, col: 10 },
    'RI': { row: 2, col: 11 },
    'CT': { row: 3, col: 10 },
    'NJ': { row: 3, col: 9 },
    'DE': { row: 4, col: 10 },
    'MD': { row: 4, col: 8 },
    'DC': { row: 4, col: 8 } // Same as MD
};

//Census data is pulled from static JSON file at build time (API Key stored outside of repo for privacy)
const ACS_YEAR = '2022';
const LOCAL_DATA_URL = `/data/census-${ACS_YEAR}.json`; // produced at build time

// ACS variable codes for demographic data
const ACS_VARIABLES = {
    population: 'B01003_001E', // Total population
    age: {
        'Total': 'B01001_001E',
        '18-34': ['B01001_007E', 'B01001_008E', 'B01001_009E', 'B01001_010E', 'B01001_011E', 'B01001_012E', 'B01001_031E', 'B01001_032E', 'B01001_033E', 'B01001_034E', 'B01001_035E', 'B01001_036E'],
        '35-64': ['B01001_013E', 'B01001_014E', 'B01001_015E', 'B01001_016E', 'B01001_017E', 'B01001_018E', 'B01001_019E', 'B01001_037E', 'B01001_038E', 'B01001_039E', 'B01001_040E', 'B01001_041E', 'B01001_042E', 'B01001_043E'],
        '65+': ['B01001_020E', 'B01001_021E', 'B01001_022E', 'B01001_023E', 'B01001_024E', 'B01001_025E', 'B01001_044E', 'B01001_045E', 'B01001_046E', 'B01001_047E', 'B01001_048E', 'B01001_049E']
    },
    race: {
        'Total': 'B02001_001E',
        'White': 'B02001_002E',
        'Black': 'B02001_003E',
        'Asian': 'B02001_005E',
        'Hispanic': 'B03003_003E'
    },
    education: {
        'Total': 'B15003_001E',
        'High School': ['B15003_017E', 'B15003_018E'],
        'Some College': ['B15003_019E', 'B15003_020E'],
        "Bachelor's": 'B15003_022E',
        'Graduate': ['B15003_023E', 'B15003_024E', 'B15003_025E']
    },
    income: {
        'Total': 'B19001_001E',
        '<$35k': ['B19001_002E', 'B19001_003E', 'B19001_004E', 'B19001_005E', 'B19001_006E', 'B19001_007E'],
        '$35k-$75k': ['B19001_008E', 'B19001_009E', 'B19001_010E', 'B19001_011E', 'B19001_012E'],
        '$75k+': ['B19001_013E', 'B19001_014E', 'B19001_015E', 'B19001_016E', 'B19001_017E']
    }
};

const METRICS = {
    age: { label: 'Age Groups', icon: Calendar, color: 'blue' },
    race: { label: 'Race/Ethnicity', icon: Users, color: 'green' },
    education: { label: 'Education', icon: GraduationCap, color: 'red' },
    income: { label: 'Income', icon: MapPin, color: 'yellow' }
};

//Mock data fallback (no API KEY)
const generateMockStateData = () => {
    const states = [];
    Object.keys(US_STATE_POSITIONS).forEach(stateCode => {
        if (stateCode !== 'DC') {
            states.push({
                state: stateCode,
                population: Math.floor(Math.random() * 10000000) + 100000,
                demographics: {
                    age: {
                        'Total': 100,
                        '18-34': Math.random() * 35 + 15,
                        '35-64': Math.random() * 45 + 25,
                        '65+': Math.random() * 25 + 10,
                    },
                    race: {
                        'Total': 100,
                        'White': Math.random() * 80 + 10,
                        'Black': Math.random() * 40 + 5,
                        'Asian': Math.random() * 20 + 2,
                        'Hispanic': Math.random() * 30 + 5,
                    },
                    education: {
                        'Total': 100,
                        'High School': Math.random() * 40 + 20,
                        'Some College': Math.random() * 30 + 15,
                        "Bachelor's": Math.random() * 25 + 10,
                        'Graduate': Math.random() * 15 + 5,
                    },
                    income: {
                        'Total': 100,
                        '<$35k': Math.random() * 40 + 15,
                        '$35k-$75k': Math.random() * 40 + 20,
                        '$75k+': Math.random() * 30 + 15,
                    }
                }
            });
        }
    });
    return states;
};

const getColorIntensity = (value, max) => {
    if (!value || !max) return 0;
    return Math.min(value, max);
};

const getMetricColor = (value, maxValue, baseColor) => {
    const intensity = getColorIntensity(value, maxValue);
    switch(baseColor) {
        case 'blue':
            return `rgb(${255 - Math.floor(intensity * 200)}, ${255 - Math.floor(intensity * 100)}, 255)`;
        case 'green':
            return `rgb(${255 - Math.floor(intensity * 200)}, 255, ${255 - Math.floor(intensity * 100)})`;
        case 'purple':
            return `rgb(${200 + Math.floor(intensity * 55)}, ${255 - Math.floor(intensity * 200)}, 255)`;
        case 'yellow':
            return `rgb(255, 255, ${255 - Math.floor(intensity * 200)})`;
        default:
            return `rgb(${255 - Math.floor(intensity * 100)}, ${255 - Math.floor(intensity * 100)}, ${255 - Math.floor(intensity * 100)})`;
    }
};

//Census API functions
const buildVariableString = (variables) => {
    const allVars = new Set();
    
    Object.values(variables).forEach(category => {
        if (typeof category === 'object') {
            Object.values(category).forEach(variable => {
                if (Array.isArray(variable)) {
                    variable.forEach(v => allVars.add(v));
                } else {
                    allVars.add(variable);
                }
            });
        }
    });
    
    return Array.from(allVars).join(',');
};

const aggregateVariables = (data, variableMap) => {
    const result = {};
    
    Object.entries(variableMap).forEach(([key, variables]) => {
        if (Array.isArray(variables)) {
            // Sum multiple variables
            result[key] = variables.reduce((sum, variable) => {
                const value = parseInt(data[variable]) || 0;
                return sum + value;
            }, 0);
        } else {
            // Single variable
            result[key] = parseInt(data[variables]) || 0;
        }
    });
    
    return result;
};

const fetchCensusData = async () => {
    if (!CENSUS_API_KEY) {
        console.log('No Census API key provided, using mock data');
        return generateMockStateData();
    }

    try {
        const variableString = buildVariableString(ACS_VARIABLES);
        const url = `${CENSUS_BASE_URL}/${ACS_YEAR}/acs/acs5?get=${variableString}&for=state:*&key=${CENSUS_API_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        const [headers, ...rows] = data;
        
        return rows.map(row => {
            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = row[index];
            });
            
            const stateCode = rowData.state;
            const stateName = getStateNameFromCode(stateCode);
            
            if (!stateName || !US_STATE_POSITIONS[stateName]) {
                return null;
            }
            
            return {
                state: stateName,
                population: parseInt(rowData[ACS_VARIABLES.population]) || 0,
                demographics: {
                    age: calculatePercentages(aggregateVariables(rowData, ACS_VARIABLES.age)),
                    race: calculatePercentages(aggregateVariables(rowData, ACS_VARIABLES.race)),
                    education: calculatePercentages(aggregateVariables(rowData, ACS_VARIABLES.education)),
                    income: calculatePercentages(aggregateVariables(rowData, ACS_VARIABLES.income))
                }
            };
        }).filter(Boolean);
        
    } catch (error) {
        console.error('Error fetching Census data:', error);
        return generateMockStateData();
    }
};

const calculatePercentages = (data) => {
    const total = data.Total || 1;
    const result = {};
    
    Object.entries(data).forEach(([key, value]) => {
        if (key !== 'Total') {
            result[key] = (value / total) * 100;
        } else {
            result[key] = value;
        }
    });
    
    return result;
};

// State code to abbreviation mapping SIMPLIFIED FIX THIS
const getStateNameFromCode = (fipsCode) => {
    const fipsToState = {
        '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO',
        '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI',
        '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY',
        '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN',
        '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
        '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH',
        '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD',
        '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA',
        '54': 'WV', '55': 'WI', '56': 'WY'
    };
    return fipsToState[fipsCode];
};

export default function USDemographicsViewer() {
    const [states, setStates] = useState([]);
    const [selectedMetric, setSelectedMetric] = useState('age');
    const [selectedSubMetric, setSelectedSubMetric] = useState('18-34');
    const [hoveredState, setHoveredState] = useState(null);
    const [selectedState, setSelectedState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [usingMockData, setUsingMockData] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
            // Load the pre-fetched JSON from /public/data/
            const res = await fetch(LOCAL_DATA_URL);
            if (!res.ok) throw new Error(`Failed to load ${LOCAL_DATA_URL}`);
            const data = await res.json();

            setStates(data);
            setUsingMockData(false); // because now it's real static data
            } catch (error) {
            console.error('Error loading static data:', error);
            setStates(generateMockStateData());
            setUsingMockData(true);
            } finally {
            setLoading(false);
            }
        };

        loadData();
        }, []);


    const maxValue = useMemo(() => {
        if (!states.length) return 100;
        return Math.max(...states.map(state => {
            const value = state.demographics[selectedMetric][selectedSubMetric];
            return value || 0;
        }));
    }, [states, selectedMetric, selectedSubMetric]);

    const subMetrics = useMemo(() => {
        if (!states.length) return [];
        return Object.keys(states[0]?.demographics[selectedMetric] || {}).filter(key => key !== 'Total');
    }, [states, selectedMetric]);

    const formatValue = (value) => {
        return `${(value || 0).toFixed(1)}%`;
    };

    const refreshData = async () => {
        setLoading(true);
        try {
            const data = await fetchCensusData();
            setStates(data);
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="animate-spin mx-auto mb-4" size={48} />
                    <p className="text-lg text-gray-600">Loading demographic data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="demographics-app">
            <Banner />    
            <div className="container">
                {/* Header */}
                <div className="demographics-header">
                    <h1 className="demographics-title">US Demographics Data Viewer</h1>
                    <p className="demographics-subtitle">Explore real US Census demographic data by state</p>
                    
                    {/* API Status Alert */}
                    {usingMockData && (
                        <div className="demographics-alert">
                            <AlertTriangle className="demographics-alert__icon" size={20} />
                            <div className="demographics-alert__content">
                                <p className="demographics-alert__title">Using Mock Data</p>
                                <p className="demographics-alert__text">
                                    To use real Census data, consult me to insert or give you access to my API key.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="demographics-controls">
                    <div className="demographics-controls__grid">
                        {/* Metric Selection */}
                        <div className="demographics-form-group">
                            <label className="demographics-form-label">Demographic Category</label>
                            <select
                                value={selectedMetric}
                                onChange={(e) => {
                                    setSelectedMetric(e.target.value);
                                    const newSubMetrics = Object.keys(states[0]?.demographics[e.target.value] || {}).filter(key => key !== 'Total');
                                    setSelectedSubMetric(newSubMetrics[0] || '');
                                }}
                                className="demographics-form-select"
                            >
                                {Object.entries(METRICS).map(([key, value]) => (
                                    <option key={key} value={key}>{value.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sub-metric Selection */}
                        <div className="demographics-form-group">
                            <label className="demographics-form-label">Specific Metric</label>
                            <select
                                value={selectedSubMetric}
                                onChange={(e) => setSelectedSubMetric(e.target.value)}
                                className="demographics-form-select"
                            >
                                {subMetrics.map(metric => (
                                    <option key={metric} value={metric}>{metric}</option>
                                ))}
                            </select>
                        </div>

                        {/* Refresh Button */}
                        <div className="demographics-form-group">
                            <button
                                onClick={refreshData}
                                disabled={loading}
                                className="demographics-btn"
                            >
                                <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                                <span>Refresh Data</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="demographics-layout">
                    {/* US Map View */}
                    <div className="demographics-map-section">
                        <div className="demographics-map-header">
                            <h2 className="demographics-map-title">US States Visualization</h2>
                            <div className="demographics-map-info">
                                {React.createElement(METRICS[selectedMetric].icon, { size: 20 })}
                                <span>{METRICS[selectedMetric].label}: {selectedSubMetric}</span>
                            </div>
                        </div>
                        
                        {/* US-shaped grid */}
                        <div className="demographics-map-container">
                            <div className="demographics-map-grid">
                                {states.map((state) => {
                                    const position = US_STATE_POSITIONS[state.state];
                                    if (!position) return null;
                                    
                                    const value = state.demographics[selectedMetric][selectedSubMetric] || 0;
                                    const color = getMetricColor(value, maxValue, METRICS[selectedMetric].color);
                                    
                                    return (
                                        <div
                                            key={state.state}
                                            className="state-tile"
                                            style={{
                                                backgroundColor: color,
                                                left: `${(position.col / 12) * 100}%`,
                                                top: `${(position.row / 11) * 100}%`,
                                            }}
                                            onMouseEnter={() => setHoveredState(state)}
                                            onMouseLeave={() => setHoveredState(null)}
                                            onClick={() => setSelectedState(state)}
                                            title={`${state.state}: ${formatValue(value)}`}
                                        >
                                            {state.state}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Legend */}
                            <div className="demographics-legend">
                                <div className="demographics-legend__title">Percentage Scale</div>
                                <div className="demographics-legend__scale">
                                    <span className="demographics-legend__label">0%</span>
                                    <div className="demographics-legend__colors">
                                        {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
                                            <div
                                                key={i}
                                                className="demographics-legend__color"
                                                style={{ 
                                                    backgroundColor: getMetricColor(intensity * maxValue, maxValue, METRICS[selectedMetric].color)
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span className="demographics-legend__label">{formatValue(maxValue)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details Panel */}
                    <div className="demographics-sidebar">
                        {/* Current Selection Info */}
                        <div className="demographics-info-card">
                            <h3 className="demographics-info-title">Current Selection</h3>
                            <div className="demographics-info-list">
                                <div className="demographics-info-item">
                                    <span className="demographics-info-label">Metric:</span>
                                    <span className="demographics-info-value">{METRICS[selectedMetric].label}</span>
                                </div>
                                <div className="demographics-info-item">
                                    <span className="demographics-info-label">Submetric:</span>
                                    <span className="demographics-info-value">{selectedSubMetric}</span>
                                </div>
                                <div className="demographics-info-item">
                                    <span className="demographics-info-label">Max Value:</span>
                                    <span className="demographics-info-value">{formatValue(maxValue)}</span>
                                </div>
                                <div className="demographics-info-item">
                                    <span className="demographics-info-label">Data Source:</span>
                                    <span className="demographics-info-value">{usingMockData ? 'Mock Data' : 'US Census ACS'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Hovered State Info */}
                        {hoveredState && (
                            <div className="demographics-info-card demographics-info-card--highlight">
                                <h3 className="demographics-info-title demographics-info-title--highlight">Hovered State</h3>
                                <div className="demographics-state-details">
                                    <div className="demographics-state-header">
                                        <div className="demographics-state-name demographics-state-name--highlight">{hoveredState.state}</div>
                                        <div className="demographics-state-population demographics-state-population--highlight">Population: {hoveredState.population.toLocaleString()}</div>
                                    </div>
                                    <div className="demographics-info-item">
                                        <span className="demographics-info-label">{selectedSubMetric}:</span>
                                        <span className="demographics-info-value demographics-info-value--highlight">
                                            {formatValue(hoveredState.demographics[selectedMetric][selectedSubMetric])}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Selected State Details */}
                        {selectedState && (
                            <div className="demographics-info-card">
                                <h3 className="demographics-info-title">State Details</h3>
                                <div className="demographics-state-details">
                                    <div className="demographics-state-header">
                                        <div className="demographics-state-name">{selectedState.state}</div>
                                        <div className="demographics-state-population">Population: {selectedState.population.toLocaleString()}</div>
                                    </div>
                                    
                                    <div className="demographics-metric-section">
                                        <h4 className="demographics-metric-title">{METRICS[selectedMetric].label}</h4>
                                        <div className="demographics-info-list">
                                            {Object.entries(selectedState.demographics[selectedMetric])
                                                .filter(([key]) => key !== 'Total')
                                                .map(([key, value]) => (
                                                <div key={key} className="demographics-metric-item">
                                                    <span className={`demographics-metric-name ${key === selectedSubMetric ? 'demographics-metric-name--selected' : ''}`}>
                                                        {key}:
                                                    </span>
                                                    <span className={`demographics-metric-value ${key === selectedSubMetric ? 'demographics-metric-value--selected' : ''}`}>
                                                        {formatValue(value)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="demographics-info-card">
                            <h3 className="demographics-info-title">Quick Stats</h3>
                            <div className="demographics-info-list">
                                <div className="demographics-info-item">
                                    <span className="demographics-info-label">Total States:</span>
                                    <span className="demographics-info-value">{states.length}</span>
                                </div>
                                <div className="demographics-info-item">
                                    <span className="demographics-info-label">Average {selectedSubMetric}:</span>
                                    <span className="demographics-info-value">
                                        {formatValue(states.reduce((sum, s) => sum + (s.demographics[selectedMetric][selectedSubMetric] || 0), 0) / states.length)}
                                    </span>
                                </div>
                                <div className="demographics-info-item">
                                    <span className="demographics-info-label">Highest State:</span>
                                    <span className="demographics-info-value">
                                        {states.reduce((max, state) => 
                                            (state.demographics[selectedMetric][selectedSubMetric] || 0) > (max.demographics[selectedMetric][selectedSubMetric] || 0) ? state : max
                                        , states[0] || {}).state || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Instructions and API Setup */}
                <div className="demographics-info-card" style={{ marginTop: '1.5rem' }}>
                    <h3 className="demographics-info-title">How to Use:</h3>
                    <ul style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem', paddingLeft: '1rem' }}>
                        <li>• Select a demographic category and specific metric from the dropdowns</li>
                        <li>• Hover over states on the map to see quick info</li>
                        <li>• Click on states to view detailed demographic breakdowns</li>
                        <li>• Colors indicate percentage intensity - darker colors represent higher percentages</li>
                        <li>• Use the refresh button to reload data</li>
                    </ul>
                </div>

                {usingMockData && (
                    <div className="demographics-info-card demographics-info-card--highlight" style={{ marginTop: '1rem' }}>
                        <h3 className="demographics-info-title demographics-info-title--highlight">Setup Real Census Data:</h3>
                        <div style={{ fontSize: '0.875rem', color: '#1d4ed8', marginTop: '0.5rem' }}>
                            <p>To use real US Census data, contact me</p>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#2563eb' }}>
                                US Census API provides data for age groups, race/ethnicity, education levels, and income brackets at the state level.
                            </p>
                        </div>
                    </div>
                )}

                <div className="demographics-info-card" style={{ marginTop: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <h3 className="demographics-info-title" style={{ color: '#166534' }}>Data Sources & API Information:</h3>
                    <div style={{ fontSize: '0.875rem', color: '#15803d', marginTop: '0.25rem' }}>
                        <p>This product uses the Census Bureau Data API but is not endorsed or certified by the Census Bureau.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}