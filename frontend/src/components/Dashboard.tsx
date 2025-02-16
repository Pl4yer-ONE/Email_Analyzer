import React from 'react';
import { Globe, Server, Shield } from 'lucide-react';

interface DashboardProps {
  analysisResult: EmailHeader;
}

const Dashboard = ({ analysisResult }: DashboardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
      <div className="p-6 bg-gray-800/50 rounded-xl border border-purple-500/20 backdrop-blur-sm">
        <div className="flex items-center space-x-4 mb-4">
          <Globe className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-bold">Geolocation Tracking</h3>
        </div>
        <div className="h-48 bg-gray-900/60 rounded-lg border border-purple-500/30 flex items-center justify-center">
          <span className="text-gray-400 font-medium">Interactive Map View</span>
        </div>
      </div>

      <div className="p-6 bg-gray-800/50 rounded-xl border border-purple-500/20 backdrop-blur-sm">
        <div className="flex items-center space-x-4 mb-4">
          <Server className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold">Server Hop Analysis</h3>
        </div>
        <div className="h-48 bg-gray-900/60 rounded-lg border border-purple-500/30 flex items-center justify-center">
          <span className="text-gray-400 font-medium">Server Route Visualization</span>
        </div>
      </div>

      <div className="p-6 bg-gray-800/50 rounded-xl border border-purple-500/20 backdrop-blur-sm">
        <div className="flex items-center space-x-4 mb-4">
          <Shield className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-bold">Security Verification</h3>
        </div>
        <div className="h-48 bg-gray-900/60 rounded-lg border border-purple-500/30 flex items-center justify-center">
          <span className="text-gray-400 font-medium">SPF/DKIM/DMARC Status</span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 