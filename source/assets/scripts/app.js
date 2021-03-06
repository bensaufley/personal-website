{
  'use strict';

  const buildCodeView = () => {
    document.documentElement.classList.add('js');

    const docHtml = window.html_beautify(document.documentElement.outerHTML, {
            indent_inner_html: true,
            indent_size: 2,
            wrap_line_length: 0
          }).replace(/<br>/gmi, '\n'),
          flexBox = document.createElement('div'),
          preBlock = document.createElement('pre'),
          codeBlock = document.createElement('code'),
          checkBox = document.createElement('input'),
          labelTag = document.createElement('label'),
          main = document.getElementsByTagName('main')[0],
          footer = document.querySelector('.page-footer');

    preBlock.className = 'prettyprint linenums';
    preBlock.appendChild(codeBlock);

    codeBlock.textContent = docHtml;
    codeBlock.className = 'lang-html';

    flexBox.className = 'flex-box';
    flexBox.appendChild(preBlock);

    document.body.insertBefore(flexBox, main);

    flexBox.appendChild(main);
    flexBox.appendChild(footer);

    window.PR.prettyPrint();

    checkBox.type = 'checkbox';
    checkBox.id = 'show_code_view';
    checkBox.checked = true;
    labelTag.htmlFor = 'show_code_view';
    labelTag.textContent = 'Show Code View';

    document.body.insertBefore(checkBox, flexBox);
    document.body.insertBefore(labelTag, flexBox);
  };

  const onReady = () => {
    buildCodeView();

    window.WebFont.load({ google: { families: ['Lato:300,300i,700,700i'] } });
  };

  if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
    onReady();
  } else {
    document.addEventListener('DOMContentLoaded', onReady);
  }
}
