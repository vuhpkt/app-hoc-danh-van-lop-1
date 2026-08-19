/**
 * Vietnamese Parser Adapter / Re-export
 */
export {
  parseVietnamesePhonics,
  tokenizeVietnameseText,
  parseVietnamesePhonics as parseSyllable,
  tokenizeVietnameseText as tokenizeText,
  extractTone,
  extractInitialAndRime,
  generateSpellingFormula,
  LOOKUP_SPECIAL_WORDS,
} from './vietnamesePhonics';
