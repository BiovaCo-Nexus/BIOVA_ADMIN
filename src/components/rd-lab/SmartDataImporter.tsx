import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileType, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';

export function SmartDataImporter() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{table: string, count: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        if (data.length === 0) {
          toast({ title: "Empty file", variant: "destructive" });
          setIsUploading(false);
          return;
        }

        const headers = Object.keys(data[0]).map(h => h.toLowerCase().trim());
        let targetTable = '';

        // Intelligent routing logic based on headers
        if (headers.includes('product_name') && headers.includes('version')) {
          targetTable = 'rd_recipes';
        } else if (headers.includes('name') && headers.includes('cas_number')) {
          targetTable = 'rd_raw_materials'; 
        } else if (headers.includes('total_cost') || headers.includes('margin_percent')) {
          targetTable = 'rd_cost_calculations';
        } else if (headers.includes('file_url') && headers.includes('category')) {
          targetTable = 'rd_documents';
        } else if (headers.includes('name') && headers.includes('contact_person')) {
          targetTable = 'rd_suppliers'; 
        } else {
          toast({ 
            title: "Unrecognized Data Format", 
            description: "Could not auto-detect the destination for this CSV. Please check your columns.", 
            variant: "destructive" 
          });
          setIsUploading(false);
          return;
        }

        try {
          const { error } = await supabase.from(targetTable).insert(data);
          if (error) throw error;
          
          setResult({ table: targetTable, count: data.length });
          toast({ title: "Smart Import Successful", description: `Successfully imported ${data.length} records into ${targetTable}` });
        } catch (err: any) {
          toast({ title: "Import Failed", description: err.message, variant: "destructive" });
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (err) => {
        toast({ title: "Error reading file", description: err.message, variant: "destructive" });
        setIsUploading(false);
      }
    });
  };

  return (
    <Card className="border-t-4 border-t-[#08A04B] shadow-lg h-full">
      <CardHeader>
        <CardTitle className="text-[#032E63] flex items-center gap-2">
          <Upload className="h-5 w-5" /> Universal Smart Importer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">
          Upload any CSV file. The system will automatically detect the data type (Recipes, Materials, Suppliers, Cost Calc, Docs) and route it to the correct database table!
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 text-[#08A04B] animate-spin mb-3" />
              <p className="font-medium text-[#032E63]">Analyzing & Importing Data...</p>
            </div>
          ) : result ? (
            <div className="flex flex-col items-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
              <p className="font-bold text-[#032E63]">Import Complete!</p>
              <p className="text-sm text-gray-600 mt-1">Routed {result.count} records to <strong>{result.table}</strong></p>
              <Button variant="outline" className="mt-4" onClick={() => setResult(null)}>Upload Another</Button>
            </div>
          ) : (
            <div className="flex flex-col items-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="bg-blue-50 p-4 rounded-full mb-3">
                <FileType className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-700">Click to Browse CSV</h3>
              <p className="text-xs text-gray-400 mt-1">Supports auto-routing based on column headers</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
