import React, { useEffect, useState } from 'react';
import { formatEmailDate } from '../utils/formatDate';

interface Email {
  id: string;
  subject: string;
  from: string;
  date: string;
  rawHeader: string;
}

interface EmailSelectorProps {
  provider: 'gmail' | 'outlook';
  token: string;
  onEmailSelect: (header: string) => void;
}

export const EmailSelector = ({ provider, token, onEmailSelect }: EmailSelectorProps) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        // First, get list of email IDs
        const response = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10',
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        const data = await response.json();
        
        // Then fetch details for each email
        const emailPromises = data.messages.map(async (msg: { id: string }) => {
          const detailResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          const messageData = await detailResponse.json();
          
          // Extract headers
          const headers = messageData.payload.headers;
          const rawHeader = headers
            .map((h: any) => `${h.name}: ${h.value}`)
            .join('\r\n');
          return {
            id: msg.id,
            subject: headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject',
            from: headers.find((h: any) => h.name === 'From')?.value || 'Unknown',
            date: headers.find((h: any) => h.name === 'Date')?.value || '',
            rawHeader
          };
        });

        const emailList = await Promise.all(emailPromises);
        setEmails(emailList);
      } catch (error) {
        console.error('Error fetching emails:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token && provider === 'gmail') {
      fetchEmails();
    }
  }, [token, provider]);

  const formatSender = (sender: string) => {
    // Remove email address and brackets
    const clean = sender.replace(/<[^>]+>/g, '').trim();
    // Remove quotes if present
    return clean.replace(/^"(.*)"$/, '$1');
  };

  return (
    <div className="email-selector">
      <h2 className="text-xl font-bold mb-4 text-white">Select an Email</h2>
      {loading ? (
        <p className="text-gray-600">Loading emails...</p>
      ) : emails.length === 0 ? (
        <p className="text-gray-600">No emails found. Please make sure you're properly authenticated.</p>
      ) : (
        <ul className="email-list">
          {emails.map((email) => (
            <div
              key={email.id}
              onClick={() => onEmailSelect(email.rawHeader)}
              className="p-4 hover:bg-purple-900/20 transition-colors cursor-pointer border-b border-purple-500/10"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-white truncate">
                  {formatSender(email.from)}
                </div>
                <div className="text-sm text-purple-300 ml-2">
                  {formatEmailDate(email.date)}
                </div>
              </div>
              <div className="text-purple-100 text-sm truncate">
                {email.subject || 'No subject'}
              </div>
            </div>
          ))}
        </ul>
      )}
    </div>
  );
};