"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMessageEncryption } from "@/hooks/use-message-encryption";
import { useFileEncryption } from "@/hooks/use-file-encryption";
import { Lock, FileText, Image, Video, Upload, Download } from "lucide-react";

export default function EncryptionDemo() {
  const [sessionId, setSessionId] = useState("");
  const [textMessage, setTextMessage] = useState("Hello, this is a test message for encryption!");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [encryptionResults, setEncryptionResults] = useState<any[]>([]);

  // Initialize encryption session
  useEffect(() => {
    setSessionId(`demo_${Date.now()}`);
  }, []);

  const { encryptMessage, decryptMessage } = useMessageEncryption(sessionId);
  const { encryptFile, getEncryptionTask } = useFileEncryption(sessionId);

  const handleTextEncryption = async () => {
    try {
      console.log("[v0] 🔐 Starting text message encryption...");
      console.log("[v0] 🔐 Session ID:", sessionId);
      console.log("[v0] 🔐 Message:", textMessage);
      
      if (!sessionId) {
        console.error("[v0] ❌ No session ID available");
        return;
      }
      
      const encrypted = await encryptMessage(textMessage);
      console.log("[v0] ✅ Text encryption successful:", encrypted);
      
      const result = {
        type: "text",
        original: textMessage,
        encrypted: encrypted,
        timestamp: new Date().toISOString()
      };
      
      setEncryptionResults(prev => [result, ...prev]);
      
      // Test decryption
      setTimeout(async () => {
        try {
          const decrypted = await decryptMessage(encrypted);
          console.log("[v0] ✅ Text decryption successful:", decrypted);
        } catch (error) {
          console.error("[v0] ❌ Text decryption failed:", error);
        }
      }, 1000);
      
    } catch (error) {
      console.error("[v0] ❌ Text encryption failed:", error);
      console.error("[v0] ❌ Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        sessionId,
        textMessage
      });
    }
  };

  const handleFileEncryption = async () => {
    if (!selectedFile) return;
    
    try {
      console.log("[v0] 🔐 Starting file encryption...");
      const taskId = await encryptFile(selectedFile);
      
      // Monitor encryption progress
      const checkProgress = setInterval(async () => {
        const task = getEncryptionTask(taskId);
        if (task) {
          console.log(`[v0] File encryption progress: ${task.status} - ${task.progress}%`);
          
          if (task.status === "completed" && task.result) {
            clearInterval(checkProgress);
            
            const result = {
              type: "file",
              original: selectedFile.name,
              encrypted: task.result,
              timestamp: new Date().toISOString()
            };
            
            setEncryptionResults(prev => [result, ...prev]);
            console.log("[v0] ✅ File encryption completed successfully!");
          } else if (task.status === "error") {
            clearInterval(checkProgress);
            console.error("[v0] ❌ File encryption failed:", task.error);
          }
        }
      }, 500);
      
    } catch (error) {
      console.error("[v0] File encryption failed:", error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      console.log("[v0] File selected:", {
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="h-6 w-6 text-blue-600" />;
    if (fileType.startsWith("video/")) return <Video className="h-6 w-6 text-red-600" />;
    if (fileType.startsWith("audio/")) return <Video className="h-6 w-6 text-green-600" />;
    return <FileText className="h-6 w-6 text-gray-600" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <Lock className="inline h-8 w-8 text-blue-600 mr-3" />
          Encryption Demo
        </h1>
        <p className="text-gray-600">Test end-to-end encryption for messages, files, images, and videos</p>
        <p className="text-sm text-gray-500 mt-2">
          <strong>Silent Operation:</strong> Encryption happens in the background with detailed console logging
        </p>
        <p className="text-sm text-gray-500 mt-1">Session ID: {sessionId}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Text Message Encryption */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Text Message Encryption
            </CardTitle>
            <CardDescription>
              Encrypt plain text messages using AES-256-GCM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="textMessage">Message to Encrypt</Label>
              <Textarea
                id="textMessage"
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                placeholder="Enter your message here..."
                className="mt-1"
              />
            </div>
            <Button onClick={handleTextEncryption} className="w-full">
              <Lock className="h-4 w-4 mr-2" />
              Encrypt Message
            </Button>
            
            {/* Simple Test Button */}
            <Button 
              onClick={() => {
                console.log("[v0] 🧪 Testing direct encryption...");
                console.log("[v0] 🧪 Session ID:", sessionId);
                console.log("[v0] 🧪 Testing with simple message...");
                
                // Test if Web Crypto API is available
                if (window.crypto && window.crypto.subtle) {
                  console.log("[v0] ✅ Web Crypto API is available");
                  
                  // Test basic encryption
                  const testData = new TextEncoder().encode("test");
                  console.log("[v0] 🧪 Test data:", testData);
                  
                  // Test if we can generate a key
                  crypto.subtle.generateKey(
                    {
                      name: "AES-GCM",
                      length: 256,
                    },
                    true,
                    ["encrypt", "decrypt"],
                  ).then(key => {
                    console.log("[v0] ✅ AES key generation successful:", key);
                  }).catch(err => {
                    console.error("[v0] ❌ AES key generation failed:", err);
                  });
                } else {
                  console.error("[v0] ❌ Web Crypto API not available");
                }
              }} 
              variant="outline" 
              className="w-full mt-2"
            >
              🧪 Test Console Logging & Crypto API
            </Button>
          </CardContent>
        </Card>

        {/* File Encryption */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              File Encryption
            </CardTitle>
            <CardDescription>
              Encrypt files, images, and videos using AES-256-GCM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fileInput">Select File</Label>
              <Input
                id="fileInput"
                type="file"
                onChange={handleFileSelect}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                className="mt-1"
              />
            </div>
            {selectedFile && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                {getFileIcon(selectedFile.type)}
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                  </p>
                </div>
              </div>
            )}
            <Button 
              onClick={handleFileEncryption} 
              disabled={!selectedFile}
              className="w-full"
            >
              <Lock className="h-4 w-4 mr-2" />
              Encrypt File
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Encryption Results */}
      <Card>
        <CardHeader>
          <CardTitle>Encryption Results</CardTitle>
          <CardDescription>
            View encryption results and console output
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {encryptionResults.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No encryption results yet. Try encrypting a message or file above.
              </p>
            ) : (
              encryptionResults.map((result, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-green-600" />
                    <span className="font-medium capitalize">{result.type} Encryption</span>
                    <span className="text-sm text-gray-500">{result.timestamp}</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>Original:</strong> {result.original}</p>
                    <p><strong>Status:</strong> ✅ Encrypted Successfully</p>
                    <p className="text-gray-600">
                      Check the browser's console for detailed encryption information
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">How to Test Encryption</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Open your browser's Developer Tools (F12)</li>
            <li>Go to the Console tab</li>
            <li>Try encrypting a text message or file above</li>
            <li>Watch the detailed encryption output in the console</li>
            <li>The console will show encryption details exactly like your reference images:</li>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-xs">
              <li><strong>Text Messages:</strong> sessionId, originalMessage, encryptedContent, encryptionResult with algorithm, authTag, iv, keyId, timestamp, version</li>
              <li><strong>Files:</strong> sessionId, fileInfo, encryptionDetails, fileCategory, securityInfo</li>
            </ul>
            <li><strong>Note:</strong> Encryption happens silently in the background - no UI indicators</li>
            <li>All encryption/decryption logs appear in the console for debugging</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
} 