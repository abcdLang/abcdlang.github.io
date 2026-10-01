// @ts-check

/**
 * @type {Record<string, number>}
 * @description dictionnary instrument name to MIDI id
 */
export const instrumentToMIDITable = {
  "piano": 1,
  "harpsichord": 7,
  "clavinet": 8,
  "celesta": 9,
  "glockenspiel": 10,
  "vibraphone": 12,
  "marimba": 13,
  "xylophone": 14,
  "guitar": 25,
  "violin": 41,
  "viola": 42,
  "cello": 43,
  "contrabass": 44,
  "trumpet": 57,
  "trombone": 58,
  "tuba": 59,
  "oboe": 69,
  "bassoon": 71,
  "clarinet": 72,
  "piccolo": 73,
  "flute": 74,
  "recorder": 75,
  "whistle": 79,
  "ocarina": 80,
  "bass": 54,
  "soprano": 53,
  "tenor": 53
}




/**
 * @type {Object.<string, string>}
 * @description Correspondance ABCD to ABC
 */
export const clefsDictionnary = {
  "[K:treble]": "[K:treble]",
  "[K:bass]": "[K:bass]",
  "[K:treble-8]": "[K:treble-8]",
  "[K:bass-8]": "[K:bass-8]",
  "[K:treble+8]": "[K:treble+8]",
  "[K:bass+8]": "[K:bass+8]",
  "𝄢": "[K:bass]",
  "𝄣": "[K:bass+8]",
  "𝄤": "[K:bass-8]",
  "f:": "[K:bass]",
  "𝄞": "[K:treble]",
  "𝄡": "[K:alto]",
  "𝄟": "[K:treble+8]",
  "𝄠": "[K:treble-8]",
  "g:": "[K:treble]",
  "𝄞8": "[K:treble-8]",
  "g8:": "[K:treble-8]",
  "𝄞-8": "[K:treble-8]",
  "g-8:": "[K:treble-8]",
  "𝄞+8": "[K:treble+8]",
  "g+8:": "[K:treble+8]",
}



export const dictionnaryABCDtoABC = {
  "tr": "!trill!",

}


/**
 * @type {Record<string, string>}
 * @description dictionnary instrument name to standard key for playing that instrument
 * if not present, by default it is 𝄞
 */
export const instrumentToStandardKey = {
  "cello": "𝄢"
}

export const utf8AccidentalSymbols = [
  {
    utf8: "𝄫",
    description: "Musical symbol double flat",
    accidental: -2
  },
  {
    utf8: "♭",
    description: "Musical symbol flat",
    accidental: -1
  },
  {
    utf8: "♮",
    description: "Musical symbol natural",
    accidental: 0
  },
  {
    utf8: "♯",
    description: "Musical symbol sharp",
    accidental: 1
  },
  {
    utf8: "𝄪",
    description: "Musical symbol double sharp",
    accidental: 2
  }
];

export const utf8ClefSymbols = [
  {
    utf8: "𝄞",
    description: "Musical symbol g clef"
  },
  {
    utf8: "𝄟",
    description: "Musical symbol g clef ottava alta"
  },
  {
    utf8: "𝄠",
    description: "Musical symbol g clef ottava bassa"
  },
  {
    utf8: "𝄡",
    description: "Musical symbol c clef"
  },
  {
    utf8: "𝄢",
    description: "Musical symbol f clef"
  },
  {
    utf8: "𝄣",
    description: "Musical symbol f clef ottava alta"
  },
  {
    utf8: "𝄤",
    description: "Musical symbol f clef ottava bassa"
  }
];


export const utf8DurationSymbols = [
  {
    utf8: "𝅜",
    description: "Musical Symbol Breve",
    duration: 2
  },
  {
    utf8: "𝅝",
    description: "Musical Symbol Whole Note",
    duration: 1
  },
  {
    utf8: "𝅗𝅥",
    description: "Musical Symbol Half Note",
    duration: 0.5
  },
  {
    utf8: "𝅘𝅥",
    description: "Musical Symbol Quarter Note",
    duration: 0.25
  },
  {
    utf8: "𝅘𝅥𝅮",
    description: "Musical Symbol Eighth Note",
    duration: 0.125
  },
  {
    utf8: "𝅘𝅥𝅯",
    description: "Musical Symbol Sixteenth Note",
    duration: 0.0625
  },
  {
    utf8: "𝅘𝅥𝅰",
    description: "Musical Symbol Thirty-Second Note",
    duration: 0.03125
  },
  {
    utf8: "𝅘𝅥𝅱",
    description: "Musical Symbol Sixty-Fourth Note",
    duration: 0.015625
  },
  {
    utf8: "𝅘𝅥𝅱",
    description: "Musical Symbol 128th Note",
    duration: 0.0078125
  }
];


export const utf8RestSymbols = [
  {
    utf8: "𝄺",
    description: "musical symbol breve rest",
    duration: 2
  },
  {
    utf8: "𝄻",
    description: "musical symbol whole rest",
    duration: 1
  },
  {
    utf8: "𝄼",
    description: "musical symbol half rest",
    duration: 0.5
  },
  {
    utf8: "𝄽",
    description: "musical symbol quarter rest",
    duration: 0.25
  },
  {
    utf8: "𝄾",
    description: "musical symbol eighth rest",
    duration: 0.125
  },
  {
    utf8: "𝄿",
    description: "musical symbol sixteenth rest",
    duration: 0.0625
  },
  {
    utf8: "𝅀",
    description: "musical symbol thirty-second rest",
    duration: 0.03125
  },
  {
    utf8: "𝅁",
    description: "musical symbol sixty-fourth rest",
    duration: 0.015625
  },
  {
    utf8: "𝅂",
    description: "musical symbol 128th rest",
    duration: 0.0078125
  }
];

