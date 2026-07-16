import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileType, CheckCircle, Loader2, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';

const normalizeStr = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

// AI Mapping Dictionary for Smart Detection
const schemas = {
  rd_recipes: {
    product_name: ['productname', 'product', 'name', 'recipe', 'recipename'],
    version: ['version', 'v', 'revision'],
    procedure: ['procedure', 'steps', 'instructions', 'method'],
    cost_per_batch: ['costperbatch', 'cost', 'batchcost'],
    yield_kg: ['yieldkg', 'yield', 'output']
  },
  rd_raw_materials: {
    name: ['name', 'materialname', 'ingredientname', 'material', 'ingredient'],
    inc_name: ['incname', 'inci', 'chemicalname'],
    cas_number: ['casnumber', 'cas', 'casno'],
    supplier: ['supplier', 'vendor', 'source'],
    stock_quantity: ['stockquantity', 'stock', 'qty', 'quantity'],
    unit: ['unit', 'uom', 'measure'],
    unit_price: ['unitprice', 'price', 'cost'],
    min_stock_level: ['minstocklevel', 'minstock', 'reorderlevel']
  },
  rd_cost_calculations: {
    product: ['product', 'item', 'name'],
    ingredient_cost: ['ingredientcost', 'rmcost', 'rawmaterialcost', 'ingredients'],
    packaging_cost: ['packagingcost', 'pmcost', 'packcost', 'packaging'],
    total_cost: ['totalcost', 'cost'],
    margin_percent: ['marginpercent', 'margin', 'profit', 'marginpercentage'],
    selling_price: ['sellingprice', 'price', 'mrp', 'finalprice']
  },
  rd_documents: {
    title: ['title', 'name', 'documentname', 'docname'],
    category: ['category', 'type', 'doctype'],
    file_url: ['fileurl', 'url', 'link', 'filelink', 'driveurl'],
    file_type: ['filetype', 'format', 'ext', 'extension'],
    uploaded_by: ['uploadedby', 'author', 'user', 'owner']
  }
};

export function SmartDataImporter() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{table: string, count: number, mappedCols: string[]} | null>(null);
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
        const rawData = results.data as any[];
        if (rawData.length === 0) {
          toast({ title: "Empty file", variant: "destructive" });
          setIsUploading(false);
          return;
        }

        const uploadedHeaders = Object.keys(rawData[0]);
        let bestMatchTable = '';
        let bestMatchScore = 0;
        let bestMapping: Record<string, string> = {}; // { uploadedHeader: dbColumn }

        // AI Logic: Score each table based on matching headers
        for (const [table, columns] of Object.entries(schemas)) {
          let score = 0;
          let mapping: Record<string, string> = {};

          for (const header of uploadedHeaders) {
            const normHeader = normalizeStr(header);
            // Check which column this header maps to
            for (const [dbCol, synonyms] of Object.entries(columns)) {
              if (synonyms.includes(normHeader)) {
                mapping[header] = dbCol;
                score++;
                break;
              }
            }
          }

          if (score > bestMatchScore) {
            bestMatchScore = score;
            bestMatchTable = table;
            bestMapping = mapping;
          }
        }

        if (bestMatchScore < 2) {
          toast({ 
            title: "AI Detection Failed", 
            description: "Could not confidently detect the data type. Please ensure headers are somewhat descriptive.", 
            variant: "destructive" 
          });
          setIsUploading(false);
          return;
        }

        // Clean & map data
        const cleanedData = rawData.map(row => {
          const newRow: any = {};
          for (const [originalHeader, dbCol] of Object.entries(bestMapping)) {
            let val = row[originalHeader];
            
            // Auto-typecast numbers
            if (val && typeof val === 'string' && val.trim() !== '') {
              // Check if it's a number (stripping out commas/currency)
              const numVal = Number(val.replace(/[^0-9.-]+/g, ""));
              if (!isNaN(numVal) && (dbCol.includes('cost') || dbCol.includes('price') || dbCol.includes('quantity') || dbCol.includes('percent'))) {
                val = numVal;
              }
            }
            newRow[dbCol] = val;
          }
          return newRow;
        });

        try {
          const { error } = await supabase.from(bestMatchTable).insert(cleanedData);
          if (error) throw error;
          
          setResult({ 
            table: bestMatchTable, 
            count: cleanedData.length,
            mappedCols: Object.values(bestMapping)
          });
          toast({ title: "AI Import Successful", description: `Auto-routed ${cleanedData.length} records into ${bestMatchTable}` });
        } catch (err: any) {
          toast({ title: "Database Error", description: err.message, variant: "destructive" });
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
    <Card className="border-t-4 border-t-indigo-500 shadow-lg h-full overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <BrainCircuit className="w-32 h-32 text-indigo-500" />
      </div>
      <CardHeader className="relative z-10">
        <CardTitle className="text-[#032E63] flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-indigo-500" /> 
          AI-Powered Smart Importer
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-sm text-gray-500 mb-6 max-w-xl">
          Drop any CSV file here. Our AI engine will read your headers, figure out what data it is (Cost, Recipes, Materials), format the numbers, and auto-route it to the correct vault!
        </p>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl p-8 text-center hover:bg-indigo-50 cursor-pointer transition-all hover:border-indigo-400 group"
        >
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
              <p className="font-bold text-[#032E63]">AI is Analyzing Data...</p>
              <p className="text-xs text-gray-500 mt-2 animate-pulse">Mapping columns and auto-formatting...</p>
            </div>
          ) : result ? (
            <div className="flex flex-col items-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
              <p className="font-bold text-xl text-[#032E63]">Import Complete!</p>
              <div className="mt-4 p-4 bg-white rounded-lg border shadow-sm w-full max-w-sm text-left">
                <p className="text-sm text-gray-600"><strong>Target System:</strong> {result.table}</p>
                <p className="text-sm text-gray-600"><strong>Records Added:</strong> {result.count}</p>
                <p className="text-sm text-gray-600 mt-2"><strong>AI Mapped Columns:</strong></p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.mappedCols.map(c => (
                    <span key={c} className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
              <Button variant="outline" className="mt-6" onClick={(e) => { e.stopPropagation(); setResult(null); }}>Import Another File</Button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                <Upload className="h-8 w-8 text-indigo-500" />
              </div>
              <h3 className="font-bold text-lg text-gray-800">Click to Upload CSV</h3>
              <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">
                No need to match templates. Just upload your raw data.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
