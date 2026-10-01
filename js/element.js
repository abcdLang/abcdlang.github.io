// @ts-check
import { Duration } from "./duration.js";
import { Pitch } from "./pitch.js";
import { isBar, isTimeSignature, clefsDictionnary, strToTonalityNumber, utf8AccidentalSymbols, utf8RestSymbols } from "./abcddefinitions.js";


export class MusicalElement {
    toStringABC() {
        throw "not implemented because abstract class MusicalElement";
    }
}

/**
 * An element with duration can be a Chord or a rest
 */
export class ElementWithDuration extends MusicalElement {
    dhat = 0;
    duration;

    /**
     * 
     * @param {Duration} duration 
     */
    constructor(duration) { super(); this.duration = duration; }
}

/**
 * A rest (silence)
 */
export class Rest extends ElementWithDuration {

    /**
     * 
     * @param {string} letter 
     * @param {Duration} duration 
     */
    constructor(letter, duration) {
        super(duration);
        this.letter = letter;
    }
    toStringABC() { return (this.letter == "r" ? "z" : this.letter) + this.duration.toString(); }
    toStringABCD() { return (this.letter == "r" ? "z" : this.letter) + this.duration.toString(); }
}


/**
 * a note or a chord
 */
export class Chord extends ElementWithDuration {
    /**
     * 
     * @param {Pitch[]} pitchs 
     * @param {Duration} duration 
     */
    constructor(pitchs, duration) {
        super(duration);
        this.pitchs = pitchs;
    }

    toStringABC() {
        const pitchsStr = this.pitchs.map(pitch => pitch.toStringABC());

        if (pitchsStr.length == 1)
            return pitchsStr[0] + this.duration.toString();
        else
            return "[" + pitchsStr.join("") + "]" + this.duration.toString();
    }

    toStringABCD() {
        const pitchsStr = this.pitchs.map(pitch => pitch.toStringABCD());
        return pitchsStr.join("") + this.duration.toString();
    }
}

/**
 * a signature, e.g. "4/4"
 */
export class ElementSignature extends MusicalElement {
    /**
     * 
     * @param {string} tokenStr 
     * @example new ElementSignature("4/4")
     */
    constructor(tokenStr) { super(); this.tokenStr = tokenStr; }
    toStringABC() { return "[M: " + this.tokenStr + "]"; }
}






export class ElementClef extends MusicalElement {
    /**
     * 
     * @param {string} tokenStr 
     */
    constructor(tokenStr) { super(); this.tokenStr = tokenStr; }

    /**
     * 
     * @param {string} anyTokenStr 
     * @returns {string | undefined} the string representing the clef in ABC
     * or undefined
     */
    static getABCFromTokenABCDClef(anyTokenStr) { return clefsDictionnary[anyTokenStr]; }

    toStringABC() {
        return ElementClef.getABCFromTokenABCDClef(this.tokenStr);
    }
}



export class ElementTempo extends MusicalElement {
    /**
     * 
     * @param {string} tokenStr 
     */
    constructor(tokenStr) {
        super();
        this.tokenStr = tokenStr;
    }

    /**
     * 
     * @param {string} tokenStr 
     * @returns {string | undefined} the ABC correspond
     */
    static getABCFromTokenABCDTempo(tokenStr) {
        if (tokenStr.startsWith("𝅗𝅥="))
            return "[Q:1/2=" + tokenStr.substring("𝅗𝅥=".length) + "]";
        if (tokenStr.startsWith("♩="))
            return "[Q:1/4=" + tokenStr.substring("♩=".length) + "]";
        if (tokenStr.startsWith("𝅘𝅥𝅮="))
            return "[Q:1/8=" + tokenStr.substring("𝅘𝅥𝅮=".length) + "]";
        if (tokenStr.startsWith("𝅘𝅥𝅯="))
            return "[Q:1/16=" + tokenStr.substring("𝅘𝅥𝅯=".length) + "]";
        return undefined;
    }

    toStringABC() {
        return ElementTempo.getABCFromTokenABCDTempo(this.tokenStr);
    }

}



/**
 * a tonality changes
 * @example new ElementTonality("##")
 */
export class ElementTonality extends MusicalElement {

    tonalityNumber = 0;

