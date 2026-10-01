// @ts-check

import { EditorView, basicSetup } from "https://esm.sh/codemirror@6.0.1";
import { Decoration } from "https://esm.sh/@codemirror/view";
import { EditorState, EditorSelection, StateField, StateEffect } from "https://esm.sh/@codemirror/state";
import { StreamLanguage, HighlightStyle, syntaxHighlighting } from "https://esm.sh/@codemirror/language@6.0.0";
import { tags as t, Tag } from "https://esm.sh/@lezer/highlight@1.0.0";
import { abcdStringClefs } from "./abcddefinitions.js";
import { getMusicalPosition, ScoreHighlighter } from "./matchingCodeRendering.js";

/**
 * Tags for color highlighting
 */
const clefTag = Tag.define();
const signatureTag = Tag.define();
const barTag = Tag.define();
const alterationTag = Tag.define();


const addHighlightEffect = StateEffect.define();
const clearHighlightEffect = StateEffect.define();

// 2. Définir le style visuel
const highlightDecoration = Decoration.mark({
    class: "cm-custom-highlight-current-measure"
});

// 3. Créer un StateField pour gérer l'état des décorations
export const highlightField = StateField.define({
    create() {
        return Decoration.none;
    },
    update(highlights, tr) {
        // Mettre à jour les positions si le document change (insertion/suppression de texte)
        highlights = highlights.map(tr.changes);

        for (let e of tr.effects) {
            if (e.is(addHighlightEffect)) {
                // e.value contient { from, to }
                highlights = highlights.update({
                    add: [highlightDecoration.range(e.value.from, e.value.to)]
                });
            } else if (e.is(clearHighlightEffect)) {
                highlights = Decoration.none;
            }
        }
        return highlights;
    },
    provide: f => EditorView.decorations.from(f)
});

/**
 * define the parser for the tags
 */
const abcdGrammar = StreamLanguage.define({
    token(stream) {
        for (const clef of abcdStringClefs)
            if (stream.match(clef)) return "clef";

        for (const alteration of ["#", "♯", "♭", "♮"])
            if (stream.match(alteration)) return "alteration";

        if (stream.match("|")) return "bar";
        if (stream.match(/^\d+\/\d+/)) return "signature";

        // IMPORTANT: Move stream forward if no match found to avoid infinite loops
        stream.next();
        return null;
    },
    tokenTable: {
        "bar": barTag,
        "clef": clefTag,
        "signature": signatureTag,
        "alteration": alterationTag,
    }
});



/**
 * style for each tag
 */
const abcdHighlightStyle = HighlightStyle.define([
    { tag: barTag, color: "black", background: "#AAAAAA55", fontWeight: "bold" },
    { tag: signatureTag, color: "black", background: "#ffa65722", fontWeight: "bold" },
    { tag: clefTag, color: "brown", background: "#ffff0055", fontWeight: "bold" },
    { tag: alterationTag, color: "darkgreen", fontWeight: "bold" },
]);





function updateHighlightZone() {
    const { iline, icolumn } = editor.getCursor();
    const lines = editor.text.split("\n");
    const line = lines[iline - 1];

    let colEnd = line.indexOf("|", icolumn + 1);
    let colStart = line.lastIndexOf("|", icolumn);

    if (colEnd == -1)
        colEnd = line.length - 1;

    console.log({ iline, colStart, colEnd });

    if (colStart < colEnd)
        editor.highlightZone(iline, colStart, colEnd);


    const musicalPosition = getMusicalPosition(iline, icolumn);
    console.log(musicalPosition)
    ScoreHighlighter.scoreHighlightZone(musicalPosition);
}

const EventHandlerMoveInDocument = EditorView.domEventHandlers({
    // Fires on standard mouse click
    click(event, view) { updateHighlightZone(); },
    keyup(event, view) { updateHighlightZone(); },
});

/**
 * A wrapper class for the text editor where the code is written 
 */
export class Editor {
    constructor() {
        // 2. Initialize the Editor

        const onUpdate = EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                this.onchangecallback();
            }
        });

        this.extensions = [
            basicSetup,
            abcdGrammar,
            onUpdate,
            syntaxHighlighting(abcdHighlightStyle),
            highlightField,
            EventHandlerMoveInDocument
        ];

        this.view = new EditorView({
            doc: 'SELECT * FROM users WHERE id = 123 AND name = "$admin"',
            extensions: this.extensions,
            parent: document.getElementById("editor-panel"),
        });
    }
    /**
     * return {string} the full code
     */
    get text() {
        return this.view.state.doc.toString();
    }
    set text(newText) {
        this.view.setState(EditorState.create({
            doc: newText,
            extensions: this.extensions
        }));
    }

    /**
     * 
     * @param {string} textToInsert 
     */
    write(textToInsert) {
        this.view.dispatch(this.view.state.replaceSelection(textToInsert));
        this.onchangecallback();
    }



    focus() {
        this.view.focus();
    }


    set onchange(callback) {
        this.onchangecallback = callback;
    }


    /**
     * 
     * @param {function | string} transformFn
     * @description apply a function (or a string) to each range of the selection
     */
    applyToSelection(transformFn) {
        this.view.dispatch(
            this.view.state.changeByRange((range) => {
                const oldText = this.view.state.sliceDoc(range.from, range.to);
                const newText = typeof transformFn === "function" ? transformFn(oldText) : transformFn;

                return {
                    changes: { from: range.from, to: range.to, insert: newText },
                    // 3. On définit la nouvelle sélection pour ce fragment précis
                    range: EditorSelection.range(range.from, range.from + newText.length)
                };
            })
        );
        this.view.focus();
    }


    get DOMelement() {
        return document.getElementById("editor-panel");
    }



    /**
     * 
     * @param {number} lineNumber between 1 and ...
     * @param {number} columnNumber between 1 and ...
     */
    gotoLine(lineNumber, columnNumber = 0) {
        const lineCount = this.view.state.doc.lines;
        const targetLine = Math.max(1, Math.min(lineNumber, lineCount));

        const lineInfo = this.view.state.doc.line(targetLine);

        const pos = lineInfo.from + Math.min(columnNumber, lineInfo.length);

        this.view.dispatch({
            selection: { anchor: pos, head: pos },
            scrollIntoView: true
        });

        this.view.focus();
    }



    getPositionFromLineCol(iline, icol) {
        const lineInfo = this.view.state.doc.line(iline);
        return lineInfo.from + Math.min(icol, lineInfo.length);
    }

    /**
     * 
     * @param {number} iline 
     * @param {number} icolStart 
     * @param {number} icolEnd 
     */
    highlightZone(iline, icolStart, icolEnd) {
        this.view.dispatch({
            effects: clearHighlightEffect.of()
        });
        this.view.dispatch({
            effects: addHighlightEffect.of({ from: this.getPositionFromLineCol(iline, icolStart), to: this.getPositionFromLineCol(iline, icolEnd) })
        });
    }


    noHightlightZone() {
        this.view.dispatch({
            effects: clearHighlightEffect.of()
        });
    }
    /**
     * 
     * @returns {{iline: number, icolumn: number, ipos: number}}
     * @description iline between 1 and nb of lines
     * icolumn starts at 1
     * ipos starts at 0
     */
    getCursor() {
        const state = this.view.state;
        const ipos = state.selection.main.head;

        const line = state.doc.lineAt(ipos);

        return {
            iline: line.number,
            icolumn: ipos - line.from,
            ipos: ipos
        };
    }
}

export let editor = new Editor();
window.editor = editor;