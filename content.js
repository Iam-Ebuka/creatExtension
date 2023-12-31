var recorder = null;
var videoChunks = []; // Store video data chunks

function onAccessApproved(stream) {
  recorder = new MediaRecorder(stream);

  recorder.ondataavailable = function (event) {
    if (event.data.size > 0) {
      videoChunks.push(event.data);

      // Send the current chunk to the API
      sendChunkToAPI(event.data);
    }
  };

  recorder.onstop = function () {
    stream.getTracks().forEach(function (track) {
      if (track.readyState === 'live') {
        track.stop();
      }
    });

    // Send the remaining chunks to the API (if any)
    sendRemainingChunksToAPI();
  };

  recorder.start();
}

function sendChunkToAPI(chunk) {
  // Create a FormData object for the chunk and send it to the API
  var formData = new FormData();
  formData.append("video", chunk, "screen-recording.webm");

  // Send the chunk to the API using a fetch or XMLHttpRequest
  fetch("https://video-upload-api.onrender.com/api/videos", {
    method: "POST",
    body: formData,
    headers: {
      // Set the appropriate Content-Type if required by your API
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Chunk uploaded successfully:", data);
    })
    .catch((error) => {
      console.error("Error uploading chunk:", error);
    });
}

function sendRemainingChunksToAPI() {
  // Iterate through the stored video chunks and send them to the API
  videoChunks.forEach((chunk, index) => {
    sendChunkToAPI(chunk);
  });

  // Clear the videoChunks array
  videoChunks = [];
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "request_recording") {
    console.log("requesting recording");

    sendResponse(`processed: ${message.action}`);

    navigator.mediaDevices
      .getDisplayMedia({
        audio: {
            echoCancellation: true, // Enable echo cancellation
            noiseSuppression: true, // Enable noise suppression
            sampleRate: 44100, // You can adjust this sample rate as needed
          },
        video: {
          width: 1240, 
          height: 647,  
        },
      })
      .then((stream) => {
        onAccessApproved(stream);
      })
      .catch((error) => {
        console.error("Error accessing media:", error);
      });
  }

  if (message.action === "stopvideo") {
    console.log("stopping video");
    sendResponse(`processed: ${message.action}`);
    if (recorder) {
      recorder.stop();
    }
  }
});
