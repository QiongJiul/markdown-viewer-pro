
var $ = document.querySelector.bind(document)

var state = {
  theme: args.theme,
  raw: args.raw,
  themes: args.themes,
  content: args.content,
  compiler: args.compiler,
  custom: args.custom,
  icon: args.icon,
  html: '',
  markdown: '',
  toc: '',
  reload: {
    interval: null,
    ms: 1000,
    md: false,
  },
  _themes: {
    'github': 'light',
    'github-dark': 'dark',
    'almond': 'light',
    // 'air': 'light',
    'awsm': 'light',
    'axist': 'light',
    'bamboo': 'auto',
    'bullframe': 'light',
    'holiday': 'auto',
    'kacit': 'light',
    'latex': 'light',
    'marx': 'light',
    'mini': 'light',
    'modest': 'light',
    'new': 'auto',
    'no-class': 'auto',
    'pico': 'auto',
    'retro': 'dark',
    'sakura': 'light',
    'sakura-vader': 'dark',
    'semantic': 'light',
    'simple': 'auto',
    // 'splendor': 'light',
    'style-sans': 'light',
    'style-serif': 'light',
    'stylize': 'light',
    'superstylin': 'auto',
    'tacit': 'light',
    'vanilla': 'auto',
    'water': 'light',
    'water-dark': 'dark',
    'writ': 'light',
    'custom': 'auto',
  }
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.message === 'reload') {
    location.reload(true)
  }
  else if (req.message === 'theme') {
    state.theme = req.theme
    m.redraw()
  }
  else if (req.message === 'themes') {
    state.themes = req.themes
    m.redraw()
  }
  else if (req.message === 'raw') {
    state.raw = req.raw
    state.reload.md = true
    m.redraw()
  }
  else if (req.message === 'autoreload') {
    clearInterval(state.reload.interval)
  }
})

var oncreate = {
  html: () => {
	update()
  }
}

var onupdate = {
  html: () => {
    if (state.reload.md) {
      state.reload.md = false
      update(true)
    }
  },
  theme: () => {
    if (state.content.mermaid) {
      setTimeout(() => mmd.render(), 0)
    }
  }
}

var update = (update) => {
  scroll(update)

  if (state.content.syntax) {
    setTimeout(() => Prism.highlightAll(), 20)
  }

  if (state.content.mermaid) {
    setTimeout(() => mmd.render(), 40)
  }

  if (state.content.mathjax) {
    setTimeout(() => mj.render(), 60)
  }
}

var render = (md) => {
	state.markdown = md
	chrome.runtime.sendMessage({
		message: 'markdown',
		compiler: state.compiler,
		markdown: frontmatter(state.markdown)
	}, (res) => {
		state.html = res.html
		if (state.content.emoji) {
			state.html = emojinator(state.html)
		}
		if (state.content.mermaid) {
			state.html = state.html.replace(
				/<code class="language-(?:mermaid|mmd)">/gi,
				'<code class="mermaid">'
			)
		}
		if (state.content.toc) {
			state.toc = toc.render(state.html)
		}
		state.html = anchors(state.html)
		m.redraw()
		
		autoroll();
	})
}

var docMainOld = false;

 /**
 * 自动滚动到变化内容
 */
function autoroll() {
	const DISTANCE_TOP_PERCENT = 15; // 距离窗口顶部%
	const distance = (DISTANCE_TOP_PERCENT * window.innerHeight) / 100; 


	 /**
	 * 主要滚动函数
	 */
	function main_autoroll() {
		if (docMainOld !== false && state.content.autoroll === true) {
			const docDiffInfo = docNodeDiff(docMainOld, getPresentDoc(), elementToDescriptor);
			if (docDiffInfo === false) return;
			if (docDiffInfo.head === null) return;

			scrollTo({top: docDiffInfo.head.top - distance, left: 0, behavior: "smooth", duration: 1000});

			((info) => setTimeout(() => {
				console.log(info);
				for (let i = 0; i < info.added.length; i++) {
					const data = info.added[i];
					randeReminder(data[0].top, data[1].top - data[0].top + data[1].height , "#34c155");
				}
				for (let i = 0; i < info.removed.length; i++) {
					const data = info.removed[i];
					randeReminder((data[1].top + data[0].top) / 2, 4, "#a1423d");
				}
			}, Math.abs(docDiffInfo.head.y - distance) / 1000))(docDiffInfo);

		}
		docMainOld = getPresentDoc().cloneNode(true);
	}

	setTimeout(() => {
		styleInit();
		 setTimeout(main_autoroll, docMainOld === false ? 100 : 50);
	}, 50);
}

 /**
 * 渲染提示窗口
 * @param {Number} top 
 * @param {Number} height 
 * @param {String} color 
 */
