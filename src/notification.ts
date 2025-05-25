const statuses = document.querySelector('#statuses') as HTMLDivElement;

function pushStatus(label: string) {
	const status = document.createElement('span');
	status.textContent = label;

	statuses.append(status);
}

let cleanup: CallableFunction = () => {};

export async function createNotification(title: string, body?: string, id?: string) {
	const notification = new Notification(title, {
		body: body,
		tag: id,
		silent: true,
	});

	notification.addEventListener('click', (event) => {
		event.preventDefault();

		pushStatus('click');
	});

	notification.addEventListener('close', () => {
		pushStatus('close');
	});

	notification.addEventListener('show', () => {
		pushStatus('show');
	});

	notification.addEventListener('error', () => {
		pushStatus('error');
	});

    cleanup = () => notification.close();
    
	return notification;
}

window.addEventListener('unload', () => {
	cleanup();
});

window.addEventListener('beforeunload', () => {
	cleanup();
});