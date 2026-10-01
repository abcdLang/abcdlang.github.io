import { editor } from "./editor.js";
import { isStaffInstrumentAndOpenCurlyBracket, isLyricsLine } from "./abcd2abc.js";
import { isStartsWithClefs } from "./abcddefinitions.js";

export class SVGScore {
    static getSVGSystem(isystem) {
        const renderedSystems = document.getElementById("output").children;
        return renderedSystems[isystem];
    }

    static isElementStaff(el) { return el.querySelector(".abcjs-top-line"); }
    static isElementBar(el) { return el.dataset.name == "bar" };

    static getSVGStaffAndBars(musicalInformation) {
        const systemElement = SVGScore.getSVGSystem(musicalInformation.isystem);
        const GsystemElement = systemElement.querySelector("svg g");
        let currentStaffElement = undefined;

        let istaff = -1; function isElementStaff(el) { return el.querySelector(".abcjs-top-line"); }
        function isElementBar(el) { return el.dataset.name == "bar" };

        let bars = []; // bars of the "current staff"

        for (const el of GsystemElement.children) {
            if (SVGScore.isElementStaff(el)) {
                const staffElement = el;
                istaff++;

                if (musicalInformation.istaff < istaff)
                    break;

                if (musicalInformation.istaff == istaff)
                    currentStaffElement = staffElement;

                bars = [];
                const currentStaffNumber = istaff;

            }
            else if (SVGScore.isElementBar(el)) {
                bars.push(el);
            }
        }


        return { SVGStaffElement: currentStaffElement, bars };
    }



    /**
     * 
     * @param {*} musicalInformation 
     * @returns the rectangle of the zone corresponding to the musicalInformation in the coordinate of the SVG of the system (top-left is 0,0)
     */
    static getRectangle(musicalInformation) {
        const SVGSystem = this.getSVGSystem(musicalInformation.isystem);
        const { SVGStaffElement, bars } = this.getSVGStaffAndBars(musicalInformation);
        const barStart = bars[musicalInformation.imeasure - 1]
        const barEnd = bars[musicalInformation.imeasure];

        let x1 = barStart ? barStart.getBoundingClientRect().x : 0;
        let x2 = barEnd.getBoundingClientRect().x;

        x1 -= SVGSystem.getBoundingClientRect().x;
        x2 -= SVGSystem.getBoundingClientRect().x;

        return {
            x1, x2,
            y1: barEnd.getBoundingClientRect().top - SVGSystem.getBoundingClientRect().top,
            y2: barEnd.getBoundingClientRect().bottom - SVGSystem.getBoundingClientRect().top
        }
    }

}





/**
 * A class with helpers for the link between the rendering and the code
 */
export class MatchingCodeRendering {

    /**
     * @description attach onclick events to the elements of SVG
     */
    static install() {
        // the output contains systems
        const renderedSystems = document.getElementById("output").children;
        for (let isystem = 0; isystem < renderedSystems.length; isystem++) {
            MatchingCodeRendering.installSystem(isystem, renderedSystems[isystem]);

            if (isystem == 0)
                renderedSystems[isystem].onclick = () => {
                    const lines = editor.text.split("\n");
                    const lineBeginningSystem = systemNumberToLineNumber(lines, isystem);
                    editor.gotoLine(lineBeginningSystem);
                }
        }
    }


