import React, { useMemo, useState, useEffect } from 'react';
import { analyzeHeaders } from '../utils/emailAnalysis';
import { Email } from '../types/Email';
import { RiskScore } from './RiskScore';
import axios from 'axios';
import { Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ServerHopVisualization from './ServerHopVisualization';
import SecurityStatus from './SecurityStatus';
import DataItem from './DataItem';
import SecurityChecks from './SecurityChecks';
import IPAddressList from './IPAddressList';

const EmailAnalysis = ({ email }: { email: Email }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  
  useEffect(() => {
    const getAiAnalysis = async () => {
      setIsAnalyzing(true);
      try {
        const response = await axios.post('/api/analyze', {
          headers: email.headers
        });
        setAiAnalysis(response.data.analysis.response);
      } catch (error) {
        setAiAnalysis('*AI analysis unavailable*');
      }
      setIsAnalyzing(false);
    };

    getAiAnalysis();
  }, [email]);

  useEffect(() => {
    const getSecuritySummary = async () => {
      try {
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'deepseek-r1:1.5b',
            prompt: `Analyze these email headers for security risks. Focus on:
            - Authentication results (SPF/DKIM/DMARC)
            - Suspicious patterns
            - Server reputation
            - Link safety
            Format response as bullet points with emojis. Keep it under 150 words.
            Headers: ${JSON.stringify(email.headers)}`,
            stream: false
          }),
        });

        const data = await response.json();
        setAiSummary(data.response);
      } catch (error) {
        setAiSummary('*AI analysis unavailable*');
      }
    };

    getSecuritySummary();
  }, [email]);

  const analysis = useMemo(() => analyzeHeaders(email.headers), [email]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
      {/* Authentication Status Card */}
      {analysis.authenticationStatus && (
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <SecurityStatus analysis={analysis} />
        </div>
      )}

      {/* Header Analysis Card */}
      {email.headers.length > 0 && (
        <div className="col-span-1 lg:col-span-2">
          <div className="p-6 bg-purple-900/20 rounded-xl h-full">
            <h3 className="text-2xl font-bold mb-4 text-purple-400">Header Analysis</h3>
            <div className="space-y-4">
              <DataItem label="From" value={email.from} />
              <DataItem label="Subject" value={email.subject} />
              <DataItem label="Return-Path" value={email.returnPath} truncate />
            </div>
          </div>
        </div>
      )}

      {/* Security Checks */}
      {(analysis.spfStatus || analysis.dkimResults.length > 0 || analysis.dmarcPolicy) && (
        <div className="col-span-full">
          <SecurityChecks 
            spf={analysis.spfStatus} 
            dkim={analysis.dkimResults.join(', ')} 
            dmarc={analysis.dmarcPolicy} 
          />
        </div>
      )}

      {/* IP Addresses */}
      {analysis.ipAddresses.length > 0 && (
        <div className="col-span-1 md:col-span-2">
          <IPAddressList ips={analysis.ipAddresses} />
        </div>
      )}

      {/* Server Visualization */}
      {email.headers.some(h => h.toLowerCase().startsWith('received:')) && (
        <div className="col-span-full">
          <ServerHopVisualization headers={email.headers} />
        </div>
      )}
    </div>
  );
};

export default EmailAnalysis; 