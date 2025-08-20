/**
 * CSV Parser utility for A/B testing
 * Parses CSV data with Name and Phone Number columns
 */
export class CSVParser {
  /**
   * Parse CSV text data
   * @param {string} csvText - Raw CSV text
   * @returns {Object} - Parsed data with recipients and errors
   */
  static parseCSV(csvText) {
    if (!csvText || !csvText.trim()) {
      return {
        recipients: [],
        errors: ['CSV data is empty'],
        totalRows: 0
      };
    }

    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      return {
        recipients: [],
        errors: ['CSV must have at least a header row and one data row'],
        totalRows: 0
      };
    }

    // Parse header to find Name and Phone Number columns
    const header = lines[0].split(',').map(col => col.trim().replace(/"/g, ''));
    const nameColumnIndex = this.findColumnIndex(header, ['name', 'nama', 'full name', 'customer name']);
    const phoneColumnIndex = this.findColumnIndex(header, ['phone', 'phone number', 'number phone', 'nomor', 'nomor telepon', 'whatsapp', 'hp']);

    if (nameColumnIndex === -1) {
      return {
        recipients: [],
        errors: ['Name column not found. Expected columns: name, nama, full name, customer name'],
        totalRows: lines.length - 1
      };
    }

    if (phoneColumnIndex === -1) {
      return {
        recipients: [],
        errors: ['Phone number column not found. Expected columns: phone, phone number, number phone, nomor, nomor telepon, whatsapp, hp'],
        totalRows: lines.length - 1
      };
    }

    const recipients = [];
    const errors = [];
    
    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCSVLine(lines[i]);
      const rowNumber = i + 1;

      if (row.length <= Math.max(nameColumnIndex, phoneColumnIndex)) {
        errors.push(`Row ${rowNumber}: Not enough columns`);
        continue;
      }

      const name = row[nameColumnIndex]?.trim();
      const phoneNumber = row[phoneColumnIndex]?.trim();

      // Validate name
      if (!name) {
        errors.push(`Row ${rowNumber}: Name is empty`);
        continue;
      }

      // Validate and normalize phone number
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      if (!normalizedPhone) {
        errors.push(`Row ${rowNumber}: Invalid phone number "${phoneNumber}"`);
        continue;
      }

      // Check for duplicates
      const existingRecipient = recipients.find(r => r.phoneNumber === normalizedPhone);
      if (existingRecipient) {
        errors.push(`Row ${rowNumber}: Duplicate phone number "${normalizedPhone}" (first seen with name "${existingRecipient.name}")`);
        continue;
      }

      recipients.push({
        name: name,
        phoneNumber: normalizedPhone,
        originalPhone: phoneNumber
      });
    }

    return {
      recipients,
      errors,
      totalRows: lines.length - 1,
      processedRows: recipients.length,
      nameColumn: header[nameColumnIndex],
      phoneColumn: header[phoneColumnIndex]
    };
  }

  /**
   * Parse a single CSV line handling quoted values
   * @param {string} line - CSV line
   * @returns {Array} - Array of values
   */
  static parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i - 1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i + 1] === ',')) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Find column index by multiple possible names (case insensitive)
   * @param {Array} header - Header array
   * @param {Array} possibleNames - Possible column names
   * @returns {number} - Column index or -1 if not found
   */
  static findColumnIndex(header, possibleNames) {
    for (let i = 0; i < header.length; i++) {
      const columnName = header[i].toLowerCase().trim();
      if (possibleNames.some(name => columnName.includes(name.toLowerCase()))) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Normalize phone number to international format
   * @param {string} phone - Raw phone number
   * @returns {string|null} - Normalized phone number or null if invalid
   */
  static normalizePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
      return null;
    }

    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    if (!cleaned) {
      return null;
    }

    // Handle Indonesian numbers
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    } else if (!cleaned.startsWith('62') && !cleaned.startsWith('+')) {
      // Assume it's a local number without country code
      cleaned = '62' + cleaned;
    }

    // Remove leading + if present
    cleaned = cleaned.replace(/^\+/, '');

    // Validate length (Indonesian numbers should be 10-15 digits total)
    if (cleaned.length < 10 || cleaned.length > 15) {
      return null;
    }

    // Add + prefix for international format
    return '+' + cleaned;
  }

  /**
   * Validate CSV file format
   * @param {File} file - File object
   * @returns {Object} - Validation result
   */
  static validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }

    // Check file type
    if (!file.type.includes('csv') && !file.name.toLowerCase().endsWith('.csv')) {
      errors.push('File must be a CSV file');
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.push('File size must be less than 5MB');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate sample CSV format
   * @returns {string} - Sample CSV content
   */
  static generateSampleCSV() {
    return `Name,Phone Number
John Doe,+62812345678901
Jane Smith,081234567890
Budi Santoso,08987654321
Siti Nurhaliza,+6285555555555`;
  }

  /**
   * Get expected column names as formatted string
   * @returns {Object} - Expected column names
   */
  static getExpectedColumns() {
    return {
      name: ['name', 'nama', 'full name', 'customer name'],
      phone: ['phone', 'phone number', 'number phone', 'nomor', 'nomor telepon', 'whatsapp', 'hp']
    };
  }
}