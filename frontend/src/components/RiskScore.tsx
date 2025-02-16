import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Shield, Sparkles } from 'lucide-react';
import ChatInterface from './ChatInterface.tsx';
import ReactMarkdown from 'react-markdown';

interface AnalysisDetails {
  spf: string;
  dkim: string[];
  dmarc: string;
  redFlags: string[];
  recommendations: string[];
  sendingServer: string;
  thirdPartyServices: string[];
}

interface RiskScoreProps {
  legitimacy: number;
  threatLevel: string;
  authenticationStatus: string;
  analysisDetails?: Partial<AnalysisDetails>;
  aiAnalysis?: {
    riskAssessment: number;
    threatLevel: string;
    authenticationStatus: string;
    details: {
      spf: string;
      dkim: string;
      dmarc: string;
      recommendations: string[];
    };
  };
  aiSummary?: string;
}

const RiskScore = ({ 
  legitimacy, 
  threatLevel: initialThreatLevel,
  authenticationStatus,
  analysisDetails = {
    spf: '',
    dkim: [],
    dmarc: '',
    redFlags: [],
    recommendations: [],
    sendingServer: '',
    thirdPartyServices: []
  },
  aiAnalysis,
  aiSummary
}: RiskScoreProps) => {
  const { 
    spf = 'No SPF information available',
    dkim = [],
    dmarc = 'No DMARC policy found',
    redFlags = [],
    recommendations = ['No specific recommendations available'],
    sendingServer = '',
    thirdPartyServices = []
  } = analysisDetails || {};

  const threatColor = {
    Low: 'text-green-400',
    Medium: 'text-yellow-400',
    High: 'text-red-400',
    Trusted: 'text-emerald-400',
    Suspicious: 'text-orange-400'
  }[initialThreatLevel];

  const authStatusColor = {
    Verified: 'text-emerald-400',
    'Partially Verified': 'text-amber-400',
    Unverified: 'text-red-400'
  }[authenticationStatus];

  // Verification logic
  const spfVerified = analysisDetails.spf?.includes('pass') ?? false;
  const dkimVerified = (analysisDetails.dkim?.length ?? 0) > 0;
  const dmarcVerified = analysisDetails.dmarc?.includes('pass') ?? false;

  const authStatus = spfVerified && dkimVerified && dmarcVerified ? 'Verified' : 'Unverified';
  const calculatedThreatLevel = 
    !spfVerified || !dkimVerified || !dmarcVerified ? 'High' :
    analysisDetails.redFlags?.length ? 'Medium' : 'Low';

  // Calculate risk based on authentication status
  const calculatedRisk = 
    (spfVerified ? 25 : 0) + 
    (dkimVerified ? 25 : 0) + 
    (dmarcVerified ? 25 : 0) + 
    (analysisDetails.redFlags?.length ? 25 : 0);

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 bg-gray-800/50 rounded-2xl border border-purple-500/20 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-purple-400" />
          Security & Legitimacy Analysis
        </h2>
        <div className="badge bg-purple-900/50 text-purple-300 border border-purple-500/30">
          AI-Powered Analysis
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-gray-900/60 rounded-xl border border-purple-500/30">
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400 mb-2">
              {calculatedRisk}%
            </div>
            <div className="text-gray-300 font-medium">Authentication Score</div>
          </div>
        </div>

        <div className="p-4 bg-gray-900/60 rounded-xl border border-purple-500/30">
          <div className="text-center">
            <div className={`text-3xl font-bold ${threatColor} mb-2`}>
              {calculatedThreatLevel}
            </div>
            <div className="text-gray-300 font-medium">Threat Level</div>
          </div>
        </div>

        <div className="p-4 bg-gray-900/60 rounded-xl border border-purple-500/30">
          <div className="text-center">
            <div className={`text-3xl font-bold ${authStatusColor} mb-2`}>
              {authStatus}
            </div>
            <div className="text-gray-300 font-medium">Email Authentication</div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <ChatInterface />
      </div>
    </div>
  );
}

export default RiskScore; 