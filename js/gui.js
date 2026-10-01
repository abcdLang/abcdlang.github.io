// @ts-check
import { editor } from "./editor.js";
import { Save } from "./save.js";
import { ninja } from "./actions.js";
import { abcd2abc } from "./abcd2abc.js";
import { MatchingCodeRendering } from "./matchingCodeRendering.js";
import { utf8AccidentalSymbols, utf8DurationSymbols, utf8ClefSymbols, utf8DynamicSymbols, utf8DecorationSymbols, utf8NavigationSymbols, utf8RestSymbols, utf8BarSymbols } from "./abcddefinitions.js";
import { str8down, str8up } from "./harmony.js";


Split(['#editor-panel', '#output-panel'], {
    sizes: [50, 50],
    minSize: 150,
    cursor: 'col-resize',
    direction: 'horizontal',
    gutterSize: 6
});


const abcjs = window.ABCJS;
/**
 * reload the content from local storage
 */
dialogOpenButtonOpen.onclick = () => {
    dialogOpen.close();
    const newid = selectFilename.value;
    if (newid != null) {
        if (Save.exists(newid)) {
            Save.setId(newid);
            editor.text = Save.load();//editor.setValue(Save.load(), -1);
            update();
        }
        else {
            alert("No document with id name '" + newid + "' found!")
        }
    }

}


dialogOpenButtonCancel.onclick = () => {
    dialogOpen.close();
}

buttonDialogOpen.onclick = () => {
    selectFilename.innerHTML = "";

    for (const key in localStorage) if (key.startsWith("save:")) {
        const filename = key.substring("save:".length + 1)
        const option = document.createElement("option");
        option.value = filename;
        option.text = filename;
        selectFilename.add(option);
    }
    dialogOpen.showModal();
}


buttonSave.onclick = () => {
    const newid = prompt("What id name do you want to give to this score?", Save.getId());
    Save.setId(newid);
    Save.save();
}


buttonExportMIDI.onclick = async () => {
    const abcd = editor.text;
    const abc = await abcd2abc(abcd);
    const a = document.createElement("a");
    a.id = "downloadA";
    a.style.display = 'none';
    document.body.appendChild(a);
    const midi = ABCJS.synth.getMidiFile(abc, { midiOutputType: "encoded" })
    a.setAttribute("href", midi);
    a.setAttribute("download", "myfile.mid");

    a.click();
    document.body.removeChild(a);
}


buttonExportABC.onclick = async () => {
    const abcd = editor.text;
    const abc = await abcd2abc(abcd);
    const a = document.createElement("a");
    a.id = "downloadA";
    a.style.display = 'none';
    document.body.appendChild(a);
    const content = 'data:text/plain;charset=utf-8,' + encodeURIComponent(abc);
    a.setAttribute("href", content);
    a.setAttribute("download", "myfile.abc");
    a.click();
    document.body.removeChild(a);

}

buttonActionMenu.onclick = () => { ninja.open(); }

let storedValue = Save.load();
if (storedValue == undefined)
    storedValue = Save.getId() + "\nMozart\n\n𝄞  ♯♯  3/4 a/ a/ (3 b♭ b♭ b♭ f#- | f#2  \n😀 Li fe is beau ti ful,      |  yes \n𝄞  ♯♯  3/4  r [c e♭']3 | d r  \n𝄢           A,4 |  ";

let lines = storedValue.split("\n");
storedValue = lines.join("\n");
editor.text = storedValue;


setInterval(() => Save.save(editor.text), 5000);


/**
 * 
 * @param {*} event 
 * @description close the insert menu
 */
window.onclick = (event) => {
    if (!event.target.matches('#buttonInsert')) {
        toolbarInsert.classList.remove("show");
    }
}


let previousABCDString = "";



async function update() {
    const abcdString = editor.text;
    if (abcdString == previousABCDString)
        return;

    previousABCDString = abcdString;
    const abc = await abcd2abc(abcdString);

    function clickListener(abcelem, tuneNumber, classes, analysis, drag, mouseEvent) {
        console.log(abcelem);
        console.log(analysis);
    }
    const visualObj = abcjs.renderAbc('output', abc, {
        oneSvgPerLine: true,
        clickListener: clickListener
    })[0];
    const synthControl = new abcjs.synth.SynthController();
    synthControl.load("#audio", null, { displayRestart: true, displayPlay: true, displayProgress: true });
    synthControl.setTune(visualObj, false);

    MatchingCodeRendering.install();
}

editor.onchange = update;
update();




/**
 * 
 * @param {*} text 
 * @param {*} event
 * @description add a button in the list of buttons 
 */
function addButton(text, hint, event) {
    const b = document.createElement("button");
    b.innerHTML = text;
    b.title = hint;
    b.onclick = event;
    toolbarInsert.append(b);
}

function buttonInsert(caption, textToInserted, hint) {
    addButton(caption, hint, (evt) => {
        evt.srcElement.blur();
        editor.write(textToInserted)
        editor.focus();
    });
}




export function performActionOnSelection(f) {
    editor.focus();
    editor.applyToSelection(f);
}


button8up.onclick = () => performActionOnSelection(str8up);
button8down.onclick = () => performActionOnSelection(str8down);


buttonInsert("💬 ", "💬 ", "start a line of lyrics");
buttonInsert("♩=120 ", "♩=120 ", "add tempo indication");
buttonInsert("🤫", "🤫", "mute voice");

for (const symbol of utf8ClefSymbols)
    buttonInsert(symbol.utf8, symbol.utf8, symbol.description);

buttonInsert("3/4", "temporal signature");

for (const symbol of utf8AccidentalSymbols)
    buttonInsert(symbol.utf8, symbol.utf8, symbol.description);

for (const symbol of utf8DurationSymbols)
    buttonInsert(symbol.utf8, symbol.utf8, symbol.description);

buttonInsert(".", ".", "increase the duration by half");
buttonInsert("..", "..", "increase the duration by half + quarter");

buttonInsert("r", "a rest (of arbitrary duration)");

for (const symbol of utf8RestSymbols)
    buttonInsert(symbol.utf8, symbol.utf8, symbol.description);

for (const symbol of utf8DynamicSymbols)
    buttonInsert(symbol.utf8, symbol.utf8, symbol.description);

for (const symbol of utf8DecorationSymbols)
    buttonInsert(symbol.utf8, symbol.utf8, symbol.description);


for (const symbol of utf8BarSymbols)
    buttonInsert(symbol.utf8, symbol.abcd, symbol.description);

for (const symbol of utf8NavigationSymbols)
    buttonInsert(symbol.utf8, symbol.utf8, symbol.description);




document.querySelector("#editor-panel").onkeydown = (e) => {
    if (e.ctrlKey && e.key == "k") {
        ninja.open();
        e.preventDefault();
    }
};