    /**
     * 
     * @param {*} isystem the index of the system
     * @param {*} systemElement  the system in the DOM
     * 
     * @effect install the mouse click event to got in the code
     */
    static installSystem(isystem, systemElement) {
        const GsystemElement = systemElement.querySelector("svg g");
        let istaff = -1;
        let bars = []; // bars of the "current staff"

        for (const el of GsystemElement.children) {
            if (SVGScore.isElementStaff(el)) {
                const staffElement = el;
                istaff++;
                bars = [];
                const currentStaffNumber = istaff;
                const currentBars = bars;
                systemElement.addEventListener("click", (evt) => {
                    const systemRect = systemElement.getBoundingClientRect();
                    const staffRect = staffElement.getBoundingClientRect();
                    const staffRectTop = staffRect.top - systemRect.top;
                    const staffRectBottom = staffRect.bottom - systemRect.top;
                    const y = evt.clientY - systemRect.top;
                    const x = evt.clientX - systemRect.left;
                    if (!(staffRectTop <= y && y < staffRectBottom))
                        return;

                    let imeasure = 0;
                    for (const bar of bars) {
                        const barRectLeft = bar.getBoundingClientRect().left - systemRect.left;
                        if (x < barRectLeft)
                            break;
                        imeasure++;
                    }

                    highlightZone({ isystem, istaff: currentStaffNumber, imeasure });
                });

            }
            else if (SVGScore.isElementBar(el)) {
                bars.push(el);
            }
        }
    }

}


/**
 * 
 * @param {*} lines the full ABCD code 
 * @param {*} isystem number of system (starting from 0)
 * @returns the first line number that corresponds to the system isystem (between 1 and ..., and undefined if not found)
 */
function systemNumberToLineNumber(lines, isystem) {
    let currentSystemNumber = 0;
    let nbConsecutiveEmptyLines = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() == "")
            nbConsecutiveEmptyLines++;
        else if (nbConsecutiveEmptyLines >= 1) {
            nbConsecutiveEmptyLines = 0;
            currentSystemNumber++;
        }

        if (currentSystemNumber == isystem)
            return i + 1;
    }
    return undefined;
}




/**
 * 
 * @param {*} lines the full ABCD code 
 * @param {*} iline line number (from 0)
 * @returns the system number starting from 1
 */
function systemNumberFromLineNumber(lines, iline) {
    let currentSystemNumber = 0;
    let nbConsecutiveEmptyLines = 0;
    for (let i = 0; i <= iline; i++) {
        if (lines[i].trim() == "") {
            nbConsecutiveEmptyLines++;

        }
        else if (nbConsecutiveEmptyLines >= 1) {
            nbConsecutiveEmptyLines = 0;
            currentSystemNumber++;
        }
    }
    console.log(currentSystemNumber)
    return currentSystemNumber;
}


/**
 * 
 * @param {*} iline 
 * @param {*} icol 
 * @returns {isystem, istaff, imeasure}
 */
export function getMusicalPosition(iline, icol) {
    const lines = editor.text.split("\n");

    const isystem = systemNumberFromLineNumber(lines, iline - 1);

    let ilineSystemStart = iline;
    while (ilineSystemStart > 1 && lines[ilineSystemStart - 1].trim().length > 0)
        ilineSystemStart--;

    ilineSystemStart++;

    let istaff = -1;
    for (let i = ilineSystemStart; i <= iline; i++) {
        const line = lines[i - 1];
        if (["[", "]", "{", "}"].indexOf(line) < 0)
            if (!isStaffInstrumentAndOpenCurlyBracket(line))
                if (!isLyricsLine(line))
                    if (isStartsWithClefs(line.trim()))
                        istaff++;
    }

    const line = lines[iline - 1];
    const cleanedLine = line.replace(/g||/, "| ");

    let i = 0;
    let imeasure = -1;

    while (i >= 0 && i < icol) {
        i = line.indexOf("|", i + 1);
        imeasure++;
    }


    return { isystem, istaff, imeasure };
}



function highlightZone(musicalPosition) {
    editorHighlightZone(musicalPosition);
    ScoreHighlighter.scoreHighlightZone(musicalPosition);
}




