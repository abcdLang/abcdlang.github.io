// @ts-check
import { ScoreMetaData, Score, Cursor } from "./score.js";
import { isStartsWithClefs, instrumentToMIDITable, instrumentToStandardKey } from "./abcddefinitions.js";
import { ElementSignature, tokenToElement } from "./element.js";
import { RhythmGuess } from "./rhythmguess.js";

/**
 * 
 * @param {string} abcdLine 
 * @returns {false | {content: string, muted: boolean, instrument: string|undefined}} false if the line is not a staff line, otherwise returns an object containing the information of the line
 * {content: content without the instrument name, instrument: (optional) instrument name}
 * @description a staffline is a line starting with a key or starting with an instrument name followed by a key
 * 
 * isStaffLine('flute 𝄞 a a a |') returns {content: "a a a |", instrument: "flute"}
 * isStaffLine('𝄞 a a a |') returns {content: "𝄞 a a a |"}
 * isStaffLine('   a a |)' returns false
 *
 */
function getInfoStaffLine(abcdLine) {
    let muted = false;

    if (abcdLine == "")
        return false;

    if (abcdLine.startsWith("🤫")) {
        abcdLine = abcdLine.substr(2);
        abcdLine = abcdLine.trim();
        muted = true;
    }

    if (isStartsWithClefs(abcdLine))
        return { content: abcdLine, muted, instrument: undefined };

    const words = abcdLine.split(" ");
    const firstWord = words[0].toLowerCase();
    let content = words.splice(1).join(" ").trim();
    if (instrumentToMIDITable[firstWord] != undefined) {
        if (!(isStartsWithClefs(content)))
            content = (instrumentToStandardKey[firstWord] ? instrumentToStandardKey[firstWord] : "𝄞") + " " + content;
        return { instrument: firstWord, content, muted };
    }
    return false;
}


/**
 * @param {string} abcdLine
 * @returns {false | {instrument: string}} true if line is of the form "flute {" or "piano   {   "
 * 
 * isStaffInstrumentAndOpenCurlyBracket('piano {') returns {instrument: "piano"}
 * isStaffInstrumentAndOpenCurlyBracket('flute 𝄞 a a a |') returns false
 */
export function isStaffInstrumentAndOpenCurlyBracket(abcdLine) {
    const words = abcdLine.split(" ");
    const firstWord = words[0].toLowerCase();
    const content = words.splice(1).join(" ").trim();

    if (content == "{" && instrumentToMIDITable[firstWord] != undefined)
        return { instrument: firstWord };

    return false;
}


/**
 * 
 * @param {string} abcdLine 
 * @returns {string|false}
 */
export function isLyricsLine(abcdLine) {
    if (abcdLine.startsWith("💬"))
        return abcdLine.substr(2);
    return false;
}






/**
     * 
     * @param {*} abcdLines 
     * @effect pop the corresponding lines in abcdLines
     * @returns the score preambule (title of the score + name of the composer)
     */
function extractScorePreambuleFromABCDLines(abcdLines) {
    const scorePreambule = new ScoreMetaData();
    let iLine = 0;

    /**
     * 
     * @param {string} line 
     * @returns {boolean}
     */
    function isNotATitleOrComposer(line) {
        if (line == "{")
            return true;
        if (getInfoStaffLine(line))
            return true;
        return false;
    }

    while (abcdLines.length > 0) {
        let line = abcdLines[0].trim();
        if (line != "") {
            if (isNotATitleOrComposer(line))
                return scorePreambule;
            abcdLines.shift();
            if (iLine == 0)
                scorePreambule.title = line;
            else {
                scorePreambule.composer = line;
                return scorePreambule;
            }
            iLine++;
        }
        else
            abcdLines.shift();
    }
    return scorePreambule;
}

/**
 * 
 * @param {string} abcdString that represents a score. For instance
 *          Bloup
 *                    Mozart
 * 
 * {
 * 𝄞 4/4 a |
 * 𝄢   a   |
 * }
 * 
 * 𝄞 4/4 a |
 * 𝄢   a   |
 * 
 * @returns the corresponding abc code
 */
export async function abcd2abc(abcdString) {
    const abcdLines = abcdString.split("\n");
    const scorePreambule = extractScorePreambuleFromABCDLines(abcdLines);
    const score = abcd2Score(abcdLines);
    score.scoreMetaData = scorePreambule;

    //score.preprocessing();

    return score.toStringABC();
}





/**
 * 
 * @param {string[]} abcdLines 
 * @returns {Score}
 */
function abcd2Score(abcdLines) {
    const score = new Score();
    const cursor = new Cursor();
    let currentInstrument = undefined;
    for (let i = 0; i < abcdLines.length; i++) {
        let lyricsStr = undefined;
        let line = abcdLines[i].trim();
        if (line == "") {
            score.validateStaff(cursor);
            cursor.reset();
        }

        else if (isStaffInstrumentAndOpenCurlyBracket(line)) {
            const infoStaff = isStaffInstrumentAndOpenCurlyBracket(line);
            currentInstrument = infoStaff.instrument;
            score.setStaffSymbol(cursor, "{");
        }

        else if (["[", "]", "{", "}"].indexOf(line) >= 0) {
            score.setStaffSymbol(cursor, line);
        }
        else if (lyricsStr = isLyricsLine(line)) {
            score.appendLyrics(cursor, lyricsStr);
        }
        else {
            let infoVoice = {};

            if (getInfoStaffLine(line)) {
                score.validateStaff(cursor);
                cursor.nextStaff();
                infoVoice = getInfoStaffLine(line);
                line = infoVoice.content;
                if (infoVoice.instrument)
                    currentInstrument = infoVoice.instrument;
            }


            score.appendVoice(cursor, line, infoVoice);

        }
    } //endfor
    return score;

}