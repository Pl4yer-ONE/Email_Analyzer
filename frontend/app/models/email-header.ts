export interface EmailHeader {
  receivedFrom: string;
  date: string;
  messageId: string;
  subject: string;
  sender: string;
  recipient: string;
  ipAddresses: string[];
  spfResult?: string;
  dkimResult?: string;
  dmarcResult?: string;
}

export class HeaderAnalyzer {
  static parseHeader(rawHeader: string): EmailHeader {
    // This is a simplified parser for educational purposes
    const header: EmailHeader = {
      receivedFrom: this.extractField(rawHeader, 'Received'),
      date: this.extractField(rawHeader, 'Date'),
      messageId: this.extractField(rawHeader, 'Message-ID'),
      subject: this.extractField(rawHeader, 'Subject'),
      sender: this.extractField(rawHeader, 'From'),
      recipient: this.extractField(rawHeader, 'To'),
      ipAddresses: this.extractIPs(rawHeader),
      spfResult: this.extractField(rawHeader, 'Received-SPF'),
      dkimResult: this.extractField(rawHeader, 'DKIM-Signature'),
      dmarcResult: this.extractField(rawHeader, 'DMARC')
    };
    return header;
  }

  private static extractField(header: string, fieldName: string): string {
    const regex = new RegExp(`${fieldName}: (.*)`, 'i');
    const match = header.match(regex);
    return match ? match[1].trim() : '';
  }

  private static extractIPs(header: string): string[] {
    const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
    return header.match(ipRegex) || [];
  }
}