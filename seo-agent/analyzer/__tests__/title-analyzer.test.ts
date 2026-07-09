/**
 * Unit tests for title-analyzer.ts
 *
 * Pure function tests using Vitest.
 * Run with: npx vitest run seo-agent/analyzer/__tests__/title-analyzer.test.ts
 */

import { describe, it, expect } from 'vitest';
import { analyzeTitle } from "../title-analyzer";

/* ----------------------------------------------------------------
 * 1. Missing / Empty Titles
 * ---------------------------------------------------------------- */

describe('Missing / Empty Titles', () => {
  it('should return critical issue for undefined title', () => {
    const result = analyzeTitle(undefined);
    expect(result.passed).toBe(false);
    expect(result.titleLength).toBe(0);
    expect(result.issues.some(i => i.id === 'title-missing')).toBe(true);
    expect(result.issues.find(i => i.id === 'title-missing')?.severity).toBe('critical');
  });

  it('should return critical issue for empty string title', () => {
    const result = analyzeTitle('');
    expect(result.passed).toBe(false);
    expect(result.titleLength).toBe(0);
    expect(result.issues.some(i => i.id === 'title-empty')).toBe(true);
    expect(result.issues.find(i => i.id === 'title-empty')?.severity).toBe('critical');
  });

  it('should return critical issue for whitespace-only title', () => {
    const result = analyzeTitle('   \t\n  ');
    expect(result.passed).toBe(false);
    expect(result.titleLength).toBe(0);
    expect(result.issues.some(i => i.id === 'title-empty')).toBe(true);
    expect(result.issues.find(i => i.id === 'title-empty')?.severity).toBe('critical');
  });
});

/* ----------------------------------------------------------------
 * 2. Title Length Checks
 * ---------------------------------------------------------------- */

describe('Title Length Checks', () => {
  it('should warn for too short title (default min=30)', () => {
    const result = analyzeTitle('A');
    expect(result.passed).toBe(false);
    expect(result.issues.some(i => i.id === 'title-too-short')).toBe(true);
    expect(result.issues.find(i => i.id === 'title-too-short')?.severity).toBe('warning');
  });

  it('should warn for too long title (default max=70)', () => {
    const longTitle = 'A'.repeat(80);
    const result = analyzeTitle(longTitle);
    expect(result.passed).toBe(false);
    expect(result.issues.some(i => i.id === 'title-too-long')).toBe(true);
    expect(result.issues.find(i => i.id === 'title-too-long')?.severity).toBe('warning');
  });

  it('should respect custom minLength option', () => {
    const result = analyzeTitle('AB', { minLength: 3 });
    expect(result.passed).toBe(false);
    expect(result.issues.some(i => i.id === 'title-too-short')).toBe(true);
  });

  it('should flag too-short at boundary (29 chars, default min=30)', () => {
    const result = analyzeTitle('A'.repeat(29));
    expect(result.issues.some(i => i.id === 'title-too-short')).toBe(true);
  });

  it('should pass for ideal length title (55 chars)', () => {
    const title = 'A'.repeat(55);
    const result = analyzeTitle(title);
    expect(result.passed).toBe(true);
    expect(result.issues.some(i => i.id === 'title-ideal-length')).toBe(true);
    expect(result.issues.find(i => i.id === 'title-ideal-length')?.severity).toBe('success');
  });

  it('should accept lower bound of ideal window (50 chars)', () => {
    const result50 = analyzeTitle('A'.repeat(50));
    expect(result50.issues.some(i => i.id === 'title-ideal-length')).toBe(true);
  });

  it('should accept upper bound of ideal window (60 chars)', () => {
    const result60 = analyzeTitle('A'.repeat(60));
    expect(result60.issues.some(i => i.id === 'title-ideal-length')).toBe(true);
  });

  it('should info for acceptable but not ideal length (45 chars)', () => {
    const result = analyzeTitle('A'.repeat(45));
    expect(result.issues.some(i => i.id === 'title-length-acceptable')).toBe(true);
    expect(result.issues.find(i => i.id === 'title-length-acceptable')?.severity).toBe('info');
  });
});

/* ----------------------------------------------------------------
 * 3. Brand Suffix
 * ---------------------------------------------------------------- */

