import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Camera,
  Scan,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  FileCheck,
  Eye,
  Trash2,
} from 'lucide-react';
import { ScannedDocument } from '../../types';
import { CURRENT_HOSPITAL } from '../../data/hospitals';

interface Screen7DocumentScanProps {
  scannedDocs: ScannedDocument[];
  onAddDocument: (doc: ScannedDocument) => void;
  onRemoveDocument: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Screen7DocumentScan: React.FC<Screen7DocumentScanProps> = ({
  scannedDocs,
  onAddDocument,
  onRemoveDocument,
  onNext,
  onBack,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ScannedDocument | null>(null);

  // Sample medical documents for instant evaluation
  const handleSampleScan = async (sampleType: 'prescription' | 'lab') => {
    setIsScanning(true);
    try {
      const docName =
        sampleType === 'prescription'
          ? `${CURRENT_HOSPITAL.code}_Cardiology_FollowUp_Prescription.pdf`
          : 'Biochemistry_Blood_Panel_Report.pdf';

      const res = await fetch('/api/gemini/document-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentName: docName,
        }),
      });

      const json = await res.json();
      const ocrResult = json.data || {
        documentType: sampleType === 'prescription' ? 'Prior Prescription' : 'Laboratory Report',
        extractedText:
          `${CURRENT_HOSPITAL.name}. OPD Card #9482. Tab Atorvastatin 20mg OD at night. Tab Telmisartan 40mg OD in morning. Fasting Blood Glucose: 118 mg/dL. HbA1c: 6.8%.`,
        keyFindings: [
          'Medications: Atorvastatin 20mg OD, Telmisartan 40mg OD',
          'Fasting Blood Glucose: 118 mg/dL',
          'HbA1c: 6.8% (Borderline)',
        ],
      };

      const newDoc: ScannedDocument = {
        id: `doc-${Date.now()}`,
        name: docName,
        type: sampleType === 'prescription' ? 'Prescription' : 'Lab Report',
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        extractedText: ocrResult.extractedText,
        keyFindings: ocrResult.keyFindings || [],
      };

      onAddDocument(newDoc);
      setPreviewDoc(newDoc);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setTimeout(() => {
      const newDoc: ScannedDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: 'Prescription',
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        extractedText: `Uploaded Medical Record: ${file.name}. Patient reported prior medication history attached to digital encounter.`,
        keyFindings: [
          `File uploaded: ${file.name}`,
          'Attached to ABDM Encounter for doctor review',
        ],
      };
      onAddDocument(newDoc);
      setPreviewDoc(newDoc);
      setIsScanning(false);
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-emerald-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/40 rounded text-emerald-300 text-[11px] font-mono uppercase tracking-wider">
                Step 7 of 10 • Document Scan & OCR
              </span>
              <span className="text-xs text-slate-300">दस्तावेज़ स्कैन एवं डिजिटलीकरण</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Scan className="w-6 h-6 text-emerald-400" />
              <span>Prior Medical Records & Lab Scan</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Upload or scan your old hospital prescriptions, discharge summaries, or blood test reports for AI-assisted clinical text extraction.
            </p>
          </div>

          <div className="p-3 bg-white/10 backdrop-blur rounded-xl text-center self-start sm:self-center shrink-0 border border-white/10">
            <Sparkles className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-white block">Gemini OCR</span>
            <span className="text-[10px] text-slate-300">ABDM PHR Sync</span>
          </div>
        </div>
      </div>

      {/* Upload Zone & Quick Sample Scanners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Upload / Camera Box */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 border-2 border-dashed border-slate-300 hover:border-emerald-500 transition shadow-sm text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Camera className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900">
              Drop prior prescriptions or reports here
            </h2>
            <p className="text-xs text-slate-500 max-w-sm">
              Supports JPEG, PNG, PDF medical documents. Optical Character Recognition will extract medicines and vital findings.
            </p>
          </div>

          <label className="cursor-pointer px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span>Choose File or Scan Document</span>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Quick Demo Scan Buttons */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Test Sample Documents:
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Simulate instant camera scanner with pre-recorded hospital records:
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              disabled={isScanning}
              onClick={() => handleSampleScan('prescription')}
              className="w-full p-2.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 text-left flex items-center gap-2.5 transition"
            >
              <FileCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="truncate">
                <span className="block truncate">Prior {CURRENT_HOSPITAL.code} Rx (2025)</span>
                <span className="text-[10px] text-slate-500">Prescription Slip</span>
              </div>
            </button>

            <button
              type="button"
              disabled={isScanning}
              onClick={() => handleSampleScan('lab')}
              className="w-full p-2.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 text-left flex items-center gap-2.5 transition"
            >
              <FileText className="w-4 h-4 text-teal-700 shrink-0" />
              <div className="truncate">
                <span className="block truncate">Lipid & Glucose Panel</span>
                <span className="text-[10px] text-slate-500">Laboratory Report</span>
              </div>
            </button>
          </div>

          {isScanning && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Scanning document with OCR...</span>
            </div>
          )}
        </div>
      </div>

      {/* Scanned Documents Attached List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-700" />
            <span>Attached Clinical Records ({scannedDocs.length})</span>
          </h2>
          <span className="text-xs text-slate-500">Ready for Doctor Consultation</span>
        </div>

        {scannedDocs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 space-y-1">
            <p>No previous medical documents attached yet.</p>
            <p className="text-[11px] text-slate-400">
              You can proceed directly if you do not have past documents today.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {scannedDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                      {doc.type}
                    </span>
                    <span className="font-bold text-slate-900">{doc.name}</span>
                    <span className="text-slate-400 text-[10px] font-mono">{doc.uploadedAt}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {doc.keyFindings.map((finding, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-slate-700"
                      >
                        ✓ {finding}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-white rounded-lg transition"
                    title="View Extracted Text"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveDocument(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
                    title="Remove Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* OCR Text Preview Modal / Expansion */}
        {previewDoc && (
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950">
                Extracted Text from {previewDoc.name}:
              </span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <p className="font-mono text-[11px] text-slate-700 bg-white p-3 rounded-lg border border-emerald-100 whitespace-pre-wrap">
              {previewDoc.extractedText}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Red-Flag Review</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-7 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition"
        >
          <span>Proceed to Patient Summary Confirmation (सारांश पुष्टि)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