function randeReminder(top, height, color, clear = false) {
	const transitionS = 0.5
	const lengthExpansionPX = 20;
	let reminderWin = document.querySelector(".reminder-list");
	if (clear && reminderWin !== null) {
		document.querySelector(".reminder-list").remove();
		return;
	}
	const markdownBodyInfo = document.getElementById("_html").getBoundingClientRect();
	let divE = document.createElement("div");
	divE.className = "reminder-win";
	divE.style.top = top + "px";
	divE.style.height = height + "px";
	divE.style.left = markdownBodyInfo.left - lengthExpansionPX + "px";
	divE.style.right = markdownBodyInfo.right - markdownBodyInfo.width - lengthExpansionPX + "px";
	divE.style.backgroundColor = color;
	if (reminderWin === null) {
		reminderWin = document.createElement("div");
		reminderWin.className = "reminder-list";
		document.body.appendChild(reminderWin);
		let styleE = document.createElement("style");
		styleE.type = "text/css";
		styleE.textContent = `.reminder-win { position: absolute; pointer-events: none; transition: ${transitionS}s; opacity: 0; }`
		reminderWin.appendChild(styleE);
	}
	reminderWin.appendChild(divE);
	((element) => setTimeout(() => {
		element.style.opacity = ".7";
		((element) => setTimeout(() => {
			element.style.opacity = "0";
		}, transitionS * 1000))(element);
		((element) => setTimeout(() => {
			element.remove();
		}, transitionS * 2000))(element);
	}, 5))(divE);
}

 /**
 * 元素转换到位置描述信息
 * @param {HTMLElement} element 
 */
function elementToDescriptor(element) {
	if (element.nodeType === 3 || element.nodeName === "BR") element = element.parentNode;
	if (element.closest(".footnote-item") !== null)
		element = document.getElementById(
			element
			.closest(".footnote-item")
			.querySelector("a.footnote-backref")
			.getAttribute("href")
			.slice(1)
		).parentNode.parentNode;
	let element_data = element.getBoundingClientRect();
	// console.log(element);
	return {
		top: element_data.y + window.scrollY,
		height: element_data.height,
		y: element_data.y
	};
}

 /**
 * DOM差异
 * @param {HTMLElement} docNode_old 
 * @param {HTMLElement} docNode_new 
 * @param {Function} dispose 
 */
function docNodeDiff(docNode_old, docNode_new, dispose) {
	if (!docNode_old || !docNode_new) return false;
	let treeWalker_old = traversalNodeTreeWalkerAPI(docNode_old);
	let treeWalker_new = traversalNodeTreeWalkerAPI(docNode_new);
	/** @type {{ head: ReturnType <typeof elementToDescriptor>, added: ReturnType <typeof elementToDescriptor>[][], removed: ReturnType <typeof elementToDescriptor>[][]} */
	let result = { head: null, added: [], removed: []};
	let Count = 0;
	let status = {
		Count: false,
		diffElement: false,
		resultHead: false,
		resultTyep: false,
	};
 	let /**@type {HTMLElement}*/ diffElement_old, /**@type {HTMLElement}*/ diffElement_new;
	const reset = function () {
		status.diffElement = false;
		status.resultTyep = true;
		Count = 0;
	}
	while (treeWalker_old.nextNode() && treeWalker_new.nextNode()) {
		if (!status.diffElement) {
			if (!isElementSame(treeWalker_old.currentNode, treeWalker_new.currentNode)) {
				diffElement_old = treeWalker_old.currentNode;
				diffElement_new = treeWalker_new.currentNode;
				status.diffElement = true;

				if (!status.resultHead) {
					result.head = dispose(diffElement_new);
					status.resultHead = true;
				}
			}
		} else {
			Count ++;
			if (isElementSame(diffElement_old, treeWalker_new.currentNode)) {
				treeWalker_new.previousNode();
				result.added.push([dispose(diffElement_new), dispose(treeWalker_new.currentNode)]);
				treeWalker_new.nextNode();
				for (let i = 0; i < Count; i ++) treeWalker_old.previousNode(); 
				reset("added");
			} else if (isElementSame(diffElement_new, treeWalker_old.currentNode)) {
				for (let i = 0; i < Count + 1; i ++) treeWalker_new.previousNode(); 
				result.removed.push([dispose(treeWalker_new.currentNode), dispose(diffElement_new)]);
				treeWalker_new.nextNode();
				reset("removed");
			}
		}
		if (Count >= 32)  {
			if (!status.resultHead) result.head = dispose(diffElement_new);
			return result;
		}
		if (status.resultHead) if (elementToDescriptor(treeWalker_new.currentNode).top > (result.head.top + window.innerHeight)) break;

	}
	return result;
}

 /**
 * 判断两个元素是否"相同"
 * @param {HTMLElement} e_one 
 * @param {HTMLElement} e_two 
 */
