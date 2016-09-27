var isFirst = true;
var loader;
function download(filename, url) {
    var link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
}

function init(event) {
    currentDocument = document.getElementsByName("content_frame")[0].contentWindow.document;
    if (currentDocument.getElementById("downloadbutton") !== null) {
        return;
    }
    if (document.getElementById("loader") === null) {
        loader = document.createElement("div");
        loader.setAttribute("id", "loader");
        loader.style.visibility = 'hidden';
        document.body.appendChild(loader);
    }
    layers = currentDocument.getElementsByClassName("layerbox");
    for (var j = 0; j < layers.length; ++j) {
        var choseAll = document.createTextNode("全选  ");
        tbody = layers[j].firstElementChild.firstElementChild;
        trs = tbody.children;
        for (var i = 0; i < trs.length; ++i) {
            tr = trs[i];
            var td = document.createElement("td");
            td.setAttribute("width", 40);
            var checkBox = document.createElement("input");
            checkBox.setAttribute("type", "checkbox");
            checkBox.setAttribute("class", "chooseFile");
            if (tr.lastElementChild.innerText === "新文件") {
                checkBox.checked = true;
            }
            td.appendChild(checkBox);
            tr.insertBefore(td, tr.children[1]);
            tr.children[0].setAttribute("width", 60);
            tr.children[2].setAttribute("width", 240);
            tr.children[1].insertBefore(checkBox, tr.children[1].firstElementChild);
            if (i === 0) {
                td.appendChild(choseAll);
                td.setAttribute("class", "title");
            }
        }
        checkBoxs = tbody.getElementsByClassName("chooseFile");
        checkBoxs[0].onclick = function(trs, checkBoxs) {
            return function() {
                for (var i = 1; i < trs.length; ++i) {
                    checkBoxs[i].checked = this.checked;
                }
            }
        }(trs, checkBoxs);
    }

    var ImageTab1 = currentDocument.getElementById("ImageTab1");
    var right_center = document.getElementById("right_center");
    var downloadButton = document.createElement("input");
    downloadButton.setAttribute("type", "button");
    downloadButton.setAttribute("id", "downloadbutton");
    downloadButton.value = "下载";
    downloadButton.onclick = function() {
        loader.style.visibility = 'visible';
        var urls = [];
        var k = 0;
        for (; k < layers.length; ++k) {
            if (layers[k].style.visibility !== 'hidden')
                break;
        }
        tbody = layers[k].firstElementChild.firstElementChild;
        trs = tbody.children;
        checkBoxs = tbody.getElementsByClassName("chooseFile");
        urls = [];
        filenames = [];
        for (var i = 1; i < checkBoxs.length; ++i) {
            if (checkBoxs[i].checked === true) {
                url = trs[i].children[2].firstElementChild.href;
                filename = trs[i].childNodes[3].data.match(/getfilelink=(.*)&/)[1];
                urls.push(url);
                filenames.push(filename);
            }
        }
        chrome.runtime.sendMessage({
            action: 'download',
            urls: urls,
            filenames: filenames
        });
    };
    ImageTab1.parentElement.appendChild(downloadButton);
    isFirst = false;
}
init();
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message == "downloadComplete") {
        document.getElementById("loader").style.visibility = 'hidden';
    }
});
