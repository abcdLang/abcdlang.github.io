// @ts-check

import { regularExpressionBars, abcdStringTimeSignature, abcdStringClefs, isStartsWithClefs, instrumentToMIDITable, utf8DynamicSymbols, utf8NavigationSymbols, strToTonalityNumber, isTimeSignature } from "./abcddefinitions.js";
import { RhythmGuess } from "./rhythmguess.js";
import { ElementSignature, tokenToElement, ElementTempo } from "./element.js";


/**
 * a cursor in the staffs and voices (i.e. a staff index & a voice index in that staff)
 */
export class Cursor {
    /**
     * @type {number}
     */
    istaff = -1;


    /**
     * @type {number}
     */
    ivoice = 0;

    constructor() {
        this.reset();
    }

    nextStaff() {
        this.istaff++;
        this.ivoice = 0;

    }


    nextVoice() {
        this.ivoice++;
    }

    nextLyrics() { }

    reset() {
        this.istaff = -1;
        this.ivoice = 0;
    }
}


/**
 * information about a staff, i.e. five lines to write music on it
 * 
 * --------
 * --------
 * --------
 * --------
 * --------
 * 
 * This class stores information about the staff + its content
 */
class Staff {
    constructor() {
        this.symbolBeginning = "";
        this.symbolEnding = "";
        this.voices = [];
        this.voices.push(new Voice());
        this.voices.push(new Voice());
        this.voices.push(new Voice());
        this.voices.push(new Voice());
        this.nbMeasureAddedLastTime = 0;
    }


    /**
     * 
     * @param {Cursor} cursor 
     * @param {string} data 
     * @param {*} info 
     */
    appendVoice(cursor, data, info) {
        this.nbMeasureAddedLastTime = abcToNbMeasures(data);
        if (cursor.ivoice >= this.voices.length)
            this.voices.push(new Voice());
        this.voices[cursor.ivoice].append(data);

        if (info.instrument)
            this.voices[cursor.ivoice].instrument = info.instrument;
        if (info.muted)
            this.voices[cursor.ivoice].muted = info.muted;

    }

    /**
     * 
     * @param {Cursor} cursor 
     */
    validate(cursor) {
        for (let i = cursor.ivoice; i < this.voices.length; i++)
            this.voices[i].appendWeak(emptyABCFromNbMeasures(this.nbMeasureAddedLastTime));
    }


    /**
     * 
     * @param {Cursor} cursor 
     * @param {string} lyricsStr 
     */
    appendLyrics(cursor, lyricsStr) {
        this.voices[0].append("w:" + lyricsStr);
    }


    /**
     * 
     * @returns {string}
     */
    toStringABCStructure() {
        if (this.voices.length == 1)
            return "V" + this.voices[0].voiceNumber;
        else
            return "(" + this.voices.filter((voice) => !voice.isEmpty).map((voice) => "V" + voice.voiceNumber).join(" ") + ")";
    }
}

/**
 * 
 * @param {number} nbMeasures 
 * @returns {string} a abcd string with empty measures
 * @example emptyABCFromNbMeasures(2) == "   |   |   "
 */
function emptyABCFromNbMeasures(nbMeasures) {
    return "   |  ".repeat(nbMeasures);
}


/**
 * 
 * @param {string} abcdString 
 * @returns {number} the number of measures in abcdString
 * @example abcToNbMeasures("    |    |") == 2
 */
function abcToNbMeasures(abcdString) {
    const abcdString2 = abcdString.replaceAll("||", "|");
    return abcdString2.split("|").length;
}
/**
 * content of the score (structure + data)
 */
export class Score {

    /**
     * @type {ScoreMetaData}
     */
    scoreMetaData;


    /**
     * @type {Staff[]}
     */
    staffs;

    constructor() {
        this.scoreMetaData = new ScoreMetaData();
        this.staffs = [];
    }