function isElementSame(e_one, e_two) {
	if (e_one.nodeName === "MJX-MATH")
		if (e_one.outerHTML === e_two.outerHTML) {
			return true;
		} else {
			return false;
		}
	if (e_one.textContent !== '') 
		if (e_one.textContent === e_two.textContent) {
			return true;
		} else {
			return false;
		}
	if (e_one.outerHTML === e_two.outerHTML) return true;
	return false
}

 /**
 * 获取TreeWalker对象
 * @param {HTMLElement} node 
 */
function traversalNodeTreeWalkerAPI(node) {
	return document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, filterTreeWalker, false);
}

 /**
 * TreeWalker 筛选函数
 * @param {HTMLElement} node 
 */
function filterTreeWalker(/**@type {HTMLElement}*/ node) {
	const classNameBlackList = ["table-of-contents"];
	const nodeNameBlackList = ["line", "style", "path", "MJX-ASSISTIVE-MML"];
	const nodeParentNameBlackList = ["MJX-MATH"];
	const nodeNameWhiteList = ["BR", "MJX-MATH"];
	if (nodeNameWhiteList.indexOf(node.nodeName) !== -1) return NodeFilter.FILTER_ACCEPT;
	//拒绝其和其下所有节点
	if (
		classNameBlackList.indexOf(node.className) !== -1 ||
		nodeNameBlackList.indexOf(node.nodeName) !== -1 ||
		nodeParentNameBlackList.indexOf(node.parentNode.nodeName) !== -1
	) return NodeFilter.FILTER_REJECT;
	//跳过当前节点但是接受子节点
	if (
		!(node.childElementCount === 0 || node.childElementCount === undefined) ||
		(node.childElementCount === 0 && node.textContent !== "") ||
		node.textContent === "\n" 
	) return NodeFilter.FILTER_SKIP;

	return NodeFilter.FILTER_ACCEPT;
}

 /**
 * 样式初始化
 */
function styleInit() {
	let pre = document.querySelectorAll(".markdown-body pre[class*=\"language-\"]");
	for (let i = 0; i < pre.length; i++) {
		const element = pre[i];
		element.children[0].setAttribute('data-language', element.className.split('-')[1]);
	}
	const eFigure = document.querySelectorAll(".markdown-body figure:has(img[align=\"center\"])");
	for (let i = 0;  i < eFigure.length; i ++){
		const element = eFigure[i];
		if (element.childElementCount === 1) {
			let tempFigcaption = document.createElement("figcaption");
			tempFigcaption.innerText = element.children[0].alt;
			element.appendChild(tempFigcaption);
		}
	}
}

 /**
 * 获取当前DOM结构
 */
function  getPresentDoc() {
	let doc = document.getElementById("_html");
	if (doc === null) {
		return false;
	}
	return doc;
}

 /**
 * html字符串转换dom
 * @param {String} htmlString 
 */
function htmlToDocumentFragment(htmlString) {
  const range = document.createRange();
  range.selectNode(document.body);
  return range.createContextualFragment(htmlString);
}