export const utf8DynamicSymbols = [
  {
    utf8: "𝆏𝆏𝆏𝆏",
    abc: "!pppp!",
    description: "pianississimo"
  },
  {
    utf8: "𝆏𝆏𝆏",
    abc: "!ppp!",
    description: "pianississimo"
  },
  {
    utf8: "𝆏𝆏",
    abc: "!pp!",
    description: "pianissimo"
  },
  {
    utf8: "𝆏",
    abc: "!p!",
    description: "piano"
  },
  {
    utf8: "𝆐𝆏",
    abc: "!mp!",
    description: "mezzo-piano"
  },
  {
    utf8: "𝆐𝆑",
    abc: "!mf!",
    description: "mezzo-forte"
  },
  {
    utf8: "𝆑",
    abc: "!f!",
    description: "forte"
  },
  {
    utf8: "𝆑𝆑",
    abc: "!ff!",
    description: "fortissimo"
  },
  {
    utf8: "𝆑𝆑𝆑",
    abc: "!fff!",
    description: "fortississimo"
  },
  {
    utf8: "𝆑𝆑𝆑𝆑",
    abc: "!ffff!",
    description: "fortississimo"
  },
  {
    utf8: "𝆍𝆑𝆎",
    abc: "!sfz!",
    description: "sforzando"
  }
];




export const utf8DecorationSymbols = [
  {
    utf8: "𝄐",
    abc: "!fermata!",
    description: "fermata"
  }
  ,
  {
    utf8: "𝄑",
    abc: "!invertedfermata!",
    description: "inverted fermata"
  }
];


export const utf8NavigationSymbols = [
  {
    utf8: "𝄉",
    abc: "!D.S.!",
    description: "musical symbol dal segno"
  },
  {
    utf8: "𝄊",
    abc: "!D.C.!",
    description: "musical symbol da capo"
  },
  {
    utf8: "𝄋",
    abc: "!segno!",
    description: "musical symbol segno"
  },
  {
    utf8: "𝄌",
    abc: "!coda!",
    description: "musical symbol coda"
  }
];


export const utf8BarSymbols = [
  {
    utf8: "𝄀",
    description: "musical symbol single barline",
    abcd: "|"
  },
  {
    utf8: "𝄁",
    description: "musical symbol double barline",
    abcd: "||"
  },
  {
    utf8: "𝄂",
    description: "musical symbol final barline",
    abcd: "|]"
  },
  {
    utf8: "𝄃",
    description: "musical symbol reverse final barline",
    abcd: "[|"
  },
  /** {
     utf8: "𝄄",
     description: "musical symbol dashed barline",
     abcd: ""
   },
   {
     utf8: "𝄅",
     description: "musical symbol dotted barline"
   },*/
  {
    utf8: "𝄆",
    description: "musical symbol left repeat sign",
    abcd: "|:",
  },
  {
    utf8: "𝄇",
    description: "musical symbol right repeat sign",
    abcd: ":|"
  },
  {
    utf8: "𝄇𝄆",
    description: "musical symbol left right repeat sign",
    abcd: ":||:"
  }
];



export const regularExpressionBars = /(:\|\|:|:\|:|\|:\||\|:|:\||\|\||\|\]|\|)/;

export const abcdStringTimeSignature = ["1/2", "1/4", "2/2", "2/4", "3/4", "5/4", "7/4", "3/8", "4/4", "6/4", "6/8", "12/8", "15/8"];

/**
 * 
 * @param {string} str 
 * @returns {boolean}
 */
export function isTimeSignature(str) { return abcdStringTimeSignature.indexOf(str) >= 0; }



/**
 * @param {string} str
 * @returns {boolean}
 */
export function isBar(str) { return ['|', '||', '|:', ':|:', ':||:', '|]'].indexOf(str) >= 0; }

/**
 * 
 * @param {string} str 
 * @returns {number | undefined} the corresponding tonality number, and undefined if not a tonality
 * 
 * @example strToTonalityNumber('###') == 3
 * @example strToTonalityNumber('bb') == -2
 * @example strToTonalityNumber('####') == 4
 * @example strToTonalityNumber('bonjour') == undefined
 * 
 */
export function strToTonalityNumber(str) {
  if (str == "♮")
    return 0;

  /**
   * 
   * @param {string} accident 
   * @param {number} n 
   * @returns {string}
   */
  function accidentals(accident, n) { return accident.repeat(n); }

  for (const accident of ["#", "♯", "♭", "b"]) {
    for (let n = 7; n > 0; n--) {
      if (!(n == 1 && accident == "b")) // b once is not a tonality but a note "b"
        if (str == accidentals(accident, n))
          return n * (((accident == "#") || accident == "♯") ? 1 : -1);
    }
  }
  return undefined;
}







export const abcdStringClefs = Object.keys(clefsDictionnary);

/**
 * 
 * @param {string} abcdString 
 * @returns {string | false} false if abcdString does not start with a clef, or that clef
 * @example isStartsWithClefs("𝄞 a") == "𝄞"
 * @example isStartsWithClefs("[K:treble] a") == "[K:treble]"
 * @example isStartsWithClefs("a a ") == false 
 */
export function isStartsWithClefs(abcdString) {
  for (const clef of abcdStringClefs)
    if (abcdString.startsWith(clef))
      return clef;

  return false;
}