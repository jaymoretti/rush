import Rush from './rush/';

function encode(videoPath:string) {
  // create video element
  const video = document.createElement('video');
  video.src = videoPath;
  video.autoplay = true;

  document.body.appendChild(video);

  const encoder = new Rush();
  encoder.encode(video, true);
}

function decode(imagePath:string) {
  const decoder = new Rush();
  decoder.decode(imagePath);
}

// encode('./sample/1-banana.mp4');
// encode('./sample/Hammock.mp4');
// encode('./sample/Voyage.mp4');
decode('./sample/1-banana.png');
// decode('./sample/Hammock.png');
// decode('./sample/Voyage.png');