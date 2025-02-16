import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ServerHop {
  ip: string;
  location?: string;
  timestamp?: string;
  delay?: string;
}

interface ServerHopVisualizationProps {
  headers: string[];
}

const ServerHopVisualization = ({ headers }: ServerHopVisualizationProps) => {
  const [hops, setHops] = useState<ServerHop[]>([]);

  useEffect(() => {
    const extractHops = () => {
      const receivedHeaders = headers.filter(header => 
        header.toLowerCase().startsWith('received:')
      );

      const hopsData = receivedHeaders.map(header => {
        const ipMatch = header.match(/\[([\d.]+)\]/);
        const timestampMatch = header.match(/\d{1,2}:\d{2}:\d{2}/);
        const locationMatch = header.match(/\(([\w\s,]+)\)/);

        return {
          ip: ipMatch ? ipMatch[1] : 'Unknown IP',
          location: locationMatch ? locationMatch[1] : 'Unknown Location',
          timestamp: timestampMatch ? timestampMatch[0] : 'Unknown Time',
          delay: 'Calculating...'
        };
      }).reverse(); // Reverse to show in chronological order

      setHops(hopsData);
    };

    extractHops();
  }, [headers]);

  return (
    <div className="p-6 bg-purple-900/20 rounded-xl border border-purple-500/30 backdrop-blur-sm">
      <h3 className="text-2xl font-bold mb-6 text-purple-400">Server Route Visualization</h3>
      
      <div className="space-y-4">
        {hops.map((hop, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="flex-1 p-4 bg-purple-800/30 rounded-lg border border-purple-500/20">
              <div className="flex items-center justify-between text-purple-100">
                <div>
                  <p className="font-mono text-sm">{hop.ip}</p>
                  <p className="text-xs text-purple-300">{hop.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-purple-300">{hop.timestamp}</p>
                  <p className="text-xs text-purple-300">{hop.delay}</p>
                </div>
              </div>
            </div>
            
            {index < hops.length - 1 && (
              <ArrowRight className="w-6 h-6 text-purple-400" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServerHopVisualization; 