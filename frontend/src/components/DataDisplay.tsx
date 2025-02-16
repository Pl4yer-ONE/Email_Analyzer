import { 
  ShieldCheck, 
  Key, 
  ShieldAlert 
} from 'lucide-react';

interface DataItemProps {
  label: string;
  value: string;
  truncate?: boolean;
}

const DataItem = ({ label, value, truncate }: DataItemProps) => (
  <div className="p-3 bg-purple-900/30 rounded-lg">
    <h3 className="text-sm font-bold text-purple-400 mb-1">{label}</h3>
    <p className={`text-purple-100 ${truncate ? 'truncate' : ''}`}>
      {value || 'N/A'}
    </p>
  </div>
);

interface SecurityChecksProps {
  spf?: string;
  dkim?: string;
  dmarc?: string;
}

const SecurityChecks = ({ spf = '', dkim = '', dmarc = '' }: SecurityChecksProps) => (
  <div className="mb-8 bg-purple-900/20 rounded-xl p-6 border border-purple-400/30 backdrop-blur-sm">
    <h3 className="text-2xl font-bold mb-6 text-purple-400">Authentication Results</h3>
    
    {/* SPF Section */}
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-6 h-6 text-cyan-400" />
        <h4 className="text-lg font-semibold text-purple-300">SPF Verification</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-purple-100">
        <div className="p-3 bg-purple-800/30 rounded-lg">
          <span className="text-sm font-medium">Domain:</span>
          <p className="font-mono truncate">{spf.match(/domain of (.*?) designates/)?.[1] || 'N/A'}</p>
        </div>
        <div className="p-3 bg-purple-800/30 rounded-lg">
          <span className="text-sm font-medium">Permitted IP:</span>
          <p className="font-mono text-green-400">
            {spf.match(/(?:permitted sender\)|as permitted sender) ([\d.]+)/)?.[1] || 
             spf.match(/client-ip=([\d.]+)/)?.[1] || 
             'N/A'}
          </p>
        </div>
      </div>
    </div>

    {/* DKIM Section */}
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Key className="w-6 h-6 text-purple-400" />
        <h4 className="text-lg font-semibold text-purple-300">DKIM Signature</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-purple-100">
        <div className="p-3 bg-purple-800/30 rounded-lg">
          <span className="text-sm font-medium">Algorithm:</span>
          <p className="font-mono">{dkim.match(/a=(rsa-\w+);/)?.[1] || 'N/A'}</p>
        </div>
        <div className="p-3 bg-purple-800/30 rounded-lg">
          <span className="text-sm font-medium">Hash:</span>
          <p className="font-mono truncate">{dkim.match(/bh=([^;]+)/)?.[1] || 'N/A'}</p>
        </div>
        <div className="col-span-full p-3 bg-purple-800/30 rounded-lg">
          <span className="text-sm font-medium">Signature:</span>
          <p className="font-mono text-xs break-all opacity-80">
            {dkim.match(/b=([^;]+)/)?.[1]?.replace(/\s/g, '') || 'N/A'}
          </p>
        </div>
      </div>
    </div>

   
 
<SecurityCheckItem 
label="SPF" 
status={spf.includes('pass') ? 'PASS' : 'FAIL'} 
details={spf.includes('pass') ? `with IP ${spf.match(/client-ip=([\d.]+)/)?.[1]}` : ''}
link="https://dmarcly.com/blog/what-is-spf"
/>
    <SecurityCheckItem 
      label="DKIM" 
      status={dkim ? 'PASS' : 'FAIL'} 
      details={dkim ? `with domain ${dkim.match(/d=([^;]+)/)?.[1] || 'N/A'}` : ''}
      link="https://dmarcly.com/blog/what-is-dkim"
    />
    <SecurityCheckItem 
      label="DMARC" 
      status={dmarc?.toLowerCase().includes('dmarc=pass') ? 'PASS' : 'FAIL'}
      details={dmarc?.includes('dmarc=pass') ? `(Policy: ${dmarc.match(/p=(\w+)/)?.[1]})` : ''}
      link="https://dmarcly.com/blog/what-is-dmarc"
    />
  </div>
);

const SecurityCheckItem = ({ 
  label, 
  status,
  details,
  link 
}: { 
  label: string; 
  status: string;
  details?: string;
  link: string;
}) => (
  <div className="p-3 bg-purple-900/30 rounded-lg flex items-center justify-between text-purple-100 mb-2">
    <div className="flex-1">
      <span className="font-medium">{label}:</span>
      <span className={`ml-2 font-bold ${status === 'PASS' ? 'text-green-400' : 'text-red-400'}`}>
        {status}
      </span>
      {details && <span className="ml-2 text-purple-300 text-sm font-mono">{details}</span>}
    </div>
    <a href={link} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
      Learn more
    </a>
  </div>
);

interface IPAddressListProps {
  ips: string[];
}

const IPAddressList = ({ ips }: IPAddressListProps) => (
  <div className="text-purple-100">
    <h3 className="text-xl font-bold mb-4 text-purple-300">IP Addresses Found</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      {ips.map((ip, index) => (
        <div 
          key={index}
          className="p-2 bg-purple-900/30 rounded-md text-sm font-mono truncate text-purple-100"
        >
          {ip}
        </div>
      ))}
    </div>
  </div>
);

export {
  DataItem,
  SecurityChecks,
  IPAddressList
}; 