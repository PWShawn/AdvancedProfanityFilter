/* eslint-disable no-console */

import Page from './page';

// - Doesn't work with iframes
// - Shadow DOM
// - Stop looking after possible match?
// - Case sensitive?
// - Disable APF on page before run?
// - this.data: any
export default class WebAudioDetector {
  found: boolean;
  observer: MutationObserver;
  data: any;
  search: string;
  searchRegex: RegExp;

  static observerConfig: MutationObserverInit = {
    characterData: true,
    characterDataOldValue: true,
    childList: true,
    subtree: true,
  };

  constructor(search: string) {
    this.found = false;
    this.search = search;
    this.data = {};
    this.searchRegex = new RegExp(`${search}`, 'gi');
  }

  searchElementMode(mutations: MutationRecord[]) {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node: HTMLElement) => {
        if (!Page.isForbiddenNode(node)) {
          if (node.textContent.match(detector.searchRegex)) {
            detector.data[window.location.host] = {
              className: node.classList[0],
              mode: 'element',
              subtitleSelector: '',
              tagName: node.nodeName,
            };
            console.log('[APF] Possible match element found:', node, detector.data);
          }
        }
      });

      if (mutation.addedNodes.length === 0 && mutation.target && !Page.isForbiddenNode(mutation.target)) {
        if (mutation.target.textContent.match(detector.searchRegex)) {
          if (mutation.target.nodeName === '#text') {
            console.log('[APF] Possible text element found:', mutation.target);
          } else {
            console.warn('[APF] Deep mode may be required!');
            console.log('[APF] Possible target element found:', mutation.target);
          }
        }
      }
    });
  }

  searchVideoCueMode() {
    const videos = document.querySelectorAll('video');
    if (videos.length) {
      videos.forEach((video) => {
        // let found = false;
        for (let i = 0; i < video.textTracks.length; i++) {
          const track = video.textTracks[i];
          for (let j = 0; j < track.activeCues.length; j++) {
            const activeCue = track.activeCues[j] as VTTCue;
            if (activeCue.text.toLowerCase().includes(this.search.toLowerCase())) {
              // found = true;
              const data = {};
              data[window.location.host] = {
                mode: 'cue',
                videoCueLanguage: track.language
              };
              console.log(`[APF] Found Video TextTrack match: "${activeCue.text}"`, video, track);
              console.log(`[APF] Possible config:\n${JSON.stringify(data, null, 2)}`);
              if (videos.length > 1) {
                console.log(`['APF'] Warning, ${videos.length} video elements found. You'll likely need to add a videoSelector to the rule.`);
              }
            }
          }
        }

        // if (!found) {
        //   console.log('[APF] No match found in the Video Text Track', video);
        // }
      });
    } else {
      // console.log('[APF] No videos found: Are you sure the there is a video on the page?');
    }
  }

  run() {
    if (this.search) {
      this.observer = new MutationObserver(detector.searchElementMode);
      this.observer.observe(document, WebAudioDetector.observerConfig);
      this.searchVideoCueMode();
    }
  }
}

const search = window.prompt('With the video playing, please enter a word in the captions to watch for:');
const detector = new WebAudioDetector(search);
detector.run();
