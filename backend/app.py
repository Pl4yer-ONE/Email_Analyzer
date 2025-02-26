from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import email
import re
import requests
import logging
import socket
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict
import dns.resolver
import shodan
from datetime import datetime
from email import message_from_string
from email.policy import default
import ipinfo

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)

IPAPI_KEY = "your api key"  # Your ipapi API key
ABUSEIPDB_API_KEY = " "  # Your AbuseIPDB API key

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB

ACCESS_TOKEN = ' '

class IPAnalyzer:
    def __init__(self):
        self.SHODAN_API_KEY = "  "
        self.logging = logging.getLogger(__name__)
        
    def _is_valid_ip(self, ip):
        try:
            socket.inet_pton(socket.AF_INET, ip)
            return True
        except socket.error:
            try:
                socket.inet_pton(socket.AF_INET6, ip)
                return True
            except socket.error:
                return False

    def _get_dns_info(self, ip):
        if not self._is_valid_ip(ip):
            return {"error": "Invalid IP address"}
            
        dns_info = {}
        try:
            dns_info['ptr'] = socket.gethostbyaddr(ip)[0]
        except:
            dns_info['ptr'] = "No PTR record"
        return dns_info

    def _get_shodan_info(self, ip):
        if not self._is_valid_ip(ip):
            return {"error": "Invalid IP address"}
            
        try:
            api = shodan.Shodan(self.SHODAN_API_KEY)
            return api.host(ip)
        except Exception as e:
            return {"error": str(e)}

    def _get_detailed_location(self, ip):
        if not self._is_valid_ip(ip):
            return {"error": "Invalid IP address"}
            
        try:
            response = requests.get(f'http://ip-api.com/json/{ip}', timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    return data
            response = requests.get(f'https://ipapi.co/{ip}/json/', timeout=5)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            self.logging.error(f"Location error: {str(e)}")
        return {}

    def _get_network_info(self, ip):
        if not self._is_valid_ip(ip):
            return {"error": "Invalid IP address"}
            
        network_info = {}
        try:
            asn_response = requests.get(f'https://api.bgpview.io/ip/{ip}')
            if asn_response.status_code == 200:
                network_info['asn'] = asn_response.json()

            common_ports = [80, 443, 22, 21, 25, 53, 3306, 3389]
            open_ports = []
            for port in common_ports:
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(1)
                    result = sock.connect_ex((ip, port))
                    if result == 0:
                        open_ports.append(port)
                    sock.close()
                except:
                    continue
            network_info['open_ports'] = open_ports
            network_info['is_private'] = self._is_private_ip(ip)
            network_info['reverse_dns'] = socket.getfqdn(ip)

        except Exception as e:
            self.logging.error(f"Network info error: {str(e)}")
        return network_info

    def _is_private_ip(self, ip):
        try:
            ip_parts = ip.split('.')
            if len(ip_parts) == 4:
                first_octet = int(ip_parts[0])
                second_octet = int(ip_parts[1])
                return (
                    first_octet == 10 or
                    (first_octet == 172 and 16 <= second_octet <= 31) or
                    (first_octet == 192 and second_octet == 168)
                )
        except:
            pass
        return False

    def analyze_ip(self, ip):
        if not ip or not self._is_valid_ip(ip):
            return {"error": "Invalid IP address", "ip": ip}

        try:
            start_time = time.time()
            results = {
                "ip": ip,
                "timestamp": datetime.now().isoformat(),
                "analysis_duration": None
            }

            with ThreadPoolExecutor(max_workers=4) as executor:
                future_to_task = {
                    executor.submit(self._get_detailed_location, ip): "location",
                    executor.submit(self._get_dns_info, ip): "dns",
                    executor.submit(self._get_network_info, ip): "network",
                    executor.submit(self._get_shodan_info, ip): "shodan"
                }

                for future in as_completed(future_to_task):
                    task_name = future_to_task[future]
                    try:
                        results[task_name] = future.result()
                    except Exception as e:
                        self.logging.error(f"Error in {task_name}: {str(e)}")
                        results[task_name] = {"error": str(e)}

            results["analysis_duration"] = time.time() - start_time
            return results

        except Exception as e:
            self.logging.error(f"Error in analyze_ip: {str(e)}")
            return {"error": str(e), "ip": ip}

    def _check_threat_intelligence(self, ip):
        try:
            # Check AbuseIPDB
            abuse_response = requests.get(
                'https://api.abuseipdb.com/api/v2/check',
                params={'ipAddress': ip},
                headers={
                    'Accept': 'application/json',
                },
                timeout=5
            )
            
            # Check TOR exit nodes
            tor_response = requests.get(
                'https://check.torproject.org/exit-addresses',
                timeout=5
            )
            
            return {
                "is_tor_exit": ip in tor_response.text if tor_response.status_code == 200 else False,
                "abuse_confidence_score": abuse_response.json().get('data', {}).get('abuseConfidenceScore', 0) if abuse_response.status_code == 200 else 0
            }
        except Exception as e:
            self.logging.error(f"Threat intelligence error: {str(e)}")
            return {}

def analyze_ip(ip):
    analyzer = IPAnalyzer()
    return analyzer.analyze_ip(ip)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    email_content = request.form.get('emailContent', '')
    received_headers = extract_received_headers(email_content)
    ips = extract_ips_from_headers(received_headers)
    results = [get_ip_info(ip) for ip in ips]
    return jsonify(results)

def extract_received_headers(email_content):
    email_message = message_from_string(email_content, policy=default)
    return email_message.get_all('Received', [])

def extract_ips_from_headers(headers):
    ip_pattern = re.compile(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b')
    ips = []
    for header in headers:
        found_ips = ip_pattern.findall(header)
        for ip in found_ips:
            normalized_ip = normalize_ip(ip)
            if is_valid_ip(normalized_ip):
                logging.info(f"Valid IP found: {normalized_ip}")
                ips.append(normalized_ip)
    return ips

def normalize_ip(ip):
    # Remove leading zeros from each octet
    return '.'.join(str(int(octet)) for octet in ip.split('.'))

def is_valid_ip(ip):
    try:
        socket.inet_pton(socket.AF_INET, ip)
        return True
    except socket.error:
        return False

def get_ip_info(ip):
    handler = ipinfo.getHandler(ACCESS_TOKEN)
    details = handler.getDetails(ip)
    return details.all

if __name__ == "__main__":
    app.run(debug=True)