    /**
     * 
     * @param {string} tokenStr 
     */
    constructor(tokenStr) {
        super();
        const tonalityNumber = ElementTonality.getTonalityNumberFromStr(tokenStr);
        if (tonalityNumber == undefined)
            throw "the string does not represent a tonality"
        this.tonalityNumber = tonalityNumber;
    }

    /**
     * 
     * @param {string} token 
     * @returns {number | undefined}
     */
    static getTonalityNumberFromStr(token) { return strToTonalityNumber(token); }

    /**
     * @returns {Pitch}
     */
    get tonic() {
        return ElementTonality.tonalityNumberToTonicMajor(this.tonalityNumber);
    }


    /**
     * 
     * @param {*} tonalityNumber 
     * @returns a string that represents the tonic in the major tonality
     * 
     * @example tonalityNumberToTonicMajor(2) returns new Pitch('d')
     */
    static tonalityNumberToTonicMajor(tonalityNumber) {
        const tonic = lyToPitch(["♭c", "♭g", "♭d", "♭a", "♭e", "♭b", "f", "c", "g", "d", "a", "e", "b", "#f", "#c"][7 + tonalityNumber]);
        if (tonic.accidental == undefined)
            tonic.accidental = 0;
        return tonic;
    }


    toStringABC() {
        if (this.tonalityNumber >= 0)
            return ["[K:Cmaj]", " [K:Gmaj]", " [K:D]", " [K:A]", " [K:E]", " [K:B]", " [K:F#maj]", " [K:C#maj]"][this.tonalityNumber];
        if (this.tonalityNumber < 0)
            return ["[K:Cmaj", " [K:F] ", "[K:Bb]", " [K:Eb] ", " [K:Ab] ", " [K:Db] ", " [K:Gb] ", " [K:Cb] "][-this.tonalityNumber];
    }
}

/**
 * class for a symbol e.g. "(3", "(5"
 */
export class NupletSymbolElement extends MusicalElement {
    /**
     * 
     * @param {number} value
     * @example new NupletSymbolElement(3)
     */
    constructor(value) { super(); this.value = value; }
    toStringABC() { return "(" + this.value; }
}

/**
 * class for any element (which is not a note or a rest)
 */
export class StringElement extends MusicalElement {
    /**
     * 
     * @param {string} string 
     */
    constructor(string) { super(); this.string = string; }
    toStringABC() { return this.string; }
}




export class ElementBar extends StringElement {
    /**
     * 
     * @param {string} tokenStr 
     * @example new ElementBar("|")
     */
    constructor(tokenStr) { super(tokenStr); }
}


/**
 * 
 * @param {string} tokenStr 
 * @returns {MusicalElement} element corresponding to tokenStr
 */
