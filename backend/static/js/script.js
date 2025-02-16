async function analyzeHeaders() {
    const headers = document.getElementById('headers').value;
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p>Analyzing...</p>';

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ raw_headers: headers })
        });

        const data = await response.json();
        if (data.success) {
            displayResults(data.data);
            visualizeRoute(data.data.route);
        } else {
            resultsDiv.innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
        }
    } catch (error) {
        resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    let html = '<div class="results-container">';

    data.route.forEach((hop, index) => {
        if (hop.ip_info) {
            html += `
                <div class="section hop-section">
                    <h3>Hop ${index + 1}: ${hop.server}</h3>
                    
                    <!-- Basic Info -->
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">IP Address:</span>
                            <span class="value">${hop.ip}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Analysis Duration:</span>
                            <span class="value">${hop.ip_info.analysis_duration?.toFixed(2)}s</span>
                        </div>
                    </div>

                    <!-- Location Information -->
                    <div class="subsection">
                        <h4>Location Information</h4>
                        <div class="info-grid">
                            ${renderLocationInfo(hop.ip_info.location)}
                        </div>
                    </div>

                    <!-- Network Information -->
                    <div class="subsection">
                        <h4>Network Information</h4>
                        <div class="info-grid">
                            ${renderNetworkInfo(hop.ip_info.network)}
                        </div>
                    </div>

                    <!-- DNS Information -->
                    <div class="subsection">
                        <h4>DNS Information</h4>
                        <div class="info-grid">
                            ${renderDNSInfo(hop.ip_info.dns)}
                        </div>
                    </div>

                    <!-- Threat Intelligence -->
                    <div class="subsection">
                        <h4>Threat Intelligence</h4>
                        <div class="info-grid">
                            ${renderThreatInfo(hop.ip_info.threat_intelligence)}
                        </div>
                    </div>

                    <!-- Additional Services -->
                    ${hop.ip_info.shodan ? `
                        <div class="subsection">
                            <h4>Shodan Information</h4>
                            <div class="info-grid">
                                ${renderShodanInfo(hop.ip_info.shodan)}
                            </div>
                        </div>
                    ` : ''}

                    ${hop.ip_info.virustotal ? `
                        <div class="subsection">
                            <h4>VirusTotal Information</h4>
                            <div class="info-grid">
                                ${renderVirusTotalInfo(hop.ip_info.virustotal)}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    });

    html += '</div>';
    resultsDiv.innerHTML = html;
}

// Helper functions to render different sections
function renderLocationInfo(location) {
    if (!location) return '';
    return `
        <div class="info-item">
            <span class="label">Location:</span>
            <span class="value">${location.city || 'N/A'}, ${location.region || 'N/A'}, ${location.country || 'N/A'}</span>
        </div>
        <div class="info-item">
            <span class="label">Coordinates:</span>
            <span class="value">${location.lat || 'N/A'}, ${location.lon || 'N/A'}</span>
        </div>
        <div class="info-item">
            <span class="label">Timezone:</span>
            <span class="value">${location.timezone || 'N/A'}</span>
        </div>
    `;
}

function renderNetworkInfo(network) {
    if (!network) return '';
    return `
        <div class="info-item">
            <span class="label">ASN:</span>
            <span class="value">${network.asn?.asn || 'N/A'}</span>
        </div>
        <div class="info-item">
            <span class="label">Open Ports:</span>
            <span class="value">${network.open_ports?.join(', ') || 'None detected'}</span>
        </div>
    `;
}

function renderDNSInfo(dns) {
    if (!dns) return '';
    return `
        <div class="info-item">
            <span class="label">Hostname:</span>
            <span class="value">${dns.ptr || 'N/A'}</span>
        </div>
        <div class="info-item">
            <span class="label">DNS Records:</span>
            <span class="value">${Object.entries(dns)
                .filter(([key]) => key !== 'ptr')
                .map(([key, value]) => `${key}: ${value.join(', ')}`)
                .join('<br>') || 'N/A'}</span>
        </div>
    `;
}

function renderThreatInfo(threat) {
    if (!threat) return '';
    return `
        <div class="info-item ${threat.known_malicious ? 'threat' : 'safe'}">
            <span class="label">Threat Status:</span>
            <span class="value">${threat.known_malicious ? 'Known Malicious' : 'No Known Threats'}</span>
        </div>
        ${threat.threat_feeds.length ? `
            <div class="info-item">
                <span class="label">Threat Feeds:</span>
                <span class="value">${threat.threat_feeds.join('<br>')}</span>
            </div>
        ` : ''}
    `;
}

function visualizeRoute(route) {
    const data = [{
        type: 'scattergeo',
        mode: 'lines+markers',
        locations: route.map(hop => hop.ip_info ? hop.ip_info.country : ''),
        text: route.map(hop => hop.server),
        marker: { size: 8 }
    }];

    const layout = {
        title: 'Email Route Visualization',
        geo: {
            projection: { type: 'orthographic' }
        }
    };

    Plotly.newPlot('route-visualization', data, layout);
}

document.getElementById('emailForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const emailContent = document.getElementById('emailContent').value;
    fetch('/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'emailContent': emailContent
        })
    })
    .then(response => response.json())
    .then(data => {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '<pre>' + JSON.stringify(data, null, 4) + '</pre>';
    })
    .catch(error => console.error('Error:', error));
}); 