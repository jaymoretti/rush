import Rush from './rush/';


// create video element
const video = document.createElement('video');
video.src = './sample/1-banana.mp4';
video.autoplay = true;

document.body.appendChild(video);

const encoder = new Rush(video);
encoder.encode(true);

