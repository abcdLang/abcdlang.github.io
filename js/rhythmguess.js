// @ts-check

import { Duration } from "./duration.js";
import { tokenToElement, ElementWithDuration, Rest, NupletSymbolElement, MusicalElement } from "./element.js";
import { utf8DurationSymbols, utf8RestSymbols } from "./abcddefinitions.js";

/**
 * @type {Record<string, string>}
 * Memoïzation of the guessed rhythm for small portion of abcd strings
 */
const memo = {};

/**
 * 
 * @param {string} abcdStr 
 * @param {string} signature 
 * @param {string} result
 * @example abcdStr = "a  b ", signature = "4/4", result = "a2 b2 "
 * @description store the result of guessing rhythm so that we do not call the solver again and again 
 */
function storeMemo(abcdStr, signature, result) {
    memo[signature + abcdStr] = result;
}


export class RhythmGuess {
    /**
     * 
     * @param {string} abcdStr 
     * @param {string} signature 
     * @returns {string} the abcd string where the durations of the notes have been infered
     */
    static getRhythm(abcdStr, signature = "4/4") {
        abcdStr = abcdStr.trimLeft();
        if (memo[signature + abcdStr])
            return memo[signature + abcdStr];

        return RhythmGuess.inferRhythm(abcdStr, signature);
    }


    /**
     * 
     * @param {string} abcdStr, a string representing the content of a voice of a measure
     * @param {string} signature, a string representing the duration of the measure, e.g. 4/4 = a whole note
     * @returns {string} a string where each element (note or rest) has a duration
     * @description if the string does not contain any note/rest/chord, then it adds a "x" with its duration at the end
     */
    static inferRhythm(abcdStr, signature) {
        const signatureValue = eval(signature);
        console.log(`inferRhythm(${abcdStr}, ${signature})`)



        /**
         * 
         * @param {*} tokens 
         * @returns a list containing either Element (notes, rest), Chord (group of notes), NupletSymbolElement, or a generic StringElement that is ignored for the rhythm inference.
         * The elements with a duration are decorated with .dhat which represents the "expected" (with the number of spaces) ratio (to 1 = full measure)of its duration
         */
        function tokensToElements(tokens) {
            let nbSpaces = 0;
            const nbSpacesArray = [];
            let isElement = false;
            const elements = []; //array of Element (Chord, NupletSymbolElement, Rest, StringElement) :)

            for (const token of tokens) {
                if (token == "") {
                    if (isElement)
                        nbSpacesArray[elements.length - 1]++;
                    nbSpaces++;
                }
                else {
                    const element = tokenToElement(token);
                    if (element instanceof ElementWithDuration) {
                        nbSpaces++;
                        isElement = true;

                        nbSpacesArray.push(1 + ((token.indexOf(".") >= 0) ? 0.5 : 0));
                    }
                    else {
                        isElement = false;
                        nbSpacesArray.push(0);
                    }
                    elements.push(element);
                }
            }

            nbSpacesArray[elements.length - 1]--;

            nbSpaces = 0;
            for (const x of nbSpacesArray) nbSpaces += x;
            if (nbSpaces == 0) nbSpaces = 1;

            for (let i = 0; i < elements.length; i++)
                elements[i].dhat = nbSpacesArray[i] / nbSpaces;

            return elements;

        }


        /**
         * 
         * @param {MusicalElement[]} elements
         * @returns {MusicalElement[]} elements unchanged if elements contain notes or rests
         * elements + a rest 
         */
        function addFakeRestIfMeasureIsEmpty(elements) {
            if (elements.some((el) => el instanceof ElementWithDuration))
                return elements;
            else {
                const extraRest = new Rest("x", new Duration(""))
                elements.push(extraRest);
                extraRest.dhat = 1;
                return elements;
            }
        }


        /**
         * 
         * @param {MusicalElement[]} elements 
         * @returns {number[][]}
         */
        function computePossibleDurations(elements) {
            let nupletValue = 1;
            let nupletCount = 0;

            return elements.map(
                (e) => {
                    if (e instanceof ElementWithDuration) {
                        let factor = 1;
                        if (nupletCount > 0) {
                            factor = 1 / nupletValue;
                            nupletCount--;
                        }
                        const proportion = e.dhat / factor;
                        console.log("PROPORTION: " + (proportion * signatureValue))

                        return getPossibleDurations(e, proportion * signatureValue, signatureValue).map((x) => x * factor);
                    }
                    else if (e instanceof NupletSymbolElement) {
                        nupletValue = e.value;
                        nupletCount = nupletValue;
                        return [0];
                    }
                    else
                        return [0];
                });
        }

        /**
         * 
         * @param {MusicalElement[]} elements 
         * @param {number[]} durationsSolution 
         */
        function setDurations(elements, durationsSolution) {
            let nupletValue = 1;
            let nupletCount = 0;

            for (let i = 0; i < elements.length; i++) {
                const e = elements[i];

                if (e instanceof NupletSymbolElement) {
                    nupletValue = e.value;
                    nupletCount = nupletValue;
                }
                else if (e instanceof ElementWithDuration) {
                    const d = durationsSolution[i]; //real duration
                    let factor = 1;

                    function lowerpoweroftwo(x) {
                        return 2 ** Math.floor(Math.log2(x));
                    }

                    if (nupletCount > 0) {
                        factor = lowerpoweroftwo(nupletValue) / nupletValue;
                        nupletCount--;
                    }
                    e.duration = new Duration(d / factor); //fake duration inside a nuplet for instance
                }
            }
        }


        /**
         * 
         * @param {MusicalElement[]} elements with already the correct durations 
         * @param {number[]} durationsSolution 
         * @returns {string} the ABC string with the durations
         */
        function elementsToABC(elements, durationsSolution) {
            let splittingDuration = 0.25; //
            if (["6/8", "9/8", "3/8", "12/8", "15/8"].indexOf(signature) >= 0)
                splittingDuration = 1.5 / 4;

            let t = 0;
            return elements.map((e, i) => {
                t += durationsSolution[i];
                const maybeExtraSpaceForSplitting = isEq(Math.floor(t / splittingDuration), t / splittingDuration) ? " " : "";
                return e.toStringABC() + maybeExtraSpaceForSplitting;
            }).join(" ");

        }

        let isDurationMeasureSmallerThanSignatureForSure = false;
        const tokens = abcdStr.split(" ");
        const elements = addFakeRestIfMeasureIsEmpty(tokensToElements(tokens));

        //main
        try {

            const possibleDurations = computePossibleDurations(elements);

            if (possibleDurations.map((durs) => Math.max(...durs)).reduce((a, b) => a + b, 0) < signatureValue)
                isDurationMeasureSmallerThanSignatureForSure = true;

            let durationsSolution;
            if (possibleDurations.every((durs) => durs.length == 1))
                durationsSolution = possibleDurations.map((durs) => durs[0]);
            else
                durationsSolution = solve(possibleDurations, signatureValue, elements.map((e) => e.dhat));
            setDurations(elements, durationsSolution);
            const abcResult = elementsToABC(elements, durationsSolution);
            console.log("result of the inference: ", durationsSolution, abcResult)
            storeMemo(abcdStr, signature, abcResult);
            return abcResult;

        } catch (e) {
            console.error(e);

            if (isDurationMeasureSmallerThanSignatureForSure) // in case of of anacrusis, we do not show an error
                return abcdStr;
            else
                return abcdStr + ` [Q:"${e.replaceAll(" ", "_")}"] `;
        }
    }

}




