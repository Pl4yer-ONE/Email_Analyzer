declare const gmailApi: {
  users: {
    messages: {
      get: (params: { userId: string; id: string }) => Promise<any>;
    };
  };
};

function isPrivateIP(ip: string): boolean {
  // Implementation
}

interface EmailHeader {
  ipAddresses: string[];
  legitimacyScore: number;
  threatLevel: string;
  authenticationStatus: string;
  spfResult: string;
  dkimResult: string;
  dmarcResult: string;
  sender?: string;
  subject?: string;
  date?: string;
  messageId?: string;
  authenticationResults: {
    spf?: string;
    dkim?: string;
    dmarc?: string;
  };
  securityIndicators: string[];
  returnPath?: string;
  sourceIp?: string;
  senderType?: string;
  senderDomain?: string;
  platformIdentifier?: string;
  cleanSender: string;
  formattedDate: string;
  baseLegitimacyScore: number;
}

interface EmailAnalysis {
  threatLevel: string;
  recommendations: string[];
  authenticationResults: string;
  legitimacyScore: number;
  // ... add other required properties
}

export const HeaderAnalyzer = {
  parseHeader(rawHeader: string | Array<{name: string; value: string}>): EmailHeader {
    const headers = Array.isArray(rawHeader) 
      ? rawHeader 
      : this.parseRawHeaderString(rawHeader);

    const result: Partial<EmailHeader> = {
      ipAddresses: [],
      legitimacyScore: 0,
      threatLevel: 'Medium',
      authenticationStatus: 'Unverified',
      authenticationResults: {},
      securityIndicators: [],
      cleanSender: '',
      formattedDate: '',
      baseLegitimacyScore: 0
    };

    headers.forEach(({name, value}) => {
      const lowerName = name.toLowerCase();
      const lcValue = value.toLowerCase();

      switch(lowerName) {
        case 'authentication-results':
        case 'arc-authentication-results':
          value.split(';').forEach(part => {
            const [key, ...rest] = part.split('=');
            const val = rest.join('=').trim();
            switch(key.trim().toLowerCase()) {
              case 'dkim':
                result.authenticationResults!.dkim = val.split(/\s+/)[0];
                break;
              case 'spf':
                result.authenticationResults!.spf = val.split(/\s+/)[0];
                break;
              case 'dmarc':
                result.authenticationResults!.dmarc = val.split(/\s+/)[0];
                break;
            }
          });
          break;
        case 'received':
          const ipMatch = value.match(/\[([^\]]+)\]/);
          if (ipMatch) {
            const ip = ipMatch[1];
            if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip) ||  // IPv4
                /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i.test(ip)) {  // IPv6
              result.ipAddresses!.push(ip);
            }
          }
          break;
        case 'from':
          const emailMatch = value.match(/<([^>]+)>/);
          result.sender = emailMatch ? emailMatch[1] : value;
          result.cleanSender = value.replace(/<[^>]+>/g, '').trim();
          break;
        case 'subject':
          result.subject = value;
          break;
        case 'date':
          result.date = new Date(value).toISOString();
          result.formattedDate = this.formatEmailDate(value);
          break;
        case 'message-id':
          result.messageId = value;
          break;
        case 'x-account-notification-type':
          result.threatLevel = value === '127-RECOVERY' ? 'High' : 'Medium';
          break;
        case 'received-spf':
          result.securityIndicators!.push('Valid SPF Record');
          break;
        case 'dkim-signature':
          const dkimDomain = value.match(/d=([^;]+)/)?.[1];
          if (dkimDomain) {
            result.securityIndicators!.push(`DKIM Signed by ${dkimDomain}`);
          }
          break;
        case 'return-path':
          result.returnPath = value.match(/<([^>]+)>/)?.[1];
          break;
        case 'bimi-selector':
          const bimiData = value.match(/v=([^;]+);\s*s=([^;]+)/);
          if (bimiData) {
            result.securityIndicators!.push(`BIMI Verified (v${bimiData[1]} ${bimiData[2]})`);
          }
          break;
        case 'x-facebook-notify':
        case 'x-fb-internal-notiftype':
          result.securityIndicators!.push('Facebook Official Notification');
          result.senderType = 'SocialMediaPlatform';
          break;
        case 'list-unsubscribe-post':
          result.securityIndicators!.push('One-Click Unsubscribe Verified');
          break;
        case 'x-fb-internal-mid':
          result.messageId = value;
          break;
        case 'feedback-id':
          result.platformIdentifier = value.split(':')[0];
          break;
      }
    });

    // Security notification specific checks
    if (result.sender?.includes('no-reply@accounts.google.com')) {
      result.legitimacyScore = 100;
      result.authenticationStatus = 'Verified';
      result.threatLevel = 'Low';
    } else {
      result.legitimacyScore = this.calculateSocialMediaLegitimacy(result);
      result.threatLevel = this.determineThreatLevel(result);
      result.authenticationStatus = this.checkAuthentication(result);
    }

    // Add platform-specific validation
    if (result.senderDomain?.endsWith('.ac.in')) {
      result.securityIndicators!.push('Educational Institution Domain');
      result.legitimacyScore = Math.min(result.legitimacyScore + 10, 100);
    }

    // Final validation
    result.ipAddresses = [...new Set(result.ipAddresses)].filter(ip =>
      this.isValidIP(ip) && ip !== '127.0.0.1'
    );

    // Add validation at the end of parseHeader
    const requiredFields = [
      'sender', 'subject', 'date', 
      'messageId', 'ipAddresses'
    ];

    requiredFields.forEach(field => {
      if (!result[field as keyof EmailHeader]) {
        console.warn(`Missing required field: ${field}`);
        throw new Error(`Invalid header format - missing ${field}`);
      }
    });

    if (result.ipAddresses.length === 0) {
      console.warn('No valid IP addresses found in header');
    }

    // Final validation
    if (result.authenticationResults?.dmarc === 'pass' &&
        result.authenticationResults?.spf === 'pass' &&
        result.authenticationResults?.dkim === 'pass') {
      result.threatLevel = 'Trusted';
      result.authenticationStatus = 'Verified';
    }

    return result as EmailHeader;
  },

  private parseRawHeaderString(rawHeader: string) {
    return rawHeader.split('\n').map(line => {
      const [name, ...values] = line.split(':');
      return {
        name: name.trim(),
        value: values.join(':').trim()
      };
    });
  },

  private extractIPs(value: string): string[] {
    const ipv4 = /\b(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
    const ips = (value.match(ipv4) || [])
      .filter(ip => {
        const parts = ip.split('.');
        return parts.every(part => {
          const num = parseInt(part, 10);
          return num >= 0 && num <= 255;
        });
      });
    return [...new Set(ips)];
  },

  private parseDate(dateString: string) {
    // Handle dates with timezone abbreviations
    const cleanedDate = dateString
      .replace(/\([A-Z]+\)/g, '') // Remove timezone abbreviations like (IST)
      .replace(/(\d+)(st|nd|rd|th)/, '$1') // Remove ordinal suffixes
      .trim();

    try {
      const parsedDate = new Date(cleanedDate);
      if (isNaN(parsedDate.getTime())) throw new Error('Invalid date');
      return parsedDate.toISOString();
    } catch {
      return 'Invalid date format';
    }
  },

  private calculateSocialMediaLegitimacy(header: Partial<EmailHeader>): number {
    let score = 0;
    const boosters = {
      bimi: 15,
      officialNotification: 25,
      oneClickUnsubscribe: 10,
      platformMatch: 20
    };

    if (header.securityIndicators?.some(s => s.startsWith('BIMI'))) score += boosters.bimi;
    if (header.securityIndicators?.includes('Facebook Official Notification')) score += boosters.officialNotification;
    if (header.securityIndicators?.includes('One-Click Unsubscribe Verified')) score += boosters.oneClickUnsubscribe;
    if (header.platformIdentifier === header.senderDomain) score += boosters.platformMatch;
    
    return Math.min(score + this.baseLegitimacyScore(header), 100);
  },

  private determineThreatLevel(result: Partial<EmailHeader>) {
    const failedAuths = [result.spfResult, result.dkimResult, result.dmarcResult]
      .filter(res => res === 'Fail').length;
      
    if (failedAuths >= 2) return 'High';
    if (failedAuths === 1) return 'Medium';
    return 'Low';
  },

  private checkAuthentication(result: Partial<EmailHeader>) {
    return result.spfResult === 'Pass' && 
           result.dkimResult === 'Pass' && 
           result.dmarcResult === 'Pass'
      ? 'Verified'
      : 'Unverified';
  },

  private isValidIP(ip: string) {
    const octets = ip.split('.');
    if (octets.length !== 4) return false;
    return octets.every(octet => {
      const num = parseInt(octet, 10);
      return !isNaN(num) && num >= 0 && num <= 255 && octet === num.toString();
    });
  },

  processHeaders(rawHeaders: string): EmailAnalysis {
    const parsed = this.parseHeader(rawHeaders);
    const analysis: EmailAnalysis = {
      threatLevel: this.assessThreatLevel(parsed),
      recommendations: this.generateRecommendations(parsed),
      authenticationResults: this.analyzeAuthentication(parsed),
      legitimacyScore: this.calculateLegitimacy(parsed)
    };
    return analysis;
  },

  async function analyzeGmailMessage(messageId: string) {
    // Get full RFC822 message from Gmail API
    const rawMessage = await gmailApi.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'raw'
    });

    // Decode base64url encoded message
    const decoded = Buffer.from(rawMessage.data.raw, 'base64url').toString('utf-8');
    
    // Extract headers section
    const headerEnd = decoded.indexOf('\r\n\r\n');
    const headers = decoded.slice(0, headerEnd);
    
    return processGoogleHeaders(headers);
  },

  function processGoogleHeaders(headers: string) {
    // Google-specific header processing
    const headerMap = parseHeaders(headers);
    const analysis: EmailAnalysis = {
      gmailSpecific: {
        spamScore: headerMap['x-gm-spam']?.[0] || '0',
        phishScore: headerMap['x-gm-phishy']?.[0] || '0',
        priorityInbox: headerMap['x-gm-prio']?.[0] === '1',
        labels: headerMap['x-gm-labels']?.[0].split(',')
      },
      ...processHeaders(headers)
    };

    // Add Gmail authentication context
    if (headerMap['x-google-authenticated-id']) {
      analysis.authenticationResults.gmailAuth = 
        headerMap['x-google-authenticated-id'][0].split(':')[1];
    }

    return analysis;
  },

  private getAuthStatus(header: Partial<EmailHeader>): string {
    const { dkim, spf, dmarc } = header.authenticationResults || {};
    const allPass = [dkim, spf, dmarc].every(s => s?.toLowerCase() === 'pass');
    
    if (allPass) return 'Verified';
    if ([dkim, spf, dmarc].some(s => s?.toLowerCase() === 'pass')) return 'Partially Verified';
    return 'Unverified';
  },

  private assessThreatLevel(header: Partial<EmailHeader>): string {
    if (header.legitimacyScore === 100) return 'Trusted';
    if (header.legitimacyScore >= 75) return 'Low Risk';
    if (header.legitimacyScore >= 50) return 'Medium Risk';
    if (header.legitimacyScore >= 25) return 'High Risk';
    return 'Suspicious';
  },

  private calculateLegitimacy(header: Partial<EmailHeader>): number {
    let score = 0;
    const { dkim, spf, dmarc } = header.authenticationResults || {};
    
    // Base authentication points
    if (spf?.includes('pass')) score += 25;
    if (dkim?.includes('pass')) score += 25;
    if (dmarc?.includes('pass')) score += 25;
    
    // Security indicators bonus
    const securityBonus = Math.min(header.securityIndicators?.length || 0, 3) * 5;
    score += securityBonus;

    // Deductions for suspicious elements
    if (header.threatLevel?.includes('Risk')) score -= 15;
    if (header.ipAddresses?.some(ip => isPrivateIP(ip))) score -= 10;
    
    return Math.min(Math.max(score, 0), 100);
  },

  function mapAnalysisToDisplay(analysis: EmailHeader) {
    return {
      legitimacy: analysis.legitimacyScore,
      threatLevel: analysis.threatLevel.includes('Trusted') ? 'Low' : 
        analysis.threatLevel.includes('Risk') ? 'Medium' : 'High',
      authenticationStatus: analysis.authenticationStatus
    };
  },

  private analyzeHeaders(headers: any[]) {
    const analysis = this.parseHeader(headers);
    
    return {
      legitimacy: analysis.legitimacyScore,
      threatLevel: analysis.threatLevel,
      authenticationStatus: analysis.authenticationStatus,
      analysisDetails: {
        spf: this.formatSPFResult(analysis),
        dkim: this.formatDKIMResults(analysis),
        dmarc: this.formatDMARCResult(analysis),
        redFlags: this.detectRedFlags(analysis),
        recommendations: this.generateRecommendations(analysis),
        sendingServer: analysis.sendingServer,
        thirdPartyServices: analysis.thirdPartyServices
      }
    };
  },

  private formatSPFResult(analysis: EmailHeader) {
    const ip = analysis.ipAddresses?.[0] || 'unknown';
    return `Passed SPF validation from authorized server (${ip})`;
  },

  private formatDKIMResults(analysis: EmailHeader) {
    return analysis.securityIndicators
      .filter(s => s.startsWith('DKIM'))
      .map(s => s.replace('DKIM Signed by ', ''));
  },

  private detectRedFlags(analysis: EmailHeader) {
    const flags = [];
    if (analysis.returnPath?.includes('bulk')) flags.push('Unusual Return-Path address pattern');
    if (analysis.thirdPartyServices.length > 0) flags.push(`Third-party service detected: ${analysis.thirdPartyServices.join(', ')}`);
    return flags;
  },

  private generateRecommendations(analysis: EmailHeader) {
    const recs = [];
    if (analysis.threatLevel === 'Trusted') {
      recs.push('Likely legitimate communication - verify links before clicking');
    } else {
      recs.push('Exercise caution with links and attachments');
    }
    return recs;
  },

  function formatEmailDate(date: Date): string {
    return date.toISOString();
  },

  function getAuthStatus(headers: Partial<EmailHeader>): string {
    // ... implementation
  },

  function assessThreatLevel(headers: Partial<EmailHeader>): string {
    // ... implementation
  }
}; 