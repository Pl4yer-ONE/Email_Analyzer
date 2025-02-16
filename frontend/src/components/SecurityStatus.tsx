const SecurityStatus = ({ analysis }: { analysis: EmailAnalysis }) => (
  <div className="security-dashboard">
    <div className="metric">
      <span className="label text-purple-300">AI Risk Assessment</span>
      <span className="value text-purple-100">{100 - analysis.legitimacyScore}%</span>
    </div>
    
    <div className="metric">
      <span className="label text-purple-300">Legitimacy Score</span>
      <span className={`value text-purple-100 score-${Math.floor(analysis.legitimacyScore/25)}`}>
        {analysis.legitimacyScore}%
      </span>
    </div>

    <div className="metric">
      <span className="label text-purple-300">Threat Level</span>
      <span className={`value text-purple-100 threat-${analysis.threatLevel.toLowerCase().replace(' ', '-')}`}>
        {analysis.threatLevel}
      </span>
    </div>

    <div className="metric">
      <span className="label text-purple-300">Authentication Status</span>
      <span className={`value text-purple-100 auth-${analysis.authenticationStatus.toLowerCase().replace(' ', '-')}`}>
        {analysis.authenticationStatus}
      </span>
    </div>
  </div>
); 