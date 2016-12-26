'use strict'

var isFirst = true;
var loader;

var reg = /http:\/\/learn\.tsinghua\.edu\.cn\/MultiLanguage\/lesson\/student\/download.*/
var iframe = document.getElementsByName("content_frame")[0];
iframe.onload = function() {
    if (reg.test(iframe.contentWindow.location.href))
        init();
};

function init() {
    var idocument = iframe.contentWindow.document;
    if (idocument.getElementById("downloadbutton") !== null) {
        return;
    }
    if (document.getElementById("loader") === null) {
        loader = document.createElement("div");
        loader.setAttribute("id", "loader");
        loader.style.visibility = 'hidden';
        document.body.appendChild(loader);
    }
    var layers = idocument.getElementsByClassName("layerbox");
    for (var j = 0; j < layers.length; ++j) {
        var choseAll = document.createTextNode("全选  ");
        var tbody = layers[j].firstElementChild.firstElementChild;
        var trs = tbody.children;
        for (var i = 0; i < trs.length; ++i) {
            var tr = trs[i];
            var td = document.createElement("td");
            td.setAttribute("width", 40);
            var checkBox = document.createElement("input");
            checkBox.setAttribute("type", "checkbox");
            checkBox.setAttribute("class", "chooseFile");
            if (tr.lastElementChild.textContent.trim() === "新文件") {
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
        var checkBoxs = tbody.getElementsByClassName("chooseFile");
        checkBoxs[0].onclick = function(trs, checkBoxs) {
            return function() {
                for (var i = 1; i < trs.length; ++i) {
                    checkBoxs[i].checked = this.checked;
                }
            }
        }(trs, checkBoxs);
    }

    var ImageTab1 = idocument.getElementById("ImageTab1");
    var right_center = document.getElementById("right_center");
    var downloadButton = document.createElement("input");
    downloadButton.setAttribute("type", "button");
    downloadButton.setAttribute("id", "downloadbutton");
    downloadButton.value = "下载";
    downloadButton.onclick = function() {
        loader.style.visibility = 'visible';
        var k = 0;
        for (; k < layers.length; ++k) {
            if (layers[k].style.visibility !== 'hidden')
                break;
        }
        var archive_name = idocument.getElementsByClassName("info_title")[0].textContent.trim();
        archive_name += '-' + idocument.getElementById(`ImageTab${k + 1}`).textContent.trim();
        var tbody = layers[k].firstElementChild.firstElementChild;
        var trs = tbody.children;
        var checkBoxs = tbody.getElementsByClassName("chooseFile");
        var urls = [];
        var filenames = [];
        for (var i = 1; i < checkBoxs.length; ++i) {
            if (checkBoxs[i].checked === true) {
                var url = trs[i].children[2].firstElementChild.href;
                var str = trs[i].childNodes[3].data;
                var file_reg = str.match(/getfilelink=(.*)(_\d{6,})(\..*)&/) || str.match(/getfilelink=(.*)(\..*)&/);
                if (file_reg === null) {
                    file_reg = str.match(/getfilelink=(.*)&/);
                }
                var filename = file_reg[1] + file_reg[file_reg.length - 1];
                urls.push(url);
                filenames.push(filename);
            }
        }
        chrome.runtime.sendMessage({
            action: 'download',
            urls: urls,
            filenames: filenames,
            archive_name: archive_name + '.zip'
        });
    };
    ImageTab1.parentElement.appendChild(downloadButton);
    isFirst = false;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message == "downloadComplete") {
        document.getElementById("loader").style.visibility = 'hidden';
    }
});
