import './emulator';

const AUDIO_URL = 'https://cdn.creazilla.com/sounds/15511112/mozart-concerto-no-18-in-g-flat-i-allegro-vivace-sound.mp3';
const AUDIO_METADATA: MediaMetadataInit = {
	title: "Sample track",
	artist: "sample",
	artwork: [
		{
			src: "https://i.ytimg.com/vi/dQPi3WUJLwo/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAcsmYIf-1HTEUCkMq-3RLKc__BoA",
			sizes: "320x180",
			type: "image/jpeg",
		},
	],
};

const actions = document.querySelector('#actions') as HTMLDivElement;

function pushAction(label: string) {
	const status = document.createElement('span');
	status.textContent = label;

	actions.append(status);
}

async function createPlayer(src: string, metadata?: MediaMetadataInit) {
	const audio = new Audio(src);
	audio.controls = true;
	audio.loop = true;

	navigator.mediaSession.metadata = new MediaMetadata(metadata);

	function handleAction(details: MediaSessionActionDetails) {
		console.log('MediaSession action:', details);
		pushAction(details.action);
	}

	function handlePause() {
		audio.pause();
		navigator.mediaSession.playbackState = 'paused';		
	}

	function handlePlay() {
		audio.play();
		navigator.mediaSession.playbackState = 'playing';		
	}

	navigator.mediaSession.setActionHandler("play", (details) => {	
		handleAction(details);
		handlePlay();
	});

	navigator.mediaSession.setActionHandler("pause", (details) => {
		handleAction(details);
		handlePause();
	});

	audio.addEventListener('pause', handlePause);
	audio.addEventListener('play', handlePlay);

	navigator.mediaSession.setActionHandler('nexttrack', handleAction);
	navigator.mediaSession.setActionHandler('previoustrack', handleAction);
	navigator.mediaSession.setActionHandler('seekbackward', handleAction);
	navigator.mediaSession.setActionHandler('seekforward', handleAction);
	navigator.mediaSession.setActionHandler('seekto', handleAction);
	navigator.mediaSession.setActionHandler('skipad', handleAction);
	navigator.mediaSession.setActionHandler('stop', handleAction);


	navigator.mediaSession.setPositionState({})
	navigator.mediaSession.playbackState = 'paused';

	return audio;
}

let initialized = false;

async function requestNotificationPermission() {
	const permission = await Notification.requestPermission();
	if (permission === 'granted') return;

	throw new Error('Notification permission is not granted');
}

let player: HTMLAudioElement;
async function tryToInitialize() {
	if (initialized) return;
	initialized = true;

	await requestNotificationPermission();

	player = await createPlayer(AUDIO_URL, AUDIO_METADATA);
	player.play();
		
	document.body.insertAdjacentElement('afterbegin', player);
}

window.addEventListener('pointerup', () => {
	tryToInitialize();
});
