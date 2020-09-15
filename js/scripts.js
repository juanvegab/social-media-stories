const state = {
  videos: [],
  videoIndex : 0,
  isLoadingVideos: false,
  getVideosError: false,
  video: document.createElement('video')
};

const $ = (selector) => {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 1) return elements[0];
  return elements;
}

const updateVideoSource = () => state.video.src = state.videos[state.videoIndex].videos.medium.url

const updateNextVideo = () => {
  state.videoIndex++;
  updateVideoSource();
}

const displayVideo = () => {
  const videoRef = state.video;
  updateVideoSource();
  videoRef.controls = false;
  videoRef.muted = true;
  videoRef.autoplay = true;
  videoRef.onended = () => updateNextVideo();
  videoRef.play();
}

const loadContent = () => {
  state.isGettingVideos = true;
  
  const API_KEY = '18311197-948f501854e18999096aef6ee';
  const URL = "https://pixabay.com/api/videos/?key="+API_KEY+"&q=nature&pretty=true&safesearch=true";
  const request = new XMLHttpRequest();

  request.open('GET', URL, true);
  request.onload = () => {
    if (request.status >= 200 && request.status < 400) {
      const data = JSON.parse(request.responseText);
      if (parseInt(data.totalHits) > 0) {
        state.videos = data.hits;
        displayVideo();
      } else {
        console.log('No hits');
      }
    }
  };
  request.onerror = function() {
    state.getVideosError = 'There was an error loading the videos.';
    console.log(state.getVideosError);
  };
  
  request.send();
}

const init = (fn) => {
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(fn, 1);
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

const renderSections = () => {
  const display = $('.vjs-sms-story-display');
  display.appendChild(state.video);
}

init(function() {
  renderSections();
  loadContent();
});