    /**
     * 
     * @param {number} istaff 
     */
    ensureStaffExists(istaff) {
        if (istaff >= this.staffs.length)
            this.staffs.push(new Staff());
    }


    /**
     * 
     * @param {Cursor} cursor 
     * @param {string} data 
     * @param {*} info 
     */
    appendVoice(cursor, data, info) {
        this.ensureStaffExists(cursor.istaff);
        this.staffs[cursor.istaff].appendVoice(cursor, data, info);
        cursor.nextVoice();
    }


    /**
     * 
     * @param {Cursor} cursor 
     * @param {string} lyricsStr 
     */
    appendLyrics(cursor, lyricsStr) {
        this.ensureStaffExists(cursor.istaff);
        this.staffs[cursor.istaff].appendLyrics(cursor, lyricsStr);
        cursor.nextLyrics();

    }

    /**
     * 
     * @param {Cursor} cursor 
     */
    validateStaff(cursor) {
        if (cursor.istaff >= 0)
            this.staffs[cursor.istaff].validate(cursor);
    }

    /**
     * 
     * @param {Cursor} cursor 
     * @returns {string | undefined}
     */
    getLastTimeSignature(cursor) {
        this.ensureStaffExists(cursor.istaff);
        return this.staffs[cursor.istaff].voices[0].getLastTimeSignature();
    }

    /**
     * @param {Cursor} cursor
     * @param {string} symbol, e.g.'{' = beginning of a group, '}' = end of a group
     * @effect add a "symbol"
     */
    setStaffSymbol(cursor, symbol) {
        if (symbol == '{' || symbol == '[') {
            this.ensureStaffExists(cursor.istaff + 1);
            this.staffs[cursor.istaff + 1].symbolBeginning = symbol;
        }
        else
            this.staffs[cursor.istaff].symbolEnding = symbol;
    }


    /**
     * 
     * @returns {string}
     */
    getStringABCStructure() {
        let scoreExpression = "%%score ";

        for (const staff of this.staffs)
            scoreExpression += staff.symbolBeginning + " " + staff.toStringABCStructure() + " " + staff.symbolEnding;

        return scoreExpression;
    }


    /**
     * 
     * @returns {string}
     */
    getStringABCData() {
        const lines = [];

        for (const staff of this.staffs) {
            for (const voice of staff.voices)
                if (!voice.isEmpty)
                    if (!voice.muted)
                        lines.push(voice.toStringABC());
        }

        return lines.join('\n');
    }

    /**
     * 
     * @returns {string}
     */
    toStringABC() {
        return this.scoreMetaData.toStringABC() + '\n' + this.getStringABCStructure() + '\n' + this.getStringABCData();
    }



    preprocessing() {
        this.applyMacros();
        this.guessRhythm();
    }



    applyMacros() {


        /**
         * 
         * @param {string} measure 
         */
        function removeNewLineClefsEtc(measure) {
            measure = measure.replaceAll("\n", "");
            const elementsStr = measure.split(" ");
            while (elementsStr.length > 0) {
                console.log("truc : " + elementsStr[0])
                if (elementsStr[0] == "")
                    elementsStr.shift();
                if (elementsStr[0] == "\n")
                    elementsStr.shift();
                else if (isStartsWithClefs(elementsStr[0]))
                    elementsStr.shift();
                else if (strToTonalityNumber(elementsStr[0]) != undefined)
                    elementsStr.shift();
                else if (isTimeSignature(elementsStr[0]))
                    elementsStr.shift();
                else if (ElementTempo.getABCFromTokenABCDTempo(elementsStr[0]))
                    elementsStr.shift();
                else break;
            }
            return elementsStr.join(" ");
        }

        /**
         * 
         * @param {string[]} measuresAndBars 
         * @param {string} macro 
         * @param {number} i 
         * @param {number} iprec 
         * @returns 
         */
        function macroPercentReplaceMeasure(measuresAndBars, macro, i, iprec) {
            const safeMacro = macro.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(`${safeMacro}\\s*`, "g");
            if (measuresAndBars[i].indexOf(macro) >= 0) {
                measuresAndBars[i] = measuresAndBars[i].replaceAll(regex,
                    removeNewLineClefsEtc(measuresAndBars[iprec]));
                return true;
            }
            return false;
        }

        /**
        * 
        * @param {string[]} measuresAndBars 
        * @param {RegExp} regex 
        * @param {number} i 
        * @param {function} func 
        * @returns 
        */
        function macroWithRegExReplace(measuresAndBars, regex, i, func) {
            measuresAndBars[i] = measuresAndBars[i].replaceAll(regex, func);
        }


        for (const staff of this.staffs) {
            for (const voice of staff.voices) {
                const text = voice.data;
                const measuresAndBars = text.split(regularExpressionBars);

                for (let i = 0; i < measuresAndBars.length; i += 2) {
                    macroWithRegExReplace(measuresAndBars, /%-(\d+)\s*/g, i,
                        (match, n) => {
                            const num = Number(n);
                            return removeNewLineClefsEtc(measuresAndBars[i - 2 * num]);
                        });
                    macroWithRegExReplace(measuresAndBars, /%(\d+)\s*/g, i,
                        (match, n) => {
                            const num = Number(n);
                            return removeNewLineClefsEtc(measuresAndBars[2 * (num - 1)]);
                        });
                    macroWithRegExReplace(measuresAndBars, /%\s*/g, i, () => removeNewLineClefsEtc(measuresAndBars[i - 2]));

                   
                }
                voice.data = measuresAndBars.join("");
                console.log(voice.data)
            }
        }
    }



    guessRhythm() {
        let currentTimeSignature = "4/4"; //default value
        for (const staff of this.staffs) {
            for (const voice of staff.voices) {
                voice.data = voice.data
                    .split("\n")
                    .map((line) => {
                        const measuresStr = line.split("|");
                        const measuresResultsStr =
                            measuresStr
                                .map((measureStr) => {
                                    if (measureStr == "") // DO NOT REMOVE. It enables to handle "||"
                                        return "";

                                    if (measureStr.trim() == "%") // TO BE REMOVED
                                        return " % ";
                                    /**
                                     * 
                                     * @param {*} measureStr
                                     * @description read in advance the signature for eventually update currentTimeSignature before the full 
                                     */
                                    function readSignature(measureStr) {
                                        for (const element of measureStr.split(" ").map(tokenToElement))
                                            if (element instanceof ElementSignature)
                                                currentTimeSignature = element.tokenStr;
                                    }

                                    readSignature(measureStr);

                                    const measureOutputStr = RhythmGuess.getRhythm(measureStr, currentTimeSignature);
                                    console.log(measureOutputStr)
                                    return measureOutputStr;
                                });
                        return measuresResultsStr.join("|");
                    })
                    .join("\n");
                console.log(voice.data)
            }
        }
    }
}



/**
 * This class represents a string in which we append a string as a new line at the end
 */
class StringToBeAppended {
    constructor() { this.data = ""; }

    /**
     * @description append newLineString at the end of the string
     * @param {string} newLineString 
     */
    append(newLineString) {
        if (this.data == "")
            this.data = newLineString;
        else this.data += "\n" + newLineString;
    }
}




/**
 * @param {string} abcdString
 * @param {string[]} array
 * @returns {string | undefined} the last thing from array appearing in the abcdString 
 * @example getLastThing("𝄞 a a 𝄢 a", ["𝄞", "𝄢"]) == "𝄢"
 * @example getLastThing("𝄞 a a a", ["𝄞", "𝄢"]) == "𝄞"
 */
function getLastThing(abcdString, array) {
    const positions = array.map((token) => abcdString.lastIndexOf(token));
    const pos = Math.max(...positions);
    if (pos == -1)
        return undefined;

    const i = positions.indexOf(pos);
    return array[i];
}



/**
 * @param {string} abcdString
 * @returns {string | undefined} the last clef appearing in the voice 
 * @example getLastClef("𝄞 a a 𝄢 a") == "𝄢"
 * @example getLastClef("𝄞 a a a") == "𝄞"
 */
function getLastClef(abcdString) { return getLastThing(abcdString, abcdStringClefs); }


/**
 * 
 * @param {string} abcdString 
 * @returns {string | undefined} the last clef appearing in the time signature 
 */
function getLastTimeSignature(abcdString) { return getLastThing(abcdString, abcdStringTimeSignature.map(sign => " " + sign)); }


class Voice extends StringToBeAppended {
    /**
     * @type {number}
     */
    static NEXTNUMBER;


    constructor() {
        super();
        if (Voice.NEXTNUMBER == undefined) // internal numbering used in ABC
            Voice.NEXTNUMBER = 0;

        this.voiceNumber = Voice.NEXTNUMBER;
        this.instrument = 0;
        this.muted = false;
        this.isEmpty = true;

        Voice.NEXTNUMBER++;
    }

    /**
     * 
     * @param {*} newData 
     * @description append the data to the voice (the voice is then non-empty)
     */
    append(newData) {
        this.appendWeak(newData);
        this.isEmpty = false;
    }


    /**
     * 
     * @param {*} newData 
     * @description append the data to the voice (the voice is then non-empty)
     */
    appendWeak(newData) {
        console.log(newData)
        console.log(isStartsWithClefs(newData))
        if (isStartsWithClefs(newData)) {
            const lastClef = getLastClef(this.data);
            const clef = isStartsWithClefs(newData);

            console.log(lastClef, clef)
            if (lastClef == clef)
                newData = newData.substr(clef.length);

        }
        this.data += "\n" + newData;
    }

    /**
     * 
     * @returns {string | undefined} the last signature in the voice
     * @example returns "4/4"
     */
    getLastTimeSignature() {
        const sign = getLastTimeSignature(this.data);
        if (sign == undefined)
            return undefined;
        return sign.trim();
    }

    toStringABC() {
        /**
         * 
         * @param {string} inputString 
         * @returns {string}
         */
        function replaceABCDtokensByABCtokens(inputString) {
            let string = inputString;

            for (const symbol of utf8DynamicSymbols)
                string = string.replaceAll(" " + symbol.utf8 + " ", " " + symbol.abc + " ");

            for (const symbol of utf8NavigationSymbols)
                string = string.replaceAll(" " + symbol.utf8 + " ", " " + symbol.abc + " ");

            string = string.replaceAll(/(?<=\S) /g, ""); //remove a space after a letter different from a space

            return string

        }
        return `V:V${this.voiceNumber}\n`
            + this.instrumentToABC()
            + `[V:V${this.voiceNumber}]`
            + this.data.split("\n").map((line) => {
                if (line.startsWith("w:")) // lyrics...
                    return line; // ...are just rendered as they are
                else
                    return replaceABCDtokensByABCtokens(line);
            }).join('\n');
    }


    instrumentToABC() {
        if (this.instrument && instrumentToMIDITable[this.instrument] != undefined)
            return "%%MIDI program " + instrumentToMIDITable[this.instrument] + "\n";
        else
            return "";
    }
}


/**
 * Meta-data of a score (title + composer)
 */
export class ScoreMetaData {
    constructor() {
        this.title = "Write the title at the top of the code";
        this.composer = "Composer follows the title";
    }

    toStringABC() {
        const abcLines = [];
        abcLines.push("X:1");
        abcLines.push("L:1/4");
        abcLines.push("I:linebreak <none>"); //no linebreak explicitely specified in the code 
        abcLines.push("%%propagate-accidentals pitch");
        abcLines.push("%%writeout-accidentals none");
        abcLines.push("%%barnumbers 1");
        abcLines.push("T:" + this.title);//
        abcLines.push("C:" + this.composer);
        return abcLines.join("\n");
    }
}

