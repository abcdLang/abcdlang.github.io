// @ts-check
import { Pitch } from "./pitch.js";
import { Chord, tokenToElement } from "./element.js";
import { imidiNote2RawPitch } from "./midiinputgui.js";

/**
 * 
 * @param {string} abcdString 
 * @param {*} f 
 * @returns apply function f to all tokens in abcdString and returns the obtained string
 */
export function mapToAllTokens(abcdString, f) {
    return abcdString.replaceAll("[", " [ ")
        .replaceAll("]", " ] ")
        .split(' ').map(f).join(' ').replaceAll(" [ ", "[").replaceAll(" ] ", "]");
}




/**
 * 
 * @param {string} abcdTokenString 
 * @param {number} diff 
 * @returns the string
 */
export function movePitch(abcdTokenString, diff) {
    const element = tokenToElement(abcdTokenString);

    if (!(element instanceof Chord))
        return abcdTokenString;

    for (const pitch of element.pitchs)
        pitch.value += diff;

    return element.toStringABCD();
}



/**
 * 
 * @param {string} abcdTokenString 
 * @param {number} diff 
 * @returns the string
 */
export function addPitch(abcdTokenString, diff) {
    const element = tokenToElement(abcdTokenString);

    if (!(element instanceof Chord))
        return abcdTokenString;

    const newPitchs = element.pitchs.map((p) => new Pitch(p.value + diff, p.accidental));
    element.pitchs.push(...newPitchs);

    return element.toStringABCD();
}

/**
 * 
 * @param {string} abcdTokenString 
 * @returns the string
 */
export function onlyKeepLowestNote(abcdTokenString) {
    const element = tokenToElement(abcdTokenString);

    if (!(element instanceof Chord))
        return abcdTokenString;

    const newPitchs = element.pitchs;
    
    return new Chord([newPitchs[0]], element.duration).toStringABCD();
}


/**
 * 
 * @param {string} abcdTokenString 
 * @returns the string
 */
export function onlyKeepUppestNote(abcdTokenString) {
    const element = tokenToElement(abcdTokenString);

    if (!(element instanceof Chord))
        return abcdTokenString;

    const newPitchs = element.pitchs;
    
    return new Chord([newPitchs[newPitchs.length-1]], element.duration).toStringABCD();
}

/**
 * 
 * @param {string} abcdString 
 * @returns {string} the string where each note is one octave higher
 * 
 * @example str8up("a'' c,") == "a''' c"
 */
export function str8up(abcdString) {
    return mapToAllTokens(abcdString, 
        /**
         * 
         * @param {string} str 
         * @returns {string}
         */
        (str) => movePitch(str, 7));
}

/**
 * 
 * @param {*} abcdString 
 * @returns the string where each note is one octave lower
 * 
 * @example str8up("a'' c,") == "a' c,,"
 */
export function str8down(abcdString) {
    return mapToAllTokens(abcdString, 
        /**
         * 
         * @param {string} str 
         * @returns {string}
         */
        (str) => movePitch(str, -7));
}




/**
 * 
 * @param {Pitch} pitch1 
 * @param {Pitch} pitch2 
 * @return the sum of the two pitch.
 * @example add(D, E) = F# because D = one tone, D = two tones => the result is three tones, so F#
 */
function add(pitch1, pitch2) {
    let result = new Pitch(pitch1.value + pitch2.value, 0);
    let nbHalfTone = result.nbHalfTones - pitch1.nbHalfTones;
    result.accidental = pitch2.nbHalfTones - nbHalfTone;
    return result;
}

/**
* 
* @param {Pitch} pitch 
* @returns the same pitch but in the normal octave
*/
function modulo(pitch) {
    return new Pitch(pitch.value % 7, pitch.accidental);
}



/**
* 
* @param {Pitch} pitch
* @param {Pitch} key 
* @example enharmonic(new Pitch(1, 1), new Pitch(3, -1)) is Object { value: 2, accidental: -1 }
* @returns the same pitch but in the key (e.g. G# in Eb is Ab)
*/
export function enharmonic(pitch, key) {
    const pitch0e = imidiNote2RawPitch(pitch.nbHalfTones - key.nbHalfTones);
    return add(pitch0e, key);
}

/**
* 
* @param {Pitch} key
* @returns {(number | undefined)[]} the array of accidentals in the key
*/
export function getAccidentals(key) {
    /**
     * @type {(number | undefined)[]}
     */
    const array = [0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 7; i++) {
        let newPitch = modulo(add(new Pitch(i, 0), key));
        array[newPitch.value] = newPitch.accidental;
    }
    return array;
}


/**
 * @param {Pitch} pitch 
 * @param {Pitch} key 
 * @return the pitch with the accidental that is natural in the key
 * @example accidentalize(C, E) => C# because C has a # in E major
 */
export function accidentalize(pitch, key) { return new Pitch(pitch.value, getAccidentals(key)[pitch.value7]); }

