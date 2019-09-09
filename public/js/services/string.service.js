// Constant that contains all the caracters that needs to be changed with the replacement value
const excludedCharacters = {
  /*
    ['À','Á','Â','Ã','Ä','Å', 'Æ']:'A',
    ['Š','ß' ]:'S',
    ['Ò','Ó','Ô','Õ','Ö','Ø','Œ', 'Ð']:['O','O','O','O','O','O','O','O'],
    ['È','É','Ê','Ë' ]:'E',
    ['Ç']:'C',
    ['Ì','Í','Î','Ï']:'I',
    ['Ù','Ú','Û','Ü']:'U',
    ['Ñ']:'N',
    ['Ÿ']:'Y',
    ['Ž']:'Z',
    ['.','!','@','#','$','^','&','%','*','(',')','+','=','-','[',']','\','/','{','}','|',':','<','>','?',',']:'',
    ["'"]:' ',
    */

  '.': '',

  '\'': ' ',
  '!': ' ',
  '@': ' ',
  '#': ' ',
  $: ' ',
  '^': ' ',
  '&': ' ',
  '%': ' ',
  '*': ' ',
  '(': ' ',
  ')': ' ',
  '+': ' ',
  '=': ' ',
  '-': ' ',
  '[': ' ',
  ']': ' ',
  '\\': ' ',
  '/': ' ',
  '{': ' ',
  '}': ' ',
  '|': ' ',
  ':': ' ',
  '<': ' ',
  '>': ' ',
  '?': ' ',
  ',': ' ',
  š: 's',
  œ: 'o',

  ž: 'z',
  µ: 'u',
  ß: 's',
  à: 'a',
  á: 'a',
  â: 'a',
  ã: 'a',
  ä: 'a',
  å: 'a',
  æ: 'a',
  ç: 'c',
  è: 'e',
  é: 'e',
  ê: 'e',
  ë: 'e',
  ẽ: 'e',
  ì: 'i',
  í: 'i',
  î: 'i',
  ï: 'i',
  ĩ: 'i',
  ð: 'o',
  ñ: 'n',
  ò: 'o',
  ó: 'o',
  ô: 'o',
  õ: 'o',
  ö: 'o',
  ø: 'o',
  ù: 'u',
  ú: 'u',
  û: 'u',
  ü: 'u',
  ý: 'y',
  ÿ: 'y',

  À: 'A',
  Á: 'A',
  Â: 'A',
  Ã: 'A',
  Ä: 'A',
  Å: 'A',
  Ò: 'O',
  Ó: 'O',
  Ô: 'O',
  Õ: 'O',
  Ö: 'O',
  Ø: 'O',
  È: 'E',
  É: 'E',
  Ê: 'E',
  Ë: 'E',
  Ç: 'C',
  Ð: 'D',
  Ì: 'I',
  Í: 'I',
  Î: 'I',
  Ï: 'I',
  Ù: 'U',
  Ú: 'U',
  Û: 'U',
  Ü: 'U',
  Ñ: 'N',
  Š: 'S',
  Ÿ: 'Y',
  Ž: 'Z',
};

angular.module('intia.services.string', [])
  .factory('StringSrv', [
    () => ({
      /**
       * REMOVE ALL ACCENTS AND SPECIAL CHARACTERS OF A WORD GIVEN TO RETURN THE WORD ONLY WITH LETTERS, NUMBER AND SPACES
       *
       * @param {string} word
       * @returns {string} newWord "true" or "false" statement
       */
      normalizeString(word) {
        const result = !word ? '' : word
          .toUpperCase()
          .split('')
          .reduce((newWord, character) => (
            excludedCharacters[character] ? newWord + excludedCharacters[character] : newWord + character
          ));

        return result;
      },

      /**
       * This function get two string and compare if the words of the first one are members of the second
       *
       * @param {string} wordsToLookFor String whose words must be find into the stringToCheck variable
       * @param {string} stringToCheck  String wich has its words being  compared with the wordsToLookFor variable
       * @return {boolean}
       */
      doAllWordsMatch(wordsToLookFor, stringToCheck) {
        if (!wordsToLookFor || !stringToCheck) {
          return false;
        }

        const wordsArray = wordsToLookFor.toString().split(' ');

        for (let i = 0; i < wordsArray.length; i += 1) {
          if (!stringToCheck.includes(wordsArray[i])) {
            return false;
          }
        }

        return true;
      },
    }),
  ]);
