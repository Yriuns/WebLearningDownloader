chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.executeScript(null, { file: "content_script.js" });
});

function downloadFile(url, onSuccess, arrayOfUrl, zip) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = "blob";
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      if (onSuccess) {
        onSuccess(xhr.response, arrayOfUrl, zip);
      }
    }
  }
  xhr.send(null);
}

function onDownloadComplete(blobData, urls, zip){
  if (count < urls.length) {
    blobToBase64(blobData, function(binaryData){
      // add downloaded file to zip:
      var fileName = urls[count].substring(urls[count].lastIndexOf('/')+1);
      // zip.file(fileName, binaryData, {base64: true});
      zip.file(fileName+".docx", binaryData, {base64: true}); //file"+count+".docx"
      if (count < urls.length -1){
        count++;
        downloadFile(urls[count], onDownloadComplete, urls, zip);
      } else {
          zipAndSaveFiles(zip);
      }
    });
  }
}

var count;
chrome.runtime.onMessage.addListener(function (msg) {
  if ((msg.action === 'download') && (msg.urls !== undefined)) {
    count = 0;
    var zip = new JSZip();
    downloadFile(msg.urls[count], onDownloadComplete, msg.urls, zip);
  }
}

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
  chrome.windows.getLastFocused(function(window) {
    var content = zip.generate(zip);
    var zipName = 'download.zip';
    var dataURL = 'data:application/zip;base64,' + content;
    chrome.downloads.download({
      url:      dataURL,
      filename: zipName,
      saveAs:   true
    });
  });
}