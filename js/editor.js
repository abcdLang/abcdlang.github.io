// @ts-check

import { EditorView, basicSetup } from "https://esm.sh/codemirror@6.0.1";
import { EditorState, EditorSelection } from "https://esm.sh/@codemirror/state";
import { StreamLanguage, HighlightStyle, syntaxHighlighting } from "https://esm.sh/@codemirror/language@6.0.0";
import { tags as t, Tag } from "https://esm.sh/@lezer/highlight@1.0.0";
import { abcdStringClefs } from "./abcddefinitions.js";


/**
 * Tags for color highlighting
 */
const clefTag = Tag.define();
const signatureTag = Tag.define();
const barTag = Tag.define();
const alterationTag = Tag.define();




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
            syntaxHighlighting(abcdHighlightStyle)
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