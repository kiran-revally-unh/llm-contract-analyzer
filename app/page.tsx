"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Moon, Sun, Shield, Upload, Scale, Lock, User } from "lucide-react";

export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const [contractText, setContractText] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const contractTypes = [
    {
      title: "Review Employment Offer",
      description: "Check for non-competes, IP ownership, and termination clauses.",
      type: "employment_offer",
      placeholder: "Paste an employment offer or contract here…",
      badge: null
    },
    {
      title: "Terms of Service",
      description: "Highlight data privacy concerns and liability limitations.",
      type: "tos",
      placeholder: "Paste Terms of Service or Privacy Policy…",
      badge: "Data Privacy Focus"
    },
    {
      title: "Simplify NDAs",
      description: "Extract duration, exclusion criteria, and definition of confidential info.",
      type: "nda",
      placeholder: "Paste NDA or confidentiality agreement…",
      badge: "Plain English Mode"
    },
    {
      title: "Lease Agreement",
      description: "Find predatory language in commercial lease agreements.",
      type: "lease",
      placeholder: "Paste commercial lease or agreement…",
      badge: "Predatory Language Detection"
    }
  ];

  const selectedContract = contractTypes.find(c => c.type === selectedType);
  const placeholderText = selectedContract?.placeholder || "Paste contract text or ask a legal question...";

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      // Send PDF to server for processing
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to extract PDF text');
      }
      
      const data = await response.json();
      return data.text;
    } catch (error: any) {
      console.error('PDF extraction error:', error);
      throw new Error(error.message || 'Failed to extract text from PDF. The file might be corrupted or protected.');
    }
  };

  const extractTextFromDOCX = async (file: File): Promise<string> => {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error('Failed to extract text from DOCX file.');
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      let text = '';
      const fileType = file.type;
      const fileName = file.name.toLowerCase();
      
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        text = await extractTextFromPDF(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        text = await extractTextFromDOCX(file);
      } else if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
        throw new Error('Please convert .doc files to .docx format. Legacy .doc format is not supported.');
      } else {
        // Default to reading as text
        text = await file.text();
      }
      
      if (!text || text.trim().length === 0) {
        throw new Error('No text could be extracted from the file. Please ensure the file contains readable text.');
      }
      
      setContractText(text);
    } catch (error: any) {
      console.error('Error reading file:', error);
      alert(error.message || 'Failed to read file. Please try again or use a different format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          handleFileUpload(file);
        }
        break;
      }
    }
  };

  return (
    <div className="min-h-svh w-full flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gray-900 text-white grid place-items-center">
              <Shield className="size-4" />
            </div>
            <span className="font-bold text-lg">Coco</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm font-medium">
              <span className="text-gray-600">GPT-4o</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm">
              <Lock className="size-3 text-gray-500" />
              <span className="text-gray-600">Private</span>
            </div>
            <button
              aria-label="Toggle theme"
              className="size-9 grid place-items-center rounded-full border border-gray-200 hover:bg-gray-100"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <div className="size-9 rounded-full bg-yellow-400 grid place-items-center">
              <User className="size-4 text-gray-900" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-12">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Analyze Contract
            </h1>
            <p className="text-gray-600 text-lg">
              Upload or paste contract text for high-fidelity legal review and risk assessment.
            </p>
          </div>

          {/* Contract Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {contractTypes.map((contract, index) => (
              <button
                key={index}
                onClick={() => setSelectedType(contract.type)}
                className="text-left w-full"
              >
                <Card className={`h-full border transition-all cursor-pointer ${
                  selectedType === contract.type 
                    ? 'border-yellow-400 bg-yellow-50/50 shadow-md ring-2 ring-yellow-400/20' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      {contract.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm text-gray-600">
                      {contract.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>

          {/* Text Input Area */}
          <div className="mb-8">
            {selectedContract?.badge && (
              <div className="mb-3 flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200">
                  <div className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs font-medium text-blue-700">{selectedContract.badge}</span>
                </div>
              </div>
            )}
            <Card 
              className={`border shadow-lg transition-all ${
                isDragging 
                  ? 'border-yellow-400 bg-yellow-50/30 ring-2 ring-yellow-400/20' 
                  : 'border-gray-200'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CardContent className="p-6 relative">
                {isDragging && (
                  <div className="absolute inset-0 flex items-center justify-center bg-yellow-50/90 rounded-lg z-10 border-2 border-dashed border-yellow-400">
                    <div className="text-center">
                      <Upload className="size-12 text-yellow-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Drop your contract here</p>
                    </div>
                  </div>
                )}
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-lg z-10">
                    <div className="text-center">
                      <div className="size-8 border-4 border-gray-200 border-t-yellow-400 rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Processing file...</p>
                    </div>
                  </div>
                )}
                <Textarea
                  placeholder={placeholderText}
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  onPaste={handlePaste}
                  className="min-h-[200px] border-0 focus-visible:ring-0 resize-none text-base placeholder:text-gray-400"
                />
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={isProcessing}
                    >
                      <Upload className="size-4" />
                      Attach Contract
                    </Button>
                    <input 
                      id="file-upload" 
                      type="file" 
                      className="hidden" 
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                    />
                    <Button variant="outline" className="gap-2">
                      <Scale className="size-4" />
                      Jurisdictions
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="rounded-full size-10 bg-green-50 hover:bg-green-100"
                    >
                      <svg className="size-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </Button>
                    <Link href={`/contract-analyzer?type=${selectedType || 'tos'}&text=${encodeURIComponent(contractText)}`}>
                      <Button 
                        className="rounded-full size-10 bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                        size="icon"
                        disabled={!contractText.trim()}
                      >
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                Coco can make mistakes. Always consult with a legal professional. All data is encrypted and private according to your{" "}
                <Link href="#" className="text-blue-600 hover:underline">Security Preferences</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8 text-sm">
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-gray-900">10k+</div>
                <div className="text-xs text-gray-600">Contracts Analyzed</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-gray-900">99.9%</div>
                <div className="text-xs text-gray-600">Uptime</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-gray-900">AES-256</div>
                <div className="text-xs text-gray-600">Encrypted</div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <Link href="#" className="hover:text-gray-900">Terms</Link>
              <Link href="#" className="hover:text-gray-900">Privacy</Link>
              <Link href="#" className="hover:text-gray-900">API</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-3">
        <Button
          size="icon"
          variant="outline"
          className="size-12 rounded-full bg-white shadow-lg border-gray-200 hover:bg-gray-50"
          title="Help"
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="size-12 rounded-full bg-white shadow-lg border-gray-200 hover:bg-gray-50"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
      </div>
    </div>
  );
}
