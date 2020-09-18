const baseDir = '/home/raphael/.notes'
const Plugin = require('markdown-it-regexp')
function plugin(){
    return Plugin(
    /\[\[(((\S+\/)*(\S+\#)?(\S+))|(\#\S+))(\|\S[\S\s]+)?\]\]/,

    // this function will be called when something matches
    function(match, utils) {

        const input = match[0].substring(2, match[0].length-2);
        const labelSplit = input.split('|');
        const label = labelSplit[1] ? labelSplit[1] : '';
        const anchorSplit = labelSplit[0].split('#');
        const anchor = anchorSplit[1] ? anchorSplit[1] : '';
        const path = anchorSplit[0];

        let linkLabel = label;
        linkLabel = linkLabel ? linkLabel : path;
        linkLabel = linkLabel ? linkLabel : anchor;
        let href = path ? `${baseDir}/${path}.md`: '';
        href = anchor ? `${href}#${anchor}` : href;

        return `<a href="${href}">${linkLabel}</a>`
    })
}
const md = require('markdown-it')()
    .use(require('markdown-it-emoji'))
    .use(require('markdown-it-task-lists'))
    .use(require('markdown-it-prism'), {plugins: ['highlight-keywords', 'show-language']})
    .use(require('markdown-it-anchor'))
    .use(require('markdown-it-mark'))
    .use(require('markdown-it-meta'))
    .use(plugin());
    //.use(require('markdown-it-wikilinks')({ uriSuffix: '', relativeBaseURL: '#', baseURL: `${baseDir}/` }));

const fs = require('fs')
const $ = require('jquery'); 
const anchor = require('markdown-it-anchor');
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

function setCurrentFile(current, anchor){
    $('.title').text(nameFromFile(current));
    currentFile = current;
    loadAndRender(current, anchor);
    createNoteList(current);
    if(anchor){
        jumpToAnchor(anchor);
    }
}

function noteClickedHandler(note, anchor=''){
    return () => {
        setCurrentFile(note, anchor);
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

function jumpToAnchor(anchor){
    document.getElementById(anchor).scrollIntoView();
    markAnchor(anchor);
}

function markAnchor(anchor){
    const elementId = $.escapeSelector(anchor)
    const element = $(`#${elementId}`);
    element.addClass('mark-element')
    setTimeout(() => element.removeClass('mark-element'), 1000)
}

$(document).on('click', 'a[href^="#"]', function(event) {
    const anchor = event.currentTarget.hash.substring(1);
    markAnchor(anchor);
});

$(document).on('click', 'a[href^="https"]', function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
});

$(document).on('click', `a[href^="${baseDir}"]`, function(event) {
    event.preventDefault();
    const note = event.currentTarget.pathname.substring(baseDir.length+1);
    const anchor = event.currentTarget.hash.substring(1);
    noteClickedHandler(note, anchor)();
});