function editorGetPositionInCode(musicalPosition) {
    const lines = editor.text.split("\n");
    const ilineBeginningSystem = systemNumberToLineNumber(lines, musicalPosition.isystem);

    console.log(musicalPosition)

    if (ilineBeginningSystem == undefined)
        throw "musical system not found"

    let iline = ilineBeginningSystem;

    let istaff = -1;

    for (; istaff < musicalPosition.istaff || ilines >= lines.length; iline++) {
        const line = lines[iline - 1].trim();
        if (["[", "]", "{", "}"].indexOf(line) < 0)
            if (!isStaffInstrumentAndOpenCurlyBracket(line))
                if (!isLyricsLine(line))
                    if (isStartsWithClefs(line.trim()))
                        istaff++;

        if (istaff == musicalPosition.istaff)
            break;
    }

    const line = lines[iline - 1];
    const { colStart, colEnd } = getColumnsOfMeasure(line, musicalPosition.imeasure);
    return { iline, colStart, colEnd };
}
/**
 * 
 * @param {*} musicalPosition 
 * @description hightlight the code corresponding to the musical information. 
 * musicalInformation.isystem = the number of the current system (isystem = 0 means the title, isystem = 1 is the first system)
 * musicalInformation.istaff = the number of staff (the first one is 0)
 * musicalInformation.ibar = the number of the measure
 */
function editorHighlightZone(musicalPosition) {
    const { iline, colStart, colEnd } = editorGetPositionInCode(musicalPosition);
    editor.highlightZone(iline, colStart, colEnd);
}



export class ScoreHighlighter {
    static scoreHighlightZoneRectangle = undefined;

    static scoreHighlightZone(musicalPosition) {
        if (this.scoreHighlightZoneRectangle)
            this.scoreHighlightZoneRectangle.remove();


        if (musicalPosition.isystem < 1)
            return;

        if (musicalPosition.istaff < 0)
            return;

        const rectangle = SVGScore.getRectangle(musicalPosition);

        const svg = SVGScore.getSVGSystem(musicalPosition.isystem).querySelector("svg")
        const [x, y, w, h] = svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

        // 3. Définir les attributs du rectangle (position, taille, couleur, etc.)
        rect.setAttribute('x', rectangle.x1);           // Position X du coin supérieur gauche
        rect.setAttribute('y', rectangle.y1 + y);           // Position Y du coin supérieur gauche
        rect.setAttribute('width', rectangle.x2 - rectangle.x1);      // Largeur
        rect.setAttribute('height', rectangle.y2 - rectangle.y1);     // Hauteur
        rect.setAttribute('rx', '10');          // (Optionnel) Arrondi des coins sur X
        rect.setAttribute('ry', '10');          // (Optionnel) Arrondi des coins sur Y
        rect.classList.add("scoreHighlightZone");

        this.scoreHighlightZoneRectangle = rect;

        // 4. Ajouter le rectangle dans le SVG
        svg.appendChild(rect);
    }

    static noHighlightZone() {
        if (this.scoreHighlightZoneRectangle)
            this.scoreHighlightZoneRectangle.remove();
    }
}









/**
 * 
 * @param {string} line 
 * @param {number} imeasure 
 * @returns an object {colStart: ..., colnEnd: ....} where colStart is the column number (starting from 1) just after the "|" of the measure number imeasure in the line. colEnd: is the column number of the end of the measure n° imeasure.
 * If the measure does not exist, it returns undefined
 * 
 * @example getColumnBeginningMeasure("a c | d e | f", 0) == {colStart: 1, colEnd: 4}
 * @example getColumnBeginningMeasure("a c | d e | f", 1) == {colStart: 6, colEnd: 9}
 * @example getColumnBeginningMeasure("a c | d e | f", 2) == {colStart: 12, colEnd: 13}
 * @example getColumnBeginningMeasure("a c | d e | f", 42) == undefined
 */
function getColumnsOfMeasure(line, imeasure) {
    const cleanedLine = line.replace(/g||/, "| ");
    let colStart = 0;
    for (let i = 0; i < imeasure; i++)
        colStart = cleanedLine.indexOf("|", colStart + 1);

    let colEnd = cleanedLine.indexOf("|", colStart + 1);
    if (colEnd <= 0)
        colEnd = cleanedLine.length;
    colStart++;
    return colStart <= 0 ? undefined : { colStart, colEnd };
}
