// Organization validation utilities
// Add validation rules for organization numbers

export interface OrganizationValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates organization number format
 * Currently supports basic format validation
 * Can be extended to support specific formats for different organization types
 */
export function validateOrganizationNumber(organizationNumber: string): OrganizationValidationResult {
  if (!organizationNumber || organizationNumber.trim() === '') {
    return { isValid: true }; // Optional field
  }

  const trimmedNumber = organizationNumber.trim();

  // Basic format validation - adjust as needed for your requirements
  const validPatterns = [
    /^REG\d{6,12}$/i,           // Registration format: REG123456789
    /^KRA\d{6,12}$/i,           // KRA format: KRA123456789
    /^VAT\d{6,12}$/i,           // VAT format: VAT123456789
    /^[A-Z]{2,4}\d{6,12}$/i,    // Generic format: ABC123456789
    /^\d{6,12}$/,               // Numeric only: 123456789
  ];

  const isValidFormat = validPatterns.some(pattern => pattern.test(trimmedNumber));

  if (!isValidFormat) {
    return {
      isValid: false,
      error: 'Organization number must be in a valid format (e.g., REG123456789, KRA123456789, or numeric)'
    };
  }

  // Length validation
  if (trimmedNumber.length < 6 || trimmedNumber.length > 15) {
    return {
      isValid: false,
      error: 'Organization number must be between 6 and 15 characters'
    };
  }

  return { isValid: true };
}

/**
 * Validates organization name
 */
export function validateOrganizationName(organizationName: string): OrganizationValidationResult {
  if (!organizationName || organizationName.trim() === '') {
    return { isValid: true }; // Optional field
  }

  const trimmedName = organizationName.trim();

  if (trimmedName.length < 2) {
    return {
      isValid: false,
      error: 'Organization name must be at least 2 characters long'
    };
  }

  if (trimmedName.length > 100) {
    return {
      isValid: false,
      error: 'Organization name must be less than 100 characters'
    };
  }

  // Basic format validation - only letters, numbers, spaces, and common punctuation
  const validNamePattern = /^[a-zA-Z0-9\s\-\.&'()]+$/;
  if (!validNamePattern.test(trimmedName)) {
    return {
      isValid: false,
      error: 'Organization name contains invalid characters'
    };
  }

  return { isValid: true };
}

/**
 * Combined validation for organization fields
 */
export function validateOrganizationFields(organization?: string, organizationNumber?: string): OrganizationValidationResult {
  const nameValidation = validateOrganizationName(organization || '');
  if (!nameValidation.isValid) {
    return nameValidation;
  }

  const numberValidation = validateOrganizationNumber(organizationNumber || '');
  if (!numberValidation.isValid) {
    return numberValidation;
  }

  // If organization number is provided, organization name should also be provided
  if (organizationNumber && organizationNumber.trim() && (!organization || organization.trim() === '')) {
    return {
      isValid: false,
      error: 'Organization name is required when organization number is provided'
    };
  }

  return { isValid: true };
}

/**
 * Format organization number for display
 */
export function formatOrganizationNumber(organizationNumber: string): string {
  if (!organizationNumber) return '';
  
  const trimmed = organizationNumber.trim().toUpperCase();
  
  // Add formatting based on pattern
  if (/^[A-Z]{2,4}\d+$/.test(trimmed)) {
    // Format like REG123456789 -> REG-123456789
    const match = trimmed.match(/^([A-Z]{2,4})(\d+)$/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
  }
  
  return trimmed;
}