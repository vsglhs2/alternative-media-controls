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

const button = document.querySelector('#button') as HTMLButtonElement;
const statuses = document.querySelector('#statuses') as HTMLDivElement;
const actions = document.querySelector('#actions') as HTMLDivElement;

function pushStatus(label: string) {
	const status = document.createElement('span');
	status.textContent = label;

	statuses.append(status);
}

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

	navigator.mediaSession.setActionHandler("play", () => {
		pushAction('play');

		audio.play();
		navigator.mediaSession.playbackState = 'playing';
	});

	navigator.mediaSession.setActionHandler("pause", () => {
		pushAction('pause');

		audio.pause();
		navigator.mediaSession.playbackState = 'paused';
	});

	navigator.mediaSession.setPositionState({})
	navigator.mediaSession.playbackState = 'paused';

	return audio;
}

async function createNotification() {
	const nf = new Notification('title1', {
		body: 'some notification body',
		tag: '1',
		silent: true,
	});

	nf.addEventListener('click', (event) => {
		event.preventDefault();

		pushStatus('click');
	});

	nf.addEventListener('close', () => {
		pushStatus('close');
	});

	nf.addEventListener('show', () => {
		pushStatus('show');
	});

	nf.addEventListener('error', () => {
		pushStatus('error');
	});

	return nf;
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

button.addEventListener('click', () => {
	if (!initialized) return;

	createNotification().then(notification => {

	});
});