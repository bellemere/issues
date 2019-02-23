移动端的网页如果用rem做自适应布局，可能出现修改系统字体后布局紊乱的情况。因为系统字体修改是全局的，webview也可能受到影响。

解决方法是设置rem后，取实际字体值，与我们预设的rem值进行对比，在此基础上再做一次“缩放”。




```javascript
var num = 20;
var docEl = document.documentElement;
var width = docEl.getBoundingClientRect().width;
var rem = width / num;
rem = parseFloat(rem.toFixed(3));
docEl.style.fontSize = rem + 'px';

var realitySize = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
if (rem !== realitySize) {
  rem = rem * rem / realitySize;
  docEl.style.fontSize = rem + 'px';
}

window.REM = rem;
```

