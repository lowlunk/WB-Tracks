import XLSX from 'xlsx';
import { storage } from './storage';
import path from 'path';
import fs from 'fs/promises';

export interface InventoryIngestionRecord {
  partNumber: string;
  description?: string;
  quantity: number;
  location?: string;
  category?: string;
  supplier?: string;
  unitPrice?: number;
  notes?: string;
}

export interface IngestionResult {
  success: boolean;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{
    row: number;
    partNumber: string;
    error: string;
  }>;
  summary: {
    newComponents: string[];
    updatedComponents: string[];
    totalValue?: number;
  };
}

export class InventoryIngestionService {
  
  /**
   * Process Excel or CSV file for inventory ingestion
   */
  async processInventoryFile(filePath: string, options: {
    skipZeroQuantity?: boolean;
    defaultLocation?: string;
    userId?: number;
  } = {}): Promise<IngestionResult> {
    const result: IngestionResult = {
      success: false,
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      summary: {
        newComponents: [],
        updatedComponents: [],
        totalValue: 0
      }
    };

    try {
      const fileExt = path.extname(filePath).toLowerCase();
      let records: InventoryIngestionRecord[] = [];

      if (fileExt === '.xlsx' || fileExt === '.xls') {
        records = await this.parseExcelFile(filePath);
      } else if (fileExt === '.csv') {
        records = await this.parseCSVFile(filePath);
      } else {
        throw new Error('Unsupported file format. Please use Excel (.xlsx, .xls) or CSV files.');
      }

      console.log(`Parsed ${records.length} records from file`);

      // Get default location for main inventory
      const mainLocation = await storage.getLocationsByFacility(1);
      const defaultLocationId = mainLocation.find(loc => 
        loc.name.toLowerCase().includes('main') || loc.name.toLowerCase().includes('inventory')
      )?.id || mainLocation[0]?.id;

      if (!defaultLocationId) {
        throw new Error('No inventory location found. Please create a main inventory location first.');
      }

      // Process each record
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        result.processed++;

        try {
          // Skip zero quantity items if requested
          if (options.skipZeroQuantity && record.quantity <= 0) {
            result.skipped++;
            continue;
          }

          // Clean and validate part number
          const partNumber = this.cleanPartNumber(record.partNumber);
          if (!partNumber) {
            result.errors.push({
              row: i + 1,
              partNumber: record.partNumber,
              error: 'Invalid or empty part number'
            });
            continue;
          }

          // Check if component exists
          let component = await storage.getComponentByNumber(partNumber);
          
          if (!component) {
            // Create new component
            component = await storage.createComponent({
              componentNumber: partNumber,
              description: record.description || partNumber,
              category: record.category || 'General',
              supplier: record.supplier || '',
              unitPrice: record.unitPrice || 0,
              minStockLevel: 5, // Default minimum stock level
              maxStockLevel: 100, // Default maximum stock level
              isActive: true
            }, options.userId);

            result.created++;
            result.summary.newComponents.push(partNumber);
            console.log(`Created new component: ${partNumber}`);
          }

          // Update or create inventory record
          const existingInventory = await storage.getInventoryItem(component.id, defaultLocationId);
          
          if (existingInventory) {
            // Update existing inventory
            await storage.updateInventoryQuantity(component.id, defaultLocationId, record.quantity);
            result.updated++;
            result.summary.updatedComponents.push(partNumber);
            
            // Record transaction for inventory adjustment
            if (existingInventory.quantity !== record.quantity) {
              const difference = record.quantity - existingInventory.quantity;
              if (difference > 0) {
                await storage.addItemsToInventory(
                  component.id, 
                  defaultLocationId, 
                  difference, 
                  `Inventory ingestion - added ${difference} units`
                );
              } else if (difference < 0) {
                await storage.removeItemsFromInventory(
                  component.id, 
                  defaultLocationId, 
                  Math.abs(difference), 
                  `Inventory ingestion - removed ${Math.abs(difference)} units`
                );
              }
            }
          } else {
            // Create new inventory record
            if (record.quantity > 0) {
              await storage.addItemsToInventory(
                component.id, 
                defaultLocationId, 
                record.quantity, 
                'Initial inventory ingestion'
              );
              result.updated++;
              result.summary.updatedComponents.push(partNumber);
            }
          }

          // Calculate total value
          if (record.unitPrice && record.quantity > 0) {
            result.summary.totalValue = (result.summary.totalValue || 0) + (record.unitPrice * record.quantity);
          }

        } catch (error: any) {
          result.errors.push({
            row: i + 1,
            partNumber: record.partNumber,
            error: error.message
          });
          console.error(`Error processing row ${i + 1}:`, error);
        }
      }

      result.success = result.errors.length < records.length;
      console.log(`Ingestion completed: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.errors.length} errors`);

      return result;
    } catch (error: any) {
      console.error('Inventory ingestion failed:', error);
      result.errors.push({
        row: 0,
        partNumber: 'N/A',
        error: error.message
      });
      return result;
    }
  }

  /**
   * Parse Excel file to inventory records
   */
  private async parseExcelFile(filePath: string): Promise<InventoryIngestionRecord[]> {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with header row detection
    const rawData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      blankrows: false
    });

    if (rawData.length === 0) {
      throw new Error('Excel file is empty');
    }

    // Auto-detect headers
    const headers = rawData[0] as string[];
    const dataRows = rawData.slice(1) as any[][];

    return this.mapRowsToRecords(headers, dataRows);
  }

  /**
   * Parse CSV file to inventory records
   */
  private async parseCSVFile(filePath: string): Promise<InventoryIngestionRecord[]> {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );

    return this.mapRowsToRecords(headers, dataRows);
  }

  /**
   * Map raw rows to structured inventory records
   */
  private mapRowsToRecords(headers: string[], dataRows: any[][]): InventoryIngestionRecord[] {
    // Common header variations mapping
    const headerMap = this.createHeaderMap(headers);

    return dataRows.map(row => {
      const record: InventoryIngestionRecord = {
        partNumber: '',
        quantity: 0
      };

      // Map each column based on detected headers
      headers.forEach((header, index) => {
        const value = row[index]?.toString().trim() || '';
        const mappedField = headerMap[header.toLowerCase()];

        if (mappedField && value) {
          switch (mappedField) {
            case 'partNumber':
              record.partNumber = value;
              break;
            case 'description':
              record.description = value;
              break;
            case 'quantity':
              record.quantity = this.parseNumber(value);
              break;
            case 'location':
              record.location = value;
              break;
            case 'category':
              record.category = value;
              break;
            case 'supplier':
              record.supplier = value;
              break;
            case 'unitPrice':
              record.unitPrice = this.parseNumber(value);
              break;
            case 'notes':
              record.notes = value;
              break;
          }
        }
      });

      return record;
    }).filter(record => record.partNumber); // Filter out records without part numbers
  }

  /**
   * Create header mapping for flexible column detection
   */
  private createHeaderMap(headers: string[]): Record<string, string> {
    const map: Record<string, string> = {};

    headers.forEach(header => {
      const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Part number variations
      if (normalized.match(/(part|item|component|sku|product).*num(ber)?/)) {
        map[header.toLowerCase()] = 'partNumber';
      } else if (normalized === 'partno' || normalized === 'partnumber' || normalized === 'itemno') {
        map[header.toLowerCase()] = 'partNumber';
      }
      
      // Description variations
      else if (normalized.match(/(desc|description|name|title)/)) {
        map[header.toLowerCase()] = 'description';
      }
      
      // Quantity variations
      else if (normalized.match(/(qty|quantity|count|stock|onhand|available)/)) {
        map[header.toLowerCase()] = 'quantity';
      }
      
      // Location variations
      else if (normalized.match(/(loc|location|warehouse|bin|shelf)/)) {
        map[header.toLowerCase()] = 'location';
      }
      
      // Category variations
      else if (normalized.match(/(cat|category|type|class)/)) {
        map[header.toLowerCase()] = 'category';
      }
      
      // Supplier variations
      else if (normalized.match(/(supplier|vendor|manufacturer|brand)/)) {
        map[header.toLowerCase()] = 'supplier';
      }
      
      // Price variations
      else if (normalized.match(/(price|cost|unitprice|unitcost)/)) {
        map[header.toLowerCase()] = 'unitPrice';
      }
      
      // Notes variations
      else if (normalized.match(/(note|notes|comment|remarks)/)) {
        map[header.toLowerCase()] = 'notes';
      }
    });

    return map;
  }

  /**
   * Clean and standardize part numbers
   */
  private cleanPartNumber(partNumber: string): string {
    if (!partNumber) return '';
    
    return partNumber
      .toString()
      .trim()
      .toUpperCase()
      .replace(/[^\w-]/g, '') // Keep only alphanumeric and hyphens
      .replace(/^0+/, '') // Remove leading zeros
      .substring(0, 50); // Limit length
  }

  /**
   * Parse numeric values safely
   */
  private parseNumber(value: string): number {
    if (!value) return 0;
    
    const cleaned = value.toString().replace(/[,$]/g, '');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Get template for Excel import
   */
  static getImportTemplate(): Array<Record<string, any>> {
    return [
      {
        'Part Number': 'ABC123',
        'Description': 'Sample Component Description',
        'Quantity': 100,
        'Location': 'Main Inventory',
        'Category': 'Electronics',
        'Supplier': 'Supplier Name',
        'Unit Price': 12.50,
        'Notes': 'Optional notes'
      },
      {
        'Part Number': 'XYZ789',
        'Description': 'Another Component',
        'Quantity': 50,
        'Location': 'Main Inventory',
        'Category': 'Mechanical',
        'Supplier': 'Another Supplier',
        'Unit Price': 25.00,
        'Notes': ''
      }
    ];
  }
}

export const inventoryIngestion = new InventoryIngestionService();