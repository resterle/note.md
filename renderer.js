// include the ipc module to communicate with main process.
const md = require('markdown-it')({linkify: true});
const md_emoji = require('markdown-it-emoji');
const md_task_lists = require('markdown-it-task-lists');
const md_prism = require('markdown-it-prism');
const md_mila = require('markdown-it-link-attributes')
md
    .use(md_emoji)
    .use(md_task_lists)
    .use(md_prism, {plugins: ['highlight-keywords', 'show-language']})
    .use(md_mila, {
        pattern: /^https:/,
        attrs: {
            target: '_blank',
            rel: 'noopener'
        }});

const fs = require('fs')
const $ = require('jquery') 
const shell = require('electron').shell;

const baseDir = '/home/raphael/.notes'
const mdRegEx = /.*\.md$/;
let currentFile = 'test.md';
let notes = [];

loadAndDisplayHtml(currentFile);
updateFileList();

fs.watch('/home/raphael/.notes', (eventType, filename) => {
    if (filename && filename === currentFile && eventType === 'change') {
        loadAndDisplayHtml(currentFile)
    }
});

function setCurrentFile(current){
    currentFile = current;
    createNoteList();
}

function noteClickedHandler(note){
    return () => {
        setCurrentFile(note);
        loadAndDisplayHtml(note);
    }
}

function createNoteList(){
    const elements = [];
    for(let note of notes.sort()){
        elements.push(createNoteNavElement(note, currentFile));
    }
    const list = $('#note-list');
    list.html('');
    list.append(elements);
}

function createNoteNavElement(note){
    const name = note.substring(0, note.length-3);
    const element = $(`<span class="nav-group-item"></span>`);
    const textElement = $(note === currentFile ? '<b></b>' : '<a></a>').text(name);
    element.append($('<span class="icon icon-doc-text"></span>'), textElement);
    element.on('click', noteClickedHandler(note));
    return element;
}

function updateFileList(){
    fs.readdir(baseDir, (err, files) => {
        files.forEach(file => {
            if(mdRegEx.test(file)){
                notes.push(file);
            }
        });
        createNoteList();
    });
}

function loadAndDisplayHtml(filename) {  
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
