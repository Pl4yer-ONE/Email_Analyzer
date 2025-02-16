import { useState } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { MsalProvider } from '@azure/msal-react'
import { PublicClientApplication } from '@azure/msal-browser'
import { HeaderAnalyzer, EmailHeader } from './types/EmailHeader'
import { EmailProviderSelector } from './components/EmailProviderSelector'
import { EmailSelector } from './components/EmailSelector'
import { GOOGLE_CLIENT_ID, MSAL_CONFIG } from './config/auth'
import Dashboard from './components/Dashboard.tsx'
import RiskScore from './components/RiskScore.tsx'
import { 
  DataItem, 
  SecurityChecks, 
  IPAddressList 
} from './components/DataDisplay'
import { formatEmailDate } from './utils/formatDate'

const msalInstance = new PublicClientApplication(MSAL_CONFIG);

function App() {
  const [rawHeader, setRawHeader] = useState('')
  const [analysisResult, setAnalysisResult] = useState<EmailHeader | null>(null)
  const [authState, setAuthState] = useState<{
    provider?: 'gmail' | 'outlook';
    token?: string;
  }>({})

  const analyzeHeader = () => {
    if (!rawHeader.trim()) {
      alert('Please enter an email header to analyze')
      return
    }

    try {
      console.log('Raw header input:', rawHeader);
      const result = HeaderAnalyzer.parseHeader(rawHeader)
      console.log('Analysis result:', result);
      setAnalysisResult(result)
    } catch (error) {
      console.error('Error analyzing header:', error)
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return (
    <MsalProvider instance={msalInstance}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div className="min-h-screen bg-gray-900 p-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8 text-purple-400">
              Email Header Analyzer
            </h1>

            <div className="bg-gray-800/50 rounded-xl shadow-lg p-6 mb-6 border border-purple-500/20 backdrop-blur-sm">
              {!authState.token ? (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-white">Choose Email Provider</h2>
                  <EmailProviderSelector
                    onGmailSelect={(token) => setAuthState({ provider: 'gmail', token })}
                    onOutlookSelect={(token) => setAuthState({ provider: 'outlook', token })}
                  />
                </div>
              ) : (
                <EmailSelector
                  provider={authState.provider!}
                  token={authState.token}
                  onEmailSelect={setRawHeader}
                />
              )}

              <div className="mt-6">
                <label className="block text-lg font-medium mb-2 text-gray-300">
                  Raw Email Header:
                </label>
                <textarea
                  value={rawHeader}
                  onChange={(e) => setRawHeader(e.target.value)}
                  className="w-full h-32 p-2 border border-purple-500/30 rounded-lg mb-4 bg-gray-900/60 text-gray-300"
                  placeholder="Paste email header here or select an email above..."
                />
                <button
                  onClick={analyzeHeader}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Analyze Header
                </button>
              </div>
            </div>

            {analysisResult && (
              <div className="bg-purple-800/20 rounded-xl shadow-lg p-6 border border-purple-400/30 backdrop-blur-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-purple-100">
                  <DataItem label="From" value={analysisResult.sender || 'Not available'} />
                  <DataItem label="Subject" value={analysisResult.subject || 'No subject'} />
                  <DataItem label="Date" value={formatEmailDate(analysisResult.date)} />
                  <DataItem 
                    label="Message-ID" 
                    value={analysisResult.messageId || 'Not available'} 
                    truncate 
                  />
                </div>

                <RiskScore 
                  legitimacy={analysisResult.legitimacyScore}
                  threatLevel={analysisResult.threatLevel}
                  authenticationStatus={analysisResult.authenticationStatus}
                />

                <Dashboard analysisResult={analysisResult} />

                <SecurityChecks 
                  spf={analysisResult?.spfResult} 
                  dkim={Array.isArray(analysisResult?.dkimResult) ? analysisResult.dkimResult.join(', ') : analysisResult?.dkimResult || ''}
                  dmarc={analysisResult?.dmarcResult}
                />

                <IPAddressList ips={analysisResult.ipAddresses} />
              </div>
            )}

            <div className="mt-8 bg-gray-800/50 rounded-xl shadow-lg p-6 border border-purple-500/20 backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-4 text-purple-400">Educational Resources</h2>
              <ul className="space-y-2 text-gray-300 font-medium">
                <li>• Email headers contain routing and authentication information</li>
                <li>• SPF verifies if the sender is authorized to send from that domain</li>
                <li>• DKIM ensures the email wasn't tampered with during transit</li>
                <li>• DMARC combines SPF and DKIM to prevent email spoofing</li>
              </ul>
            </div>
          </div>
        </div>
      </GoogleOAuthProvider>
    </MsalProvider>
  )
}

export default App