const storedState = localStorage.getItem('currentPageAndVideo');
const state = {
  ...{
    videosPerRound: 5,
    currentPage: 1,
    videos: [],
    videoIndex : 0,
    getVideosError: false,
    video: document.createElement('video'),
    isStoryChangeAllowed: true,
    mouseDownStart: 0,
    totalVideos: 0,
    isSoundOn: false,
  }, ...JSON.parse(storedState)
};

// =========== Utils Functions =========== 
const $ = (selector) => {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 1) return elements[0];
  return elements;
}

const storePagingData = () => {
  localStorage.setItem('currentPageAndVideo', JSON.stringify({
    currentPage: state.currentPage,
    videoIndex : state.videoIndex,
  }));
}

const preventContextOnHold = (event) => {
  event = event || window.event;
  if (event.stopPropagation) event.stopPropagation();
  // if (event.preventDefault) event.preventDefault();
  event.cancelBubble = true;
  return false;
}
// =========== Utils Functions =========== 



// =========== Progress Bars Functions =========== 
const updateProgressBarValue = (progress) => {
  const videoRef = state.video;
  const currentVideo = getCurrentVideo();
  if (videoRef.currentTime && videoRef.duration) {
    const currentVideoProgress = Math.round((100 * videoRef.currentTime) / videoRef.duration);
    $(`#progress-${currentVideo.id}`).value = progress !== undefined ? progress : currentVideoProgress;
  }
}

const createProgressBars = () => {
  const progressWrapper = $('.sms-progress');
  let bar;
  (state.videos).forEach((video, index) => {
    bar = document.createElement('progress');
    bar.id = `progress-${video.id}`;
    bar.max = 100;
    bar.value = state.videoIndex > index ? 100 : 0;
    progressWrapper.appendChild(bar);
  });
}

const clearProgressBars = () => {
  const progressWrapper = $('.sms-progress');
  progressWrapper.innerHTML = '';
}
// =========== Progress Bars Functions =========== 



// =========== Control Buttons Handling =========== 

const setUpButtons = () => {
  $('.sms-button-prev').onclick = () => {
    console.log('click');
    loadPrevVideo();
  }
  $('.sms-button-next').onclick = () => {
    console.log('click');
    loadNextVideo();
  }
  const bothButtons = $('.sms-button');
  bothButtons.forEach((button) => {
    button.oncontextmenu = () => false;
    // button.ontouchstart = (e) => e.bubbles = false;
    button.onpointerdown = () => pauseVideo();
    button.onpointerup = () => mouseIsUp();
  });
  
  const soundButton = $('.sms-sound-toggle');
  soundButton.onclick = () => {
    state.video.muted = state.isSoundOn;
    soundButton.innerHTML = state.isSoundOn ? 'Sound On' : 'Sound Off';
    state.isSoundOn = !state.isSoundOn;
  }
}

// =========== Control Buttons Handling =========== 



// =========== Video Handling =========== 
const updateVideoSource = () => state.video.src = state.videos[state.videoIndex].videos.medium.url;
const getCurrentVideo = () => state.videos[state.videoIndex];

const loadNextVideo = () => {
  if (!state.isStoryChangeAllowed) return;
  if (state.totalVideos === state.videoIndex+1) return loadFirstPage();

  updateProgressBarValue(100);

  if(state.videoIndex+1 === state.videosPerRound) return loadNextPage();
  state.videoIndex++;
  updateVideoSource();
  storePagingData();
}

const loadPrevVideo = () => {
  if (!state.isStoryChangeAllowed) return;
  updateProgressBarValue(0);

  if(state.videoIndex === 0) {
    if (state.currentPage === 1) {
      state.videoIndex = 0;  
    } else {
      return loadPrevPage();
    }
  } else {
    state.videoIndex--;
  }

  updateProgressBarValue(0);
  updateVideoSource();
  storePagingData();
}

const pauseVideo = () => {
  const videoRef = state.video;
  videoRef.pause();
  state.mouseDownStart = (new Date()).getTime();
}

const mouseIsUp = () => {
  const mouseDownEnd = (new Date()).getTime();
  const holdTime = mouseDownEnd - state.mouseDownStart;

  if (holdTime > 700) {
    state.isStoryChangeAllowed = false;
  } else {
    state.isStoryChangeAllowed = true;
  }
  state.video.play();
}

const displayVideo = () => {
  const videoRef = state.video;
  updateVideoSource();
  videoRef.controls = false;
  videoRef.muted = true;
  videoRef.autoplay = true;
  videoRef.playsinline = true;
  videoRef.disablePictureInPicture = true;
  videoRef.setAttribute("tabIndex", "-1");
  videoRef.onended = () => {
    state.isStoryChangeAllowed = true;
    loadNextVideo();
  }
  videoRef.ontimeupdate = () => updateProgressBarValue();
  videoRef.play();
}
// =========== Video Handling =========== 

const startVideosSetup = () => {
  createProgressBars();
  displayVideo();
};

const cleanBarsAndLoadContent = () => {
  clearProgressBars();
  loadContent();
}

const loadFirstPage = () => {
  state.currentPage = 0;
  state.videoIndex = 0;
  cleanBarsAndLoadContent();
}

const loadNextPage = () => {
  state.currentPage++;
  state.videoIndex = 0;
  cleanBarsAndLoadContent();
}

const loadPrevPage = () => {
  state.currentPage--;
  state.videoIndex = state.videosPerRound - 1;
  cleanBarsAndLoadContent();
}

const loadContent = () => {  
  const API_KEY = '18311197-948f501854e18999096aef6ee';
  const URL = `https://pixabay.com/api/videos/?key=${API_KEY}&q=surf&safesearch=true&per_page=${state.videosPerRound}&page=${state.currentPage}`;
  const request = new XMLHttpRequest();

  request.open('GET', URL, true);
  request.onload = () => {
    if (request.status >= 200 && request.status < 400) {
      const data = JSON.parse(request.responseText);
      if (parseInt(data.totalHits) > 0) {
        state.videos = data.hits;
        state.totalVideos = data.total;
        startVideosSetup();
      } else {
        console.log('No hits');
      }
    }
  };
  request.onerror = () => {
    state.getVideosError = 'There was an error loading the videos.';
    console.log(state.getVideosError);
  };
  request.send();
}

const init = (fn) => {
  if (document.readyState === "complete"
    || document.readyState === "interactive") {
    setTimeout(fn, 1);
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

const renderSections = () => {
  const display = $('.sms-story-display');
  display.appendChild(state.video);
  setUpButtons();
}

init(function() {
  renderSections();
  loadContent();
});