/**
 * 
 * @param {ElementWithDuration} element a musical element (class ElementWithDuration) 
 * @param {number} ratio an estimation of the duration of the element
 * @param {number} signatureValue the signature (e.g. 0.75 for a "3/4" measure) of a full measure
 * @returns {number[]} an array of possible durations for the element
 */
function getPossibleDurations(element, ratio, signatureValue) {
    let A = [];
    let num = 1;
    let istart = 0;

    let durationStr = element.duration.toString();

    for (const symbol of utf8DurationSymbols) {
        if (durationStr == symbol.utf8) return [symbol.duration];
        if (durationStr == symbol.utf8 + ".") return [symbol.duration * 3 / 2];
        if (durationStr == symbol.utf8 + "..") return [symbol.duration * 7 / 4];
    }

    for (const symbol of utf8RestSymbols) {
        if (durationStr == symbol.utf8) return [symbol.duration];
        if (durationStr == symbol.utf8 + ".") return [symbol.duration * 3 / 2];
        if (durationStr == symbol.utf8 + "..") return [symbol.duration * 7 / 4];
    }

    if (durationStr == "4")
        return [1];

    if (durationStr == "2")
        return [1 / 2];

    if (durationStr == "2.")
        return [3 / 4];

    if (durationStr == "2..")
        return [3 / 4];

    if (durationStr == "1")
        return [1 / 4];

    if (durationStr == "1.")
        return [3 / 8];

    if (durationStr == "1.")
        return [7 / 16];

    if (durationStr.startsWith("7") || durationStr.endsWith(".."))
        num = 7;
    else if (durationStr.startsWith("3") || durationStr.endsWith("."))
        num = 3;


    if (durationStr.startsWith("////"))
        istart = 6;
    else if (durationStr.startsWith("///") || (durationStr == "𝅬"))
        istart = 5;
    else if (durationStr.startsWith("//"))
        istart = 4;
    else if ((durationStr.startsWith("/")) || (durationStr == "♪"))
        istart = 3;

    const precision = 7;
    for (let i = istart; i < precision; i++)
        A.push(num / (2 ** i));

    // the signature itself should always be a possibility (e.g. one single note)
    if (durationStr == "") {
        if (A.indexOf(signatureValue) == -1)
            A.push(signatureValue);
    }

    A.sort((a, b) => Math.abs(a - ratio) - Math.abs(b - ratio)).slice(0, 2);

    return A;
}


