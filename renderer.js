const baseDir = '/home/raphael/.notes'
const md = require('markdown-it')()
    .use(require('markdown-it-emoji'))
    .use(require('markdown-it-task-lists'))
    .use(require('markdown-it-prism'), {plugins: ['highlight-keywords', 'show-language']})
    .use(require('markdown-it-anchor'))
    .use(require('markdown-it-mark'))
    .use(require('markdown-it-meta'))
    .use(require('markdown-it-wikilinks')({ uriSuffix: '', relativeBaseURL: '#', baseURL: `${baseDir}/` }));

const fs = require('fs')
const $ = require('jquery') 
const shell = require('electron').shell;


const mdRegEx = /.*\.md$/;
let currentFile = 'test.md';
let notes = [];

updateFileList();

fs.watch('/home/raphael/.notes', (eventType, filename) => {
    if (filename && filename === currentFile && eventType === 'change') {
        loadAndRender(currentFile)
    }
});

function setCurrentFile(current){
    $('.title').text(nameFromFile(current));
    currentFile = current;
    loadAndRender(current);
    createNoteList(current);
}

function noteClickedHandler(note){
    return () => {
        setCurrentFile(note);
    }
}

function createNoteList(selectedNote=null){
    const elements = [];
    for(let note of notes.sort()){
        elements.push(createNoteListElement(note, selectedNote));
    }
    const list = $('#note-list');
    list.html('');
    list.append(elements);
}

function createNoteListElement(note){
    const name = nameFromFile(note);
    const element = $(`<span class="nav-group-item"></span>`);
    const textElement = $(note === currentFile ? '<b></b>' : '<a></a>').text(name);
    element.append($('<span class="icon icon-doc-text"></span>'), textElement);
    element.on('click', noteClickedHandler(note));
    return element;
}

function nameFromFile(file){
    return file.substring(0, file.length-3);
}

function updateFileList(selectedNote){
    fs.readdir(baseDir, (err, files) => {
        files.forEach(file => {
            if(mdRegEx.test(file)){
                notes.push(file);
            }
        });
        createNoteList(selectedNote);
    });
}

function loadAndRender(filename) {  
    const absolutePath = `${baseDir}/${filename}`;
    //Check if file exists
    if(fs.existsSync(absolutePath)) {
        let data = fs.readFileSync(absolutePath, 'utf8');
        var result = md.render(data);
        $('.markdown-body').html(result);
    } else {
        console.log("File Doesn\'t Exist. Creating new file.")
    }
}

$(document).on('click', 'a[href^="https"]', function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
});

$(document).on('click', `a[href^="${baseDir}"]`, function(event) {
    event.preventDefault();
    note = event.currentTarget.pathname.substr(baseDir.length+1);
    noteClickedHandler(`${note}.md`)();
});