export function tokenToElement(tokenStr) {
    if (tokenStr == "")
        return new StringElement(tokenStr);

    if (isBar(tokenStr))
        return new ElementBar(tokenStr);

    if (isTimeSignature(tokenStr))
        return new ElementSignature(tokenStr);

    if (ElementClef.getABCFromTokenABCDClef(tokenStr))
        return new ElementClef(tokenStr);

    if (ElementTonality.getTonalityNumberFromStr(tokenStr))
        return new ElementTonality(tokenStr);

    if (ElementTempo.getABCFromTokenABCDTempo(tokenStr))
        return new ElementTempo(tokenStr);

    /**
    * @param {string} string
    * @returns {number | undefined} the value of the nuplet symbol if it is one, otherwise it returns undefined
    * @example on "(3" returns 3
    */
    function getValueFromTokenNupletSymbol(string) {
        return string.startsWith("(") ? parseInt(string.substr(1)) : undefined;
    }

    const value = getValueFromTokenNupletSymbol(tokenStr);
    if (value != undefined)
        return new NupletSymbolElement(value);

    /**
     * 
     * @param {*} str 
     * @returns {[string, number|undefined]}[the rest of the string, value of the accidental read] or [str, undefined]
     */
    function eatAccidental(str) {
        if (str.startsWith("♮"))
            return [str.substr(1), 0];

        let accidental = undefined;
        if (str.startsWith("♯♯") || str.startsWith("##")) {
            accidental = 2;
        }
        else if (str.startsWith("♯") || str.startsWith("#")) {
            accidental = 1;
        }
        else if (str.startsWith("♭♭")) {
            accidental = -2;
        }
        else if (str.startsWith("♭")) {
            accidental = -1;
        }
        else {
            for (const symbol of utf8AccidentalSymbols)
                if (str.startsWith(symbol.utf8)) {
                    accidental = symbol.accidental;
                    break;
                }
        }

        if (accidental != undefined)
            str = str.substr(Math.abs(accidental));
        return [str, accidental];
    }


    /**
     * 
     * @param {string} str 
     * @returns {[string, string|undefined]}
     */
    function eatRestLetter(str) {
        if (str.startsWith("_")) return [str.substr(1), "r"];
        if (str.startsWith("r")) return [str.substr(1), "r"];
        if (str.startsWith("x")) return [str.substr(1), "x"];

        for (const symbol of utf8RestSymbols)
            if (str.startsWith(symbol.utf8))
                return [str, "r"]; // we do not move forward because we need the information for the duration
        return [str, undefined];
    }



    /**
     * 
     * @param {*} str 
     * @returns [the rest to be parsed, the letter] or [str, undefined]
     */
    function eatLetterNote(str) {
        if (str.startsWith("do"))
            return [str.substr(2), "c"];
        if (str.startsWith("ré"))
            return [str.substr(2), "d"];
        if (str.startsWith("mi"))
            return [str.substr(2), "e"];
        if (str.startsWith("fa"))
            return [str.substr(2), "f"];
        if (str.startsWith("sol"))
            return [str.substr(3), "g"];
        if (str.startsWith("la"))
            return [str.substr(2), "a"];
        if (str.startsWith("si"))
            return [str.substr(2), "b"];

        const letterNote = str[0];
        if (!(["a", "b", "c", "d", "e", "f", "g"].indexOf(letterNote.toLowerCase()) >= 0))
            return [str, undefined];
        return [str.substr(1), letterNote];
    }

    /**
     * 
     * @param {string} str 
     * @returns {[string, number]}
     */
    function eatOctaves(str) {
        let octave = 0; // by default
        for (let i = 4; i >= 1; i--)
            if (str.startsWith("'".repeat(i))) {
                octave = i;
                str = str.substr(i);
                break;
            }

        for (let i = 4; i >= 1; i--)
            if (str.startsWith(",".repeat(i))) {
                octave = -i;
                str = str.substr(i);
                break;
            }
        return [str, octave];
    }

    let letter = undefined;
    let accidental = undefined;

    [tokenStr, letter] = eatRestLetter(tokenStr);
    if (letter)
        return new Rest(letter, new Duration(tokenStr));


    const pitchs = [];
    while (tokenStr.length > 0) {
        [tokenStr, accidental] = eatAccidental(tokenStr);

        if (tokenStr == "")
            break;

        [tokenStr, letter] = eatLetterNote(tokenStr);
        if (letter == undefined) {
            if (pitchs.length > 0)
                if (pitchs[pitchs.length - 1].accidental == undefined)
                    pitchs[pitchs.length - 1].accidental = accidental;
            break;
        }

        let value = 0;
        value = lyNoteLetterToiNote7(letter.toLowerCase());

        let octave;
        [tokenStr, octave] = eatOctaves(tokenStr);

        if (letter == letter.toUpperCase()) //if uppercase
            octave--;

        value += octave * 7;

        pitchs.push(new Pitch(value, accidental));
    }

    if (pitchs.length > 0)
        return new Chord(pitchs, new Duration(tokenStr));


    return new StringElement(tokenStr);
}




/**
 * 
 * @param {string} iNote 
 * @returns the value of the note between 0 and 6
 */
export function lyNoteLetterToiNote7(iNote) {
    switch (iNote) {
        case "c": return 0;
        case "d": return 1;
        case "e": return 2;
        case "f": return 3;
        case "g": return 4;
        case "a": return 5;
        case "b": return 6;
    }
    throw "error";
}


/**
 * 
 * @param {string} str 
 * @returns {Pitch}
 */
export function lyToPitch(str) {
    const el = tokenToElement(str);

    if (!(el instanceof Chord))
        throw "the string was not representing a pitch";

    return el.pitchs[0];
}