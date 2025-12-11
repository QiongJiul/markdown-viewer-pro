
var md = {compilers: {}}

md.compilers['markdown-it'] = (() => {
  var defaults = {
    breaks: false,
    html: true,
    linkify: true,
    typographer: false,
    xhtmlOut: false,
    langPrefix: 'language-',
    quotes: '“”‘’',
    // plugins
    abbr: false,
    attrs: true,
    cjk: false,
    deflist: true,
    footnote: true,
    ins: true,
    mark: true,
    sub: false,
    sup: false,
    tasklists: true,
	mtoc: true,
	githubAlerts: true,
	figures: true,
	spoiler: true
  }

  var description = {
    breaks: 'Convert \\n in paragraphs into <br>',
    html: 'Enable HTML tags in source',
    linkify: 'Autoconvert URL-like text to links',
    typographer: 'Enable some language-neutral replacement + quotes beautification',
    xhtmlOut: 'Use / to close single tags (<br />)',
    // plugins
    abbr: 'Abbreviation <abbr>\n*[word]: Text',
    attrs: 'Custom attributes\n# header {#id}',
    cjk: 'Suppress linebreaks between east asian characters',
    deflist: 'Definition list <dl>\ntitle\n: definition',
    footnote: 'Footnotes\nword[^1]\n[^1]: text',
    ins: 'Inserted text <ins>\n++text++',
    mark: 'Marked text <mark>\n==text==',
    sub: 'Subscript <sub>\n~text~',
    sup: 'Superscript <sup>\n^text^',
    tasklists: 'Task lists\n- [x]\n- [ ]',
	mtoc: 'Add a table of contents to the document\n [toc]',
	githubAlerts: 'Support GitHub-style alerts for markdown-it.',
	figures: 'Render images occurring by itself in a paragraph as , similar to pandoc\'s implicit figures.\n<figure><img ...></figure>',
	spoiler: 'Plugins to hide content.\n !!text!!'
  }

  var ctor = ({storage: {state}}) => ({
    defaults,
    description,
    compile: (markdown) =>
      mdit.mdit(state['markdown-it'])
        .use(mdit.anchor, {
          slugify: (s) => new mdit.slugger().slug(s)
        })
        .use(state['markdown-it'].abbr ? mdit.abbr : () => {})
        .use(state['markdown-it'].attrs ? mdit.attrs : () => {})
        .use(state['markdown-it'].cjk ? mdit.cjk : () => {})
        .use(state['markdown-it'].deflist ? mdit.deflist : () => {})
        .use(state['markdown-it'].footnote ? mdit.footnote : () => {})
        .use(state['markdown-it'].ins ? mdit.ins : () => {})
        .use(state['markdown-it'].mark ? mdit.mark : () => {})
        .use(state['markdown-it'].sub ? mdit.sub : () => {})
        .use(state['markdown-it'].sup ? mdit.sup : () => {})
        .use(state['markdown-it'].tasklists ? mdit.tasklists : () => {})
	    .use(state['markdown-it'].mtoc ? mdit.mtoc : () => {}, {markerPattern: /^\[toc\]/im, includeLevel: [1, 2, 3, 4, 5]})
	    .use(state['markdown-it'].githubAlerts ? mdit.githubAlerts : () => {})
		.use(state['markdown-it'].figures ? mdit.figures : () => {})
	    .use(state['markdown-it'].spoiler ? mdit.spoiler : () => {})
        .render(markdown)
  })

  return Object.assign(ctor, {defaults, description})
})()