function mount () {
  $('pre').style.display = 'none'
  var md = $('pre').innerText
  favicon()

  m.mount($('body'), {
    oninit: () => {
      render(md)
    },
    view: () => {
      var dom = []

      if (state.html) {
        state._themes.custom = state.custom.color

        var color =
          state._themes[state.theme] === 'dark' ||
          (state._themes[state.theme] === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
          ? 'dark' : 'light'

        $('body').classList.remove(...Array.from($('body').classList).filter((name) => /^_theme|_color/.test(name)))
        dom.push(m('link#_theme', {
          onupdate: onupdate.theme,
          rel: 'stylesheet', type: 'text/css',
          href: state.theme !== 'custom' ? chrome.runtime.getURL(`/themes/${state.theme}.css`) : '',
        }))
        $('body').classList.add(`_theme-${state.theme}`, `_color-${color}`)

        if (state.content.syntax) {
          dom.push(m('link#_prism', {
            rel: 'stylesheet', type: 'text/css',
            href: chrome.runtime.getURL(`/vendor/${color === 'dark' ? 'prism-okaidia' : 'prism'}.min.css`),
          }))
        }

        var theme =
          (/github(-dark)?/.test(state.theme) ? 'markdown-body' : 'markdown-theme') +
          (state.themes.width !== 'auto' ? ` _width-${state.themes.width}` : '')

        if (state.raw) {
          if (state.content.syntax) {
            dom.push(m('#_markdown', {oncreate: oncreate.html, onupdate: onupdate.html, class: theme},
              m.trust(`<pre class="language-md"><code class="language-md">${_escape(state.markdown)}</code></pre>`)
            ))
          }
          else {
            dom.push(m('pre#_markdown', {oncreate: oncreate.html, onupdate: onupdate.html}, state.markdown))
          }
        }
        else {
          dom.push(m('#_html', {oncreate: oncreate.html, onupdate: onupdate.html, class: theme},
            m.trust(state.html)
          ))
        }

        if (state.content.toc) {
          dom.push(m('#_toc.tex2jax-ignore', m.trust(state.toc)))
		  // 目录toc body左侧padding
          // state.raw ? $('body').classList.remove('_toc-left') : $('body').classList.add('_toc-left')
        }

        if (state.theme === 'custom') {
          dom.push(m('style', {type: 'text/css'}, state.custom.theme))
        }
      }

      return dom
    }
  })
}

var anchors = (html) =>
  html.replace(/(<h[1-6] id="(.*?)">)/g, (header, _, id) =>
    header +
    '<a class="anchor" name="' + id + '" href="#' + id + '">' +
    '<span class="octicon octicon-link"></span></a>'
  )

var toc = (() => {
  var walk = (regex, string, group, result = [], match = regex.exec(string)) =>
    !match ? result : walk(regex, string, group, result.concat(!group ? match[1] :
      group.reduce((all, name, index) => (all[name] = match[index + 1], all), {})))
  return {
    render: (html) =>
      walk(
        /<h([1-6]) id="(.*?)">(.*?)<\/h[1-6]>/gs,
        html,
        ['level', 'id', 'title']
      )
      .reduce((toc, {id, title, level}) => toc +=
        '<div class="_ul">'.repeat(level) +
        '<a href="#' + id + '">' + title.replace(/<a[^>]+>/g, '').replace(/<\/a>/g, '') + '</a>' +
        '</div>'.repeat(level)
      , '')
  }
})()

var frontmatter = (md) => {
  if (/^-{3}[\s\S]+?-{3}/.test(md)) {
    var [, yaml] = /^-{3}([\s\S]+?)-{3}/.exec(md)
    var title = /title: (?:'|")*(.*)(?:'|")*/.exec(yaml)
    title && (document.title = title[1])
  }
  else if (/^\+{3}[\s\S]+?\+{3}/.test(md)) {
    var [, toml] = /^\+{3}([\s\S]+?)\+{3}/.exec(md)
    var title = /title = (?:'|"|`)*(.*)(?:'|"|`)*/.exec(toml)
    title && (document.title = title[1])
  }
  return md.replace(/^(?:-|\+){3}[\s\S]+?(?:-|\+){3}/, '')
}

var favicon = () => {
  var favicon = document.createElement('link')
  favicon.rel = 'icon'
  favicon.href = chrome.runtime.getURL(`/icons/${state.icon}/16x16.png`)
  $('head').appendChild(favicon)
}

var _escape = (str) =>
  str.replace(/[&<>]/g, (tag) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
  }[tag] || tag))

if (document.readyState === 'complete') {
  mount()
}
else {
  var timeout = setInterval(() => {
    if (document.readyState === 'complete') {
      clearInterval(timeout)
      mount()
    }
  }, 0)
}
