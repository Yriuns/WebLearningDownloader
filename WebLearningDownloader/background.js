chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.executeScript(null, { file: "content_script.js" });
});

function downloadFile(url, filename, onSuccess, arrayOfUrl, arrayOfFilename, zip) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = "blob";
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (onSuccess) {
                onSuccess(xhr.response, arrayOfUrl, arrayOfFilename, zip);
            }
        }
    }
    xhr.send(null);
}

function onDownloadComplete(blobData, urls, filenames, zip) {
    if (count < urls.length) {
        blobToBase64(blobData, function(binaryData) {
            var filename = filenames[count];
            zip.file(filename, binaryData, { base64: true });
            if (count < urls.length - 1) {
                count++;
                downloadFile(urls[count], filenames[count], onDownloadComplete, urls, filenames, zip);
            } else {
                zipAndSaveFiles(zip);
            }
        });
    }
}

var count;
chrome.runtime.onMessage.addListener(function(msg) {
    if ((msg.action === 'download') && (msg.urls !== undefined)) {
        chrome.tabs.insertCSS(null, {file: "mycss.css"});
        count = 0;
        var zip = new JSZip();
        downloadFile(msg.urls[count], msg.filenames[count], onDownloadComplete, msg.urls, msg.filenames, zip);
    }
});

function blobToBase64(blob, callback) {
    var reader = new FileReader();
    reader.onload = function() {
        var dataUrl = reader.result;
        var base64 = dataUrl.split(',')[1];
        callback(base64);
    };
    reader.readAsDataURL(blob);
}

function zipAndSaveFiles(zip) {
    zip.generateAsync({ type: "base64" })
        .then(function(content) {
            url = "data:application/zip;base64," + content;
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {message: "downloadComplete"}, function(response) {
                });
            });
            chrome.downloads.download({
                url: url,
                filename: 'archive.zip',
                saveAs: true
            });
        });
}

