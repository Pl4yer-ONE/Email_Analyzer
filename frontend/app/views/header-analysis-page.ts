import { Observable } from '@nativescript/core';
import { HeaderAnalyzer, EmailHeader } from '../models/email-header';

export class HeaderAnalysisViewModel extends Observable {
  private _rawHeader: string = '';
  private _analysisResult: EmailHeader | null = null;

  constructor() {
    super();
  }

  get rawHeader(): string {
    return this._rawHeader;
  }

  set rawHeader(value: string) {
    if (this._rawHeader !== value) {
      this._rawHeader = value;
      this.notifyPropertyChange('rawHeader', value);
    }
  }

  get analysisResult(): EmailHeader | null {
    return this._analysisResult;
  }

  set analysisResult(value: EmailHeader | null) {
    if (this._analysisResult !== value) {
      this._analysisResult = value;
      this.notifyPropertyChange('analysisResult', value);
    }
  }

  analyzeHeader() {
    if (!this.rawHeader.trim()) {
      alert('Please enter an email header to analyze');
      return;
    }

    try {
      this.analysisResult = HeaderAnalyzer.parseHeader(this.rawHeader);
    } catch (error) {
      console.error('Error analyzing header:', error);
      alert('Error analyzing header. Please check the format and try again.');
    }
  }
}

export function onNavigatingTo(args) {
  const page = args.object;
  page.bindingContext = new HeaderAnalysisViewModel();
}