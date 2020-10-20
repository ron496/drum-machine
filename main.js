// ALLOWS LINE BREAKS WITH RETURN BUTTON
marked.setOptions({
    breaks: true,
  });
  
  console.log(marked('[link](www)'))
  
  // INSERTS target="_blank" INTO HREF TAGS (required for codepen links)
  const renderer = new marked.Renderer();
  renderer.link = function (href, title, text) {
    return `<a target="_blank" href="${href}">${text}` + '</a>';
  }
  renderer.code = function(code, language) {
    return '<pre><code class=language-' + language + '>' + code + '</code></pre>';
  }
  
  // GLOBAL VARS
  const buttonTypes = {
    'fa fa-bold': '**',
    'fa fa-italic': '_',
    'fa fa-quote-left': '> ',
    'fa fa-link': '[Link]',
    'fa fa-picture-o': '![Alt Text]',
    'fa fa-list-ol': '1. ',
    'fa fa-list': '- ',
    'fa fa-code': '`'
  };
  const buttonStyles = {
    'fa fa-bold': 'Strong Text',
    'fa fa-italic': 'Emphasized Text',
    'fa fa-quote-left': 'Block Quote',
    'fa fa-link': '(http://)',
    'fa fa-picture-o': '(http://)',
    'fa fa-list-ol': 'List Item',
    'fa fa-list': 'List Item',
    'fa fa-code': 'Inline Code'
  };
  
  const App = React.createClass({
    getInitialState() {
      return {
        markdown: placeholder,
        lastClicked: '',
      }
    },
    
    insertAtCursor(myValue) {
      let myField = document.getElementsByTagName('textarea').item(0);
      if (document.selection) { // older IE support
        myField.focus();
        sel = document.selection.createRange();
        sel.text = myValue;
      } else if (myField.selectionStart || myField.selectionStart == '0') { // all others 
        let startPos = myField.selectionStart;
        SSM.save('position', startPos);
        let endPos = myField.selectionEnd;
        let index = /[^`>*_\s-(1. )]/i.exec(myValue).index; //
        myField.value = myField.value.substring(0, startPos) + myValue + 
          myField.value.substring(endPos, myField.value.length);
        myField.focus();    
        switch(myValue) {
          case '> Block Quote':
          case '- List Item':
          case '1. List Item':
            this.setTextSelect(startPos + index, startPos + myValue.length);
            break;
          case '[Link](http://)':
            this.setTextSelect(startPos + 7, startPos + myValue.length - 1);
            break;
          case '![Alt Text](http://)': 
            this.setTextSelect(startPos + 12, startPos + myValue.length - 1);
            break;
          default:
            this.setTextSelect(startPos + index, startPos + myValue.length - index);
        } 
      } else {
        myField.value += myValue;
      }
    },
    
    getSelectionText() {
      let text = "";
      let myField = document.getElementsByTagName('textarea').item(0);
      text = myField.value.slice(myField.selectionStart, myField.selectionEnd);
      return text;
    },
    
    setTextSelect(caretStart, caretEnd) {
      let myField = document.getElementsByTagName('textarea').item(0);
      if (caretStart == -1) { // preserves cursor position for undoing button insertions
        caretStart = SSM.get('position');
        myField.focus();
        myField.setSelectionRange(caretStart, caretStart);
      } else if (myField.selectionStart) {
        myField.focus();
        myField.setSelectionRange(caretStart, caretEnd);
      } else myField.focus();
    },
    
    handleChange(e) {
      this.setState({
        markdown: e.target.value,
        lastClicked: '',
      });
      SSM.save('style', '');
    },
   
    inserter(_stylePhrase, buttonType) {
      setTimeout( () => this.insertAtCursor(_stylePhrase), 100);
      SSM.save('insert', _stylePhrase);
      SSM.save('style', buttonType);
      this.setState({lastClicked: 'insert'})
    },
    
   trueThenHighlight(_className, _lastStyle, _startPos, _symbol) {
     return _lastStyle != _className || 
     _lastStyle == _className && 
     _startPos != parseInt(sessionStorage.getItem('lastStartPos'), 10) 
     + _symbol.length && _className != 'fa fa-link' && 
     _startPos != parseInt(sessionStorage.getItem('lastStartPos'), 10) 
     + _symbol.length && _className != 'fa fa-picture-o'
   },
   
    handleClick(e) {
      let symbol = buttonTypes[e.target.className];
      let style = buttonStyles[e.target.className];
      let stylePhrase = e.target.className == 'fa fa-bold' || 
                        e.target.className == 'fa fa-italic' || 
                        e.target.className == 'fa fa-code' ? 
                        symbol+style+symbol : symbol+style;
      let usersSelection = this.getSelectionText();
      let myField = document.getElementsByTagName('textarea').item(0);
      let startPos = myField.selectionStart;
      let endPos = myField.selectionEnd;
      // SESSION STORAGE (for highlighting / caret position preservation)
      let usersLink = SSM.get('usersLink');
      let lastStyle = SSM.get('style');
      SSM.insertCaretStore(
        startPos + symbol.length, endPos + symbol.length, 
        startPos, endPos, endPos + 3, 
        endPos + 10, startPos - 3, '', startPos - 4,
        endPos + 4, endPos + 11
      ); 
      
      // INSERT / UNDO INSERT MARKUP TEMPLATE
      if (this.state.lastClicked == 'insert' || this.state.lastClicked == 'undo insert') {
        if (this.state.lastClicked == 'insert' && lastStyle == e.target.className) {
          this.setState({
            markdown: myField.value.replace(sessionStorage.getItem('insert'), ''),
            lastClicked: 'undo insert'
          });
          setTimeout( () => this.setTextSelect(-1, -1), 100);
        } else {
          this.inserter(stylePhrase, e.target.className);
        }
        
        // HIGHLIGHT USER SELECTION
      } else if (usersSelection !== '') { 
        if(this.trueThenHighlight(e.target.className, lastStyle, startPos, symbol)) {
          SSM.selectionCaretStore(e.target.className, startPos, usersSelection);
          this.setState({
            markdown: 
              e.target.className == 'fa fa-link' ?  
              this.state.markdown.substring(0, startPos) + 
              `[${usersSelection}]` + style +
              this.state.markdown.substring(endPos, myField.value.length) :
              e.target.className == 'fa fa-picture-o' ?  
              this.state.markdown.substring(0, startPos) + 
              `![${usersSelection}]` + style +
              this.state.markdown.substring(endPos, myField.value.length) :
              e.target.className == 'fa fa-quote-left' ||
              e.target.className == 'fa fa-list-ol' ||
              e.target.className == 'fa fa-list' ?  
              this.state.markdown.substring(0, startPos) + 
              symbol + usersSelection + 
              this.state.markdown.substring(endPos, myField.value.length) :
              this.state.markdown.substring(0, startPos) + 
              symbol + usersSelection + symbol +
              this.state.markdown.substring(endPos, myField.value.length),
            lastClicked: 'highlight'
          });
        } else {
          SSM.selectionCaretStore('', '', '');
          this.setState({
            markdown: 
              e.target.className == 'fa fa-link' ?
              this.state.markdown.substring(0, startPos - 3 - usersLink.length) + usersLink + 
              this.state.markdown.substring(endPos + 1, myField.value.length) :
              e.target.className == 'fa fa-picture-o' ?
              this.state.markdown.substring(0, startPos - 4 - usersLink.length) + usersLink +
              this.state.markdown.substring(endPos + 1, myField.value.length) :
              e.target.className == 'fa fa-quote-left' || 
              e.target.className == 'fa fa-list-ol' || 
              e.target.className == 'fa fa-list' ?    
              this.state.markdown.substring(0, startPos - symbol.length) + usersSelection + 
              this.state.markdown.substring(endPos, myField.value.length) :
              this.state.markdown.substring(0, startPos - symbol.length) + usersSelection + 
              this.state.markdown.substring(endPos + symbol.length, myField.value.length),
            lastClicked: 'undo'
          });
        }
        
        // highlight url when link name selected
        if (e.target.className == 'fa fa-link' && this.state.lastClicked != 'highlight') { 
          SSM.save('usersLink', usersSelection); 
          setTimeout( () => this.setTextSelect(SSM.get('linkStart'), 
          SSM.get('linkEnd')), 100);
          
          // highlight link name when undoing link selection
        } else if (e.target.className == 'fa fa-link') { 
          setTimeout( () => this.setTextSelect(SSM.get('undoLinkStart'), 
          SSM.get('undoLinkEnd')), 100);
          SSM.save('undoLinkStart', startPos - 3 - usersLink.length);
          
          // highlight url when img name selected
        } else if (e.target.className == 'fa fa-picture-o' && this.state.lastClicked != 'highlight') { 
          SSM.save('usersLink', usersSelection); 
          setTimeout( () => this.setTextSelect(SSM.get('imgLinkStart'), 
          SSM.get('imgLinkEnd')), 100);
          
          // highlight link name when undoing link selection
        } else if (e.target.className == 'fa fa-picture-o') { 
          setTimeout( () => this.setTextSelect(SSM.get('undoImgStart'), 
          SSM.get('undoImgEnd')), 100);
          SSM.save('undoImgStart', startPos - 4 - usersLink.length);
          
          // highlight text on button undo
        } else if (e.target.className == lastStyle && usersSelection != SSM.get('lastSelection')) { 
          setTimeout( () => this.setTextSelect(SSM.get('undoStart') - symbol.length, 
          SSM.get('undoEnd') - symbol.length), 100);
          
          // highlight text inside markup
        } else {
          setTimeout( () => this.setTextSelect(SSM.get('startPos'), 
          SSM.get('endPos')), 100);
        }
        
      // FIRST INSERT
      } else {  
        this.inserter(stylePhrase, e.target.className); 
      }
  
    },
    
    render() {
      return (
        <div>
          <div className='title-div'>
            <img className='title' src='https://goo.gl/QongrD' />
            <div className='title text'>
            Markdown Previewer & Editing Toolbar
            </div>
          </div>
          <div className='editorWrap'>
            <Toolbar onClick={this.handleClick}/>
            <Editor markdown={this.state.markdown} onChange={this.handleChange} />
          </div>
          <Preview  markdown={this.state.markdown}/>
        </div>
      )
    }
  });
  
  class SessionStorageManager {
    insertCaretStore(n1, n2, n3, n4, n5, n6, n7, n8, n9, n10, n11){
      this.n1 = sessionStorage.setItem('startPos', n1);
      this.n2 = sessionStorage.setItem('endPos', n2);
      this.n3 = sessionStorage.setItem('undoStart', n3);
      this.n4 = sessionStorage.setItem('undoEnd', n4);
      this.n5 = sessionStorage.setItem('linkStart', n5);
      this.n6 = sessionStorage.setItem('linkEnd', n6);
      this.n7 = sessionStorage.setItem('undoLinkEnd', n7);
      this.n8 = sessionStorage.setItem('usersLink', n8);
      this.n9 = sessionStorage.setItem('undoImgEnd', n9);
      this.n10 = sessionStorage.setItem('imgLinkStart', n10);
      this.n11 = sessionStorage.setItem('imgLinkEnd', n11);
    }
    
    selectionCaretStore(n12, n13, n14){
      this.n12 = sessionStorage.setItem('style', n12);
      this.n13 = sessionStorage.setItem('lastStartPos', n13);
      this.n14 = sessionStorage.setItem('lastSelection', n14);
    }
    
    save(key, item){
      sessionStorage.setItem(key, item);
    }
    
    get(key){
      return sessionStorage.getItem(key);
    }
  }
  
  const SSM = new SessionStorageManager();
  
  const Toolbar = React.createClass({
    render() {
      return (
        <div className="toolbar">
          <div className="spacer" />
          <i title="Bold" onClick={this.props.onClick} className="fa fa-bold"/>
          <i title="Italic" onClick={this.props.onClick} className="fa fa-italic"/>
          <div className="spacer" />
          <i title="Block Quote" onClick={this.props.onClick} className="fa fa-quote-left"/>
          <i title="Link" onClick={this.props.onClick} className="fa fa-link"/>
          <i title="Inline Code" onClick={this.props.onClick} className="fa fa-code"/>
          <i title="Image" onClick={this.props.onClick} className="fa fa-picture-o"/>
          <div className="spacer" />
          <i title="Bulleted List" onClick={this.props.onClick} className="fa fa-list"/>
          <i title="Numbered List" onClick={this.props.onClick} className="fa fa-list-ol"/>
        </div>
      )
    }
  });
  
  class Editor extends React.Component {
    render () {
      return (
        <textarea 
          value={this.props.markdown}
          onChange={this.props.onChange}
          type="text"/>
      )
    }
  }
  
  class Preview extends React.Component {
    render () {
      return (
        <div className='previewWrap'>
          <div className='preview'>
            <div dangerouslySetInnerHTML={{__html: marked(this.props.markdown, { renderer: renderer })}} />
          </div>
        </div>
      )
    }
  }
  
  const placeholder = 
  `# Welcome to my React Markdown Previewer!
  
  ## This is a sub-heading...
  ### And here's some other cool stuff:
    
  Heres some code, \`<inline style>\`, between 2 backticks.
  
  \`\`\`
  // this is multi-line code:
  
  function anotherExample(firstLine, lastLine) {
    if (firstLine == '\`\`\`' && lastLine == '\`\`\`') {
      return multiLineCode;
    }
  }
  \`\`\`
    
  You can also make text **bold**... whoa!
  Or _italic_.
  Or... wait for it... **_both!_**
  And feel free to go crazy ~~crossing stuff out~~.
  
  The coolest part is probably the toolbar, so go ahead and check that out. There are libraries out there that embed pre-coded toolbards like [SimpleMDE](https://simplemde.com/), but I decided to try to undertake the challenge myself, so this is definitely not perfect (some scrolling issues), but for the most part it works.
  
  There's also [links](https://www.freecodecamp.com/no-stack-dub-sack), and
  > Block Quotes!
  
  And if you want to get really crazy, even tables:
  
  Wild Header | Crazy Header | Another Header?
  ------------ | ------------- | ------------- 
  Your content can | be here, and it | can be here....
  And here. | Okay. | I think we get it.
  
  - And of course there are lists.
    - Some are bulleted.
       - With differnt indentation levels.
          - That look like this.
  
  
  1. And there are numbererd lists too.
  1. The tool bar keeps adding 1s.
  1. But the list goes on...
  - Even if you use dashes or asterisks.
  * And last but not least, let's not forget embedded images:
  
  ![React Logo w/ Text](https://goo.gl/Umyytc)
  
  Well, that's it! Thanks for visiting my project. The code is in desperate need of a refactor, so maybe I will improve later and add additional functionality like syntax highlighting and fix some of the bugs. For this first round, I was just exploring these techniques and focusing on getting things working. 
  
  Feel free to play around and leave some comments if you have any thoughts!
  `
  
  ReactDOM.render(<App />, document.getElementById('app'));
  
  