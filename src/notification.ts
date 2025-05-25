const notifications: Notification[] = [];

export async function createNotification(title: string, body?: string, id?: string) {
	const notification = new Notification(title, {
		body: body,
		tag: id,
		silent: true,
	});

	notification.addEventListener('click', (event) => {
		event.preventDefault();
	});

	notifications.push(notification);
    
	return notification;
}

export function updateNotification(id: string, title?: string, body?: string) {
	const index = notifications.findIndex(n => n.tag === id);
	if (index === -1) return;

	const [notification] = notifications.splice(index, 1);
	createNotification(
		title ?? notification.title,
		body ?? notification.body,
		id,
	);
}

function handleCleanup() {
	for (const notification of notifications) {
		notification.close();
	}
}

window.addEventListener('unload', handleCleanup);
window.addEventListener('beforeunload', handleCleanup);
