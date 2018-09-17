'use strict'

var loader
var iframe = document.getElementsByName("content_frame")[0]

iframe.onload = function() {
    var download_page = /http:\/\/learn\.tsinghua\.edu\.cn\/MultiLanguage\/lesson\/student\/download.*/
    var course_page = /http:\/\/learn\.tsinghua\.edu\.cn\/MultiLanguage\/lesson\/student\/MyCourse\.jsp\?language=.*/
    var curr_url = iframe.contentWindow.location.href
    if (download_page.test(curr_url)) {
        init_downloader()
    } else if (course_page.test(curr_url)) {
        init_notifier()
    }
}

function init_notifier() {
    var idocument = iframe.contentWindow.document
    var spans = idocument.getElementsByClassName("red_text")
    for (var i = 0; i < spans.length; ++i) {
        if (spans[i].textContent === "0") {
            spans[i].style.color = "black"
        }
    }
}
function init_loader() {
    if (document.getElementById("loader") === null) {
        loader = document.createElement("div")
        loader.setAttribute("id", "loader")
        loader.style.visibility = 'hidden'
        document.body.appendChild(loader)
    }
}

function build_checkbox(checked) {
    var checkBox = document.createElement("input")
    checkBox.setAttribute("type", "checkbox")
    checkBox.setAttribute("class", "chooseFile")
    checkBox.checked = checked
    return checkBox
}

function init_checkbox(idocument) {
    var layers = idocument.getElementsByClassName("layerbox")
    for (var j = 0; j < layers.length; ++j) {
        var choseAll = document.createTextNode("全选  ")
        var tbody = layers[j].firstElementChild.firstElementChild
        var trs = tbody.children
        for (var i = 0; i < trs.length; ++i) {
            var tr = trs[i]
            var td = document.createElement("td")
            td.setAttribute("width", 40)
            var checked = tr.lastElementChild.textContent.trim() === "新文件"
            var checkBox = build_checkbox(checked)
            td.appendChild(checkBox)
            tr.insertBefore(td, tr.children[1])
            tr.children[0].setAttribute("width", 60)
            tr.children[2].setAttribute("width", 240)
            tr.children[1].insertBefore(checkBox, tr.children[1].firstElementChild)
            if (i === 0) {
                td.appendChild(choseAll)
                td.setAttribute("class", "title")
            }
        }
        var checkBoxs = tbody.getElementsByClassName("chooseFile")
        checkBoxs[0].onclick = function(trs, checkBoxs) {
            return function() {
                for (var i = 1; i < trs.length; ++i) {
                    checkBoxs[i].checked = this.checked
                }
            }
        }(trs, checkBoxs)
    }
}

function get_page_index(idocument) {
    var layers = idocument.getElementsByClassName("layerbox")
    for (var k = 0; k < layers.length; ++k) {
        if (layers[k].style.visibility !== 'hidden')
            return k
    }
}

function parse_filename(str) {
    var file_reg = str.match(/getfilelink=(.*?)(_\d{6,})*(\..*)&/)
    if (file_reg === null) {
        file_reg = str.match(/getfilelink=(.*)&/)
    }
    var filename = file_reg[1] + file_reg[file_reg.length - 1]
    return filename
}

function fetch_file_info(idocument) {
    var k = get_page_index(idocument)
    var layers = idocument.getElementsByClassName("layerbox")
    var archive_name = idocument.getElementsByClassName("info_title")[0].textContent.trim()
    archive_name += '-' + idocument.getElementById(`ImageTab${k + 1}`).textContent.trim()
    var tbody = layers[k].firstElementChild.firstElementChild
    var trs = tbody.children
    var checkBoxs = tbody.getElementsByClassName("chooseFile")
    var urls = []
    var filenames = []
    for (var i = 1; i < checkBoxs.length; ++i) {
        if (checkBoxs[i].checked === true) {
            var url = trs[i].children[2].firstElementChild.href
            var str = trs[i].childNodes[3].data
            var filename = parse_filename(str)
            urls.push(url)
            filenames.push(filename)
        }
    }
    return {
        "needed": urls.length !== 0,
        "urls": urls,
        "filenames": filenames,
        "archive_name": archive_name + ".zip",
    }
}

function init_download_button(idocument) {
    var ImageTab1 = idocument.getElementById("ImageTab1")
    var downloadButton = document.createElement("input")
    downloadButton.setAttribute("type", "button")
    downloadButton.setAttribute("id", "downloadbutton")
    downloadButton.value = "下载"
    downloadButton.onclick = function() {
        loader.style.visibility = 'visible'
        var info = fetch_file_info(idocument)
        if (!info.needed) return
        chrome.runtime.sendMessage({
            action: 'download',
            urls: info.urls,
            filenames: info.filenames,
            archive_name: info.archive_name
        })
    }
    ImageTab1.parentElement.appendChild(downloadButton)
}

function init_downloader() {
    var idocument = iframe.contentWindow.document
    if (idocument.getElementById("downloadbutton") !== null) {
        return
    }
    init_loader()
    init_checkbox(idocument)
    init_download_button(idocument)
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message == "downloadComplete") {
        document.getElementById("loader").style.visibility = 'hidden'
    }
})
