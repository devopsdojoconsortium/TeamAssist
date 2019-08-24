import {h} from '@cycle/dom';

export default function mdModal () { 
  return {
    params: { 
      title: "Markdown Styling Help",
      cols: [  
        { dKey: "val", label: "What to Type", minWidth: 360, tdStyle: "" },
        { dKey: "lab", label: "Styled Result", width: 330, tdStyle: "markdown" }, 
      ],
      modalPos: {
        top: 20,
        right: 20,
        width: 590,
        height: 580
      }
    },
    list: [
      { lab: h('h2', 'Header (H2)'), val: "# H1     ## H2     ### H3"},
      { lab: h('strong', 'Bold'), val: "**Bold**"},
      { lab: h('i', 'italics'), val: "*italics*"},
      { lab: h('li', 'Item'), val: "* Item"},
      { lab: h('ol', h('li', 'Numbered item')), val: "1. Numbered item"},
      { lab: h('blockquote', 'Blockquote'), val: "> Blockquote"},
      { lab: h('del', 'strikethrough'), val: "~~strikethrough~~"},
      { lab: h('a', { attrs: { href: '#teams' }}, 'Link Name'), val: "[Link Name](http://...)"},
      { lab: 'Image', val: "![alt](http://)"},
      { lab: h('code', 'code'), val: "`code`"},
      { 
        lab: h('pre', h('code', "import CooliMod from '@blockModules';")), 
        val: h('pre', "```\nimport CooliMod from '@blockModules';\n```") 
      },
      { 
        lab: h('a', { attrs: { href: 'https://stackedit.io/', target: '_blank' }}, 'Full MD Editor'), 
        val: "[Full MD Editor](https://stackedit.io/)"
      }
    ]
  }
}
