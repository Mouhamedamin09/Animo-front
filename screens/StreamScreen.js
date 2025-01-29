import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Platform, 
  StatusBar as RNStatusBar 
} from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';

const StreamScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  // Extract parameters from route
  const { videoUrl, subtitleUrl, intro, outro } = route.params || {};

  const [subtitles, setSubtitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orientationLocked, setOrientationLocked] = useState(false);
  const webViewRef = useRef(null);

  // Extract and sanitize intro and outro parameters
  const introStart = intro?.start > 0 ? intro.start : null;
  const introEnd   = intro?.end > 0   ? intro.end   : null;
  const outroStart = outro?.start > 0   ? outro.start : null;

  // Lock orientation & hide UI elements
  useEffect(() => {
    const setupScreen = async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
        setOrientationLocked(true);
      } catch (error) {
        console.error('Error locking orientation:', error);
        setOrientationLocked(true);
      }

      navigation.setOptions({ headerShown: false });
      RNStatusBar.setHidden(true, 'fade');
      if (Platform.OS === 'android') {
        await NavigationBar.setVisibilityAsync('hidden');
      }
    };

    setupScreen();

    // On cleanup => reset orientation & UI
    return () => {
      const cleanup = async () => {
        try {
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT
          );
        } catch (error) {
          console.error('Error resetting orientation:', error);
        }
        RNStatusBar.setHidden(false, 'fade');
        if (Platform.OS === 'android') {
          await NavigationBar.setVisibilityAsync('visible');
        }
      };
      cleanup();
    };
  }, [navigation]);

  // Fetch or parse subtitles if we have a subtitle URL
  useEffect(() => {
    const fetchAndProcessSubtitles = async () => {
      if (!subtitleUrl) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(subtitleUrl, { responseType: 'text' });
        const parsedSubtitles = parseVTT(response.data);
        setSubtitles(parsedSubtitles);
      } catch (error) {
        console.error('Error fetching or parsing subtitles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessSubtitles();
  }, [subtitleUrl]);

  const parseVTT = (vttContent) => {
    if (!vttContent || typeof vttContent !== 'string') {
      console.error('Invalid VTT content:', vttContent);
      return [];
    }

    const lines = vttContent.split('\n');
    const subtitles = [];
    let i = 0;

    if (lines[0].trim().toUpperCase() === 'WEBVTT') {
      i = 1; // skip the WEBVTT header
    }

    const timestampRegex = /^(\d{2}:)?\d{2}:\d{2}\.\d{3}\s-->\s(\d{2}:)?\d{2}:\d{2}\.\d{3}/;

    while (i < lines.length) {
      const line = lines[i].trim();
      if (line === '') {
        i++;
        continue;
      }

      if (timestampRegex.test(line)) {
        const [startStr, endStr] = line.split('-->').map(s => s.trim());
        const startTime = convertToSeconds(startStr);
        const endTime = convertToSeconds(endStr);

        i++;
        let textLines = [];
        while (
          i < lines.length &&
          lines[i].trim() !== '' &&
          !timestampRegex.test(lines[i].trim())
        ) {
          let textLine = lines[i].trim();
          // remove HTML tags
          textLine = textLine.replace(/<\/?[^>]+(>|$)/g, '').trim();
          textLines.push(textLine);
          i++;
        }

        const text = textLines.join(' ');
        subtitles.push({ startTime, endTime, text });
      } else {
        i++;
      }
    }
    return subtitles;
  };

  const convertToSeconds = (timeStr) => {
    if (!timeStr) {
      return 0;
    }
    const parts = timeStr.split(':');
    let hours = 0, minutes = 0, seconds = 0, milliseconds = 0;

    if (parts.length === 3) {
      [hours, minutes, seconds] = parts;
    } else if (parts.length === 2) {
      [minutes, seconds] = parts;
    } else {
      console.error('Unexpected time format:', timeStr);
      return 0;
    }

    const secParts = seconds.split('.');
    if (secParts.length === 2) {
      [seconds, milliseconds] = secParts;
    } else {
      seconds = secParts[0];
    }

    const totalSeconds =
      parseInt(hours, 10) * 3600 +
      parseInt(minutes, 10) * 60 +
      parseInt(seconds, 10) +
      parseFloat(`0.${milliseconds}`);
    return totalSeconds;
  };

  /**
   * Build the HTML for the WebView with Hls.js integrated for ABR.
   */
  const createHtmlContent = () => {
    // Some optional safety checks:
    // introStart, introEnd, and outroStart are already sanitized to be either >0 or null

    // Updated CSS with lighter subtitle styling
    const baseCSS = `
      body {
        margin: 0; padding: 0; background-color: black; 
        display: flex; justify-content: center; align-items: center;
        width: 100vw; height: 100vh; overflow: hidden; position: relative;
      }
      #videoContainer {
        position: relative; width: 100%; height: 100%; overflow: hidden;
        display: flex; justify-content: center; align-items: center;
      }
      video {
        width: 100%; height: 100%; object-fit: contain;
        background-color: black; transition: transform 0.1s ease-out;
      }
      #subtitle {
        position: absolute; bottom: 5%; left: 50%; transform: translateX(-50%);
        width: 90%; text-align: center; color: white; font-size: 18px; font-weight: bold;
        text-shadow:
          1px 1px 2px rgba(0, 0, 0, 0.8),
          -1px -1px 2px rgba(0, 0, 0, 0.8);
        pointer-events: none;
      }
      /* --- Skip Intro Button --- */
      #skipIntroBtn {
        display: none; 
        position: absolute; top: 10%; right: 5%;
        background-color: rgba(0,0,0,0.5); /* Transparent background */
        color: #fff; padding: 10px 20px; border: none; 
        border-radius: 8px; cursor: pointer; font-size: 16px;
        z-index: 999;
      }
      #skipIntroBtn:hover {
        background-color: rgba(0,0,0,0.7);
      }
      /* --- Next Episode Button --- */
      #nextEpisodeBtn {
        display: none; 
        position: absolute; top: 20%; right: 5%;
        background-color: rgba(0,0,0,0.5);
        color: #fff; padding: 10px 20px; border: none;
        border-radius: 8px; cursor: pointer; font-size: 16px;
        z-index: 999;
      }
      #nextEpisodeBtn:hover {
        background-color: rgba(0,0,0,0.7);
      }
    `;

    // Subtitles script remains unchanged
    const subtitlesScript = subtitles.length > 0 ? `
      const subtitles = ${JSON.stringify(subtitles)};
      videoPlayer.ontimeupdate = () => {
        const currentTime = videoPlayer.currentTime;
        const activeSubtitle = subtitles.find(
          (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
        );
        subtitleElement.textContent = activeSubtitle ? activeSubtitle.text : '';
      };
    ` : `
      // No subtitles
      videoPlayer.ontimeupdate = () => {};
    `;

    // Intro/Outro logic with updated conditions
    const introOutroLogic = `
      // We'll track if we've already shown or used skip-intro
      let skipIntroUsed = false;
      let nextEpisodeUsed = false;

      videoPlayer.addEventListener('timeupdate', () => {
        const ct = videoPlayer.currentTime;

        // 1) Show/hide Skip Intro Button only if introStart and introEnd are set and greater than 0
        ${introStart !== null && introEnd !== null ? `
          if (ct >= ${introStart} && ct < ${introEnd} && !skipIntroUsed) {
            skipIntroBtn.style.display = 'block';
          } else {
            skipIntroBtn.style.display = 'none';
          }
        ` : `
          // No intro to skip
          skipIntroBtn.style.display = 'none';
        `}

        // 2) Show/hide Next Episode Button only if outroStart is set and greater than 0
        ${outroStart !== null ? `
          if (ct >= ${outroStart} && !nextEpisodeUsed) {
            nextEpisodeBtn.style.display = 'block';
          } else {
            nextEpisodeBtn.style.display = 'none';
          }
        ` : `
          // No next episode to show
          nextEpisodeBtn.style.display = 'none';
        `}
      });

      ${introStart !== null && introEnd !== null ? `
        skipIntroBtn.addEventListener('click', () => {
          videoPlayer.currentTime = ${introEnd};
          skipIntroUsed = true;
          skipIntroBtn.style.display = 'none';
        });
      ` : `
        // No Skip Intro button functionality
      `}

      ${outroStart !== null ? `
        // Press nextEpisode => postMessage to React Native
        nextEpisodeBtn.addEventListener('click', () => {
          nextEpisodeUsed = true;
          nextEpisodeBtn.style.display = 'none';
          window.ReactNativeWebView.postMessage(JSON.stringify({type: 'NEXT_EPISODE'}));
        });
      ` : `
        // No Next Episode button functionality
      `}
    `;

    // Zoom functionality script remains unchanged
    const zoomScript = `
      let initialDistance = null;
      let initialScale = 1;
      let currentScale = 1;
      const minScale = 1;
      const maxScale = 3;

      function getDistance(touches) {
        const [touch1, touch2] = touches;
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
      }

      videoContainer.addEventListener('touchstart', function(e) {
        if (e.touches.length === 2) {
          initialDistance = getDistance(e.touches);
          initialScale = currentScale;
          e.preventDefault();
        }
      }, { passive: false });

      videoContainer.addEventListener('touchmove', function(e) {
        if (e.touches.length === 2 && initialDistance !== null) {
          const currentDistance = getDistance(e.touches);
          const scaleChange = currentDistance / initialDistance;
          let newScale = initialScale * scaleChange;
          newScale = Math.max(minScale, Math.min(newScale, maxScale));
          currentScale = newScale;
          videoPlayer.style.transform = 'scale(' + newScale + ')';
          e.preventDefault();
        }
      }, { passive: false });

      videoContainer.addEventListener('touchend', function(e) {
        if (e.touches.length < 2) {
          initialDistance = null;
        }
      }, { passive: false });
    `;

    // Hls.js integration script
    const hlsScript = `
      // Initialize Hls.js for ABR
      if (Hls.isSupported()) {
        var hls = new Hls({
          // Optional Hls.js config here
          // For example, you can set the max/min auto level
          // maxAutoLevel: 5,
          // minAutoLevel: 0,
          // autoStartLoad: true,
          // etc.
        });
        hls.loadSource("${videoUrl}");
        hls.attachMedia(videoPlayer);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          videoPlayer.play();
        });

        // Optional: Listen to level switch events
        hls.on(Hls.Events.LEVEL_SWITCHED, function(event, data) {
          // You can access the current level via data.level
          // console.log('Current level:', data.level);
        });

        // Handle errors
        hls.on(Hls.Events.ERROR, function(event, data) {
          if (data.fatal) {
            switch(data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('Network error encountered:', data);
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('Media error encountered:', data);
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
      }
      // For browsers with native HLS support (e.g., Safari)
      else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        videoPlayer.src = "${videoUrl}";
        videoPlayer.addEventListener('loadedmetadata', function() {
          videoPlayer.play();
        });
      }
    `;

    // Combine all scripts
    const finalScript = `
      const videoPlayer = document.getElementById('videoPlayer');
      const subtitleElement = document.getElementById('subtitle');
      const skipIntroBtn = document.getElementById('skipIntroBtn');
      const nextEpisodeBtn = document.getElementById('nextEpisodeBtn');
      const videoContainer = document.getElementById('videoContainer');

      // Autoplay the video when can play
      videoPlayer.oncanplay = () => {
        videoPlayer.play();
      };

      ${subtitlesScript}
      ${introOutroLogic}
      ${zoomScript}
      ${hlsScript}
    `;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=0">
        <style>${baseCSS}</style>
      </head>
      <body>
        <div id="videoContainer">
          <video id="videoPlayer" controls></video>
          <div id="subtitle"></div>
          <button id="skipIntroBtn">Skip Intro</button>
          <button id="nextEpisodeBtn">Next Episode</button>
        </div>
        <!-- Include Hls.js from CDN -->
        <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
        <script>${finalScript}</script>
      </body>
      </html>
    `;
  };

  // onMessage handler => when user presses "Next Episode"
  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'NEXT_EPISODE') {
        // Handle "Next Episode" logic.
        // Example: Navigate back or to another episode.
        navigation.goBack();

        // Or if you have a queue of episodes, do:
        // navigation.replace('Stream', { videoUrl: nextEpisodeUrl, ... });
      }
    } catch (error) {
      console.warn('onMessage parse error:', error);
    }
  };

  if (!orientationLocked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: createHtmlContent() }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          scalesPageToFit={false}
          automaticallyAdjustContentInsets={false}
          onMessage={onMessage}
          onLoadEnd={() => {
            // Optionally, immediately play
            if (webViewRef.current) {
              webViewRef.current.injectJavaScript(`
                (function() {
                  var v = document.getElementById('videoPlayer');
                  if (v) {
                    v.play();
                  }
                })();
                true;
              `);
            }
          }}
        />
      )}
    </View>
  );
};

export default StreamScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
});