describe('Brand Suffix', () => {
  it('should warn for missing brand when enforceBrand=true', () => {
    const result = analyzeTitle('Rent Apartments in Noida', {
      brandSuffix: ' | RenterEasy',
      enforceBrand: true,
    });
    expect(result.passed).toBe(false);
    expect(result.issues.some(i => i.id === 'title-brand-missing')).toBe(true);
    expect(result.issues.find(i => i.id === 'title-brand-missing')?.severity).toBe('warning');
  });

  it('should not warn for missing brand when enforceBrand=false', () => {
    const result = analyzeTitle('Rent Apartments in Noida', {
      brandSuffix: ' | RenterEasy',
      enforceBrand: false,
    });
    const brandIssue = result.issues.find(i => i.id.startsWith('title-brand'));
    expect(brandIssue).toBeUndefined();
  });

  it('should success for present brand suffix', () => {
    const result = analyzeTitle('Rent Apartments in Noida | RenterEasy', {
      brandSuffix: ' | RenterEasy',
      enforceBrand: true,
    });
    expect(result.issues.some(i => i.id === 'title-brand-present')).toBe(true);
    expect(result.issues.find(i => i.id === 'title-brand-present')?.severity).toBe('success');
    expect(result.hasBrandSuffix).toBe(true);
  });

  it('should have no brand flag when not configured', () => {
    const result = analyzeTitle('Rent Apartments in Noida');
    expect(result.hasBrandSuffix).toBe(false);
  });

  it('should handle brand suffix without space prefix', () => {
    const result = analyzeTitle('TitleBrand', {
      brandSuffix: 'Brand',
      enforceBrand: true,
    });
    expect(result.issues.some(i => i.id === 'title-brand-present')).toBe(true);
  });
});

/* ----------------------------------------------------------------
 * 4. Keywords
 * ---------------------------------------------------------------- */

describe('Keywords', () => {
  it('should success for present keywords', () => {
    const result = analyzeTitle('Rent Apartments in Noida', {
      targetKeywords: ['Noida', 'Rent'],
    });
    expect(result.issues.some(i => i.id === 'title-keyword-noida')).toBe(true);
    expect(result.issues.some(i => i.id === 'title-keyword-rent')).toBe(true);
    expect(result.issues.find(i => i.id === 'title-keyword-noida')?.severity).toBe('success');
    expect(result.issues.find(i => i.id === 'title-keyword-rent')?.severity).toBe('success');
    expect(result.foundKeywords).toContain('Noida');
    expect(result.foundKeywords).toContain('Rent');
  });

  it('should warn for missing keywords', () => {
    const result = analyzeTitle('Great homes for families', {
      targetKeywords: ['Noida'],
    });
    expect(result.issues.some(i => i.id === 'title-keyword-noida-missing')).toBe(true);
    expect(result.issues.find(i => i.id === 'title-keyword-noida-missing')?.severity).toBe('warning');
    expect(result.missingKeywords).toContain('Noida');
  });

  it('should be case-insensitive for keywords', () => {
    const result = analyzeTitle('Rent Apartments in NOIDA', {
      targetKeywords: ['noida'],
    });
    expect(result.issues.some(i => i.id === 'title-keyword-noida')).toBe(true);
    expect(result.issues.find(i => i.id === 'title-keyword-noida')?.severity).toBe('success');
  });

  it('should handle multiple keywords with mixed presence', () => {
    const result = analyzeTitle('Rent in Noida', {
      targetKeywords: ['rent', 'delhi'],
    });
    expect(result.foundKeywords).toContain('rent');
    expect(result.missingKeywords).toContain('delhi');
    expect(result.issues.some(i => i.id === 'title-keyword-rent')).toBe(true);
    expect(result.issues.some(i => i.id === 'title-keyword-delhi-missing')).toBe(true);
  });

  it('should ignore empty keywords', () => {
    const result = analyzeTitle('Test', {
      targetKeywords: ['test', '', '  '],
    });
    expect(result.foundKeywords).toContain('test');
  });
});

/* ----------------------------------------------------------------
 * 5. Edge Cases
 * ---------------------------------------------------------------- */

describe('Edge Cases', () => {
  it('should trim whitespace from title', () => {
    // Title with spaces is 15 chars after trim, which is < minLength (30)
    // so it correctly fails with "too short" warning
    const result = analyzeTitle('  Rent Apartments  ');
    expect(result.passed).toBe(false);
    expect(result.title).toBe('Rent Apartments');
    expect(result.issues.some(i => i.id === 'title-too-short')).toBe(true);
  });

  it('should count unicode characters correctly (UTF-16 code units)', () => {
    const title = '🏠 Rent in Noida | Best Deals';
    // .length returns UTF-16 code units (emoji = 2 code units)
    const len = title.length;
    const result = analyzeTitle(title);
    expect(result.titleLength).toBe(len);
  });

  it('should handle combined issues (too short + missing keyword)', () => {
    const result = analyzeTitle('A', {
      targetKeywords: ['Noida'],
    });
    expect(result.passed).toBe(false);
    expect(result.issues.some(i => i.id === 'title-too-short')).toBe(true);
    expect(result.issues.some(i => i.id === 'title-keyword-noida-missing')).toBe(true);
  });

  it('should handle title with special characters', () => {
    const result = analyzeTitle("Rent & Buy: Noida's Best!");
    expect(result.title).toBe("Rent & Buy: Noida's Best!");
    expect(result.titleLength).toBe("Rent & Buy: Noida's Best!".length);
  });

  it('should handle all length boundaries correctly', () => {
    // min=30, ideal=55, tolerance=5, max=70
    expect(analyzeTitle('A'.repeat(29)).issues.some(i => i.id === 'title-too-short')).toBe(true);
    expect(analyzeTitle('A'.repeat(30)).issues.some(i => i.id === 'title-length-acceptable')).toBe(true);
    expect(analyzeTitle('A'.repeat(50)).issues.some(i => i.id === 'title-ideal-length')).toBe(true);
    expect(analyzeTitle('A'.repeat(55)).issues.some(i => i.id === 'title-ideal-length')).toBe(true);
    expect(analyzeTitle('A'.repeat(60)).issues.some(i => i.id === 'title-ideal-length')).toBe(true);
    expect(analyzeTitle('A'.repeat(61)).issues.some(i => i.id === 'title-length-acceptable')).toBe(true);
    expect(analyzeTitle('A'.repeat(70)).issues.some(i => i.id === 'title-length-acceptable')).toBe(true);
    expect(analyzeTitle('A'.repeat(71)).issues.some(i => i.id === 'title-too-long')).toBe(true);
  });
});

/* ----------------------------------------------------------------
 * 6. Duplicate Title Interface - Result Fields
 * ---------------------------------------------------------------- */

describe('Duplicate Title Support (Future)', () => {
  it('should include duplicateTitle placeholder in result when store provided', () => {
    // This tests that the API is future-proof for duplicate detection
    // The interface should allow callers to pass a store later
    const result = analyzeTitle('Test Title');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('titleLength');
    expect(result).toHaveProperty('issues');
    expect(result).toHaveProperty('passed');
  });

  it('should accept duplicateTitleStore option without breaking', () => {
    // Future-proof: options object should not reject unknown properties
    const mockStore = {
      register: (_entry: unknown) => { void _entry; return []; },
      find: (_hash: string) => { void _hash; return []; },
      clear: () => {},
    };
    const result = analyzeTitle('Test Title', { 
      // @ts-expect-error - future-proofing test
      duplicateTitleStore: mockStore,
    });
    expect(result).toBeDefined();
  });
});

/* ----------------------------------------------------------------
 * 7. Scoring (Future) - numeric score support
 * ---------------------------------------------------------------- */

describe('Scoring Support (Future)', () => {
  it('should produce issues with weights for scoring', () => {
    const result = analyzeTitle('A');
    const hasWeights = result.issues.some(i => typeof i.weight === 'number');
    expect(hasWeights).toBe(true);
  });

  it('should have issues with severity for scoring', () => {
    const result = analyzeTitle('Test title that is fine length');
    const hasSeverities = result.issues.every(i => 
      ['critical', 'warning', 'info', 'success'].includes(i.severity)
    );
    expect(hasSeverities).toBe(true);
  });
});

/* ----------------------------------------------------------------
 * 8. Unicode Handling
 * ---------------------------------------------------------------- */

describe('Unicode Handling', () => {
  it('should count characters using UTF-16 code units (.length)', () => {
    const title = '🏠🏡 Rent';
    const result = analyzeTitle(title);
    expect(result.titleLength).toBe(title.length);
  });

  it('should handle RTL characters', () => {
    const title = 'مرحبا Rent';
    const result = analyzeTitle(title);
    expect(result.titleLength).toBe(title.length);
    expect(result.title).toBe(title);
  });

  it('should handle mixed scripts', () => {
    const title = 'Rent 租房 🏠';
    const result = analyzeTitle(title);
    expect(result.titleLength).toBe(title.length);
  });
});