/**
 * 
 * @param {number} a 
 * @param {number} b 
 * @returns {boolean} true iff a and b are equal (close to equal)
 */
function isEq(a, b) { return Math.abs(a - b) < 0.00001; }


const solve =
    //window.location.href.indexOf("github") >= 0 ? solveQuickAndDirty : solveWithLP//
    solveQuickAndDirty;





/**
 * 
 * @param {number[][]} possibleDurations: a list of list of possibleDurations. possibleDurations[i] is the list of possible durations of element n° i 
 * @param {number} totalDuration 
 * @param {number[]} dhats: a list of duration ratios (the sum of these numbers equals 1), these numbers are just used to prune the search tree

 * @returns {number[]} returns an array "solutions" of durations such that:
 *  - the solutions[i] is in possibleDurations[i]
 *  - solutions[0] + solutions[1] + ... sums to totalDuration
 *  - solutions comply with dhats (same ratios => same duration etc.)
 */
function solveQuickAndDirty(possibleDurations, totalDuration, dhats) {

    const timeOut = Date.now() + 100;
    /**
     * 
     * @param {number[]} durations 
     * @param {number[]} bests 
     * @returns {number[]}
     * @example up([1, 2, 4, 5, 3], [3, 4])    
     */
    function up(durations, bests) {
        return durations.sort((a, b) => {
            if ((bests.indexOf(a) >= 0) && (bests.indexOf(b) >= 0))
                return bests.indexOf(a) >= bests.indexOf(b) ? 1 : -1;
            else if (bests.indexOf(a) >= 0)
                return -1;
            else if (bests.indexOf(b) >= 0)
                return 1;
            else
                return 0;
        })
    }


    /**
     * @type {number[]}
     */
    const solution = [];

    /**
     * 
     * @param {number[][]} possibleDurations 
     * @param {number} i 
     * @param {number} subTotal 
     * @returns {boolean}
     */
    function backtracking(possibleDurations, i, subTotal) {
        if (Date.now() > timeOut)
            throw "to complex to find the durations";

        if (i >= possibleDurations.length && Math.abs(subTotal) < 0.000001) {
            console.log("we win!")
            console.log(possibleDurations)
            return true; // we win!
        }

        if (i >= possibleDurations.length)
            return false;

        const newPossibleDurations = possibleDurations;
        newPossibleDurations[i] = [...newPossibleDurations[i]];

        // prune the search for consistency of durations
        for (let j = 0; j < i; j++)
            if (dhats[j] == dhats[i]) { // same number of spaces => same duration
                newPossibleDurations[i] = up(newPossibleDurations[i], [solution[j]]);
            }
            else if (dhats[i] > dhats[j])
                newPossibleDurations[i] = up(newPossibleDurations[i], possibleDurations[i].filter((d) => d >= solution[j]));
            else if (dhats[i] < dhats[j])
                newPossibleDurations[i] = up(newPossibleDurations[i], possibleDurations[i].filter((d) => d <= solution[j]));


        for (const v of newPossibleDurations[i]) {
            solution[i] = v;
            const solutionFound = backtracking(newPossibleDurations, i + 1, subTotal - v);
            if (solutionFound) return true;
        }
        return false;
    }

    const solutionFound = backtracking(possibleDurations, 0, totalDuration);
    if (solutionFound)
        return solution;
    else
        throw "impossible to find durations";
}