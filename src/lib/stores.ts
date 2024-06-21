import type { RawSimpleAssignment } from '$lib/types/assignments';
import type { RawSimpleDocument } from '$lib/types/documents';
import type { Lesson, RawLesson } from '$lib/types/lesson';
import type { Message, RawMessage, SimpleMessage } from '$lib/types/messages';
import type { News, RawNews } from '$lib/types/news';
import type { RawGrade } from './types/grades';
import { get } from '$lib/utils/http';
import { writable, type Writable } from 'svelte/store';
import type { RawAbsence } from './types/absence';
import { localStore } from './utils/localStore';
import { lectioDataStore } from '$lib/utils/lectioDataStore';

export const screenSizeStore = writable({ width: window.innerWidth, height: window.innerHeight });
export const sidebarStore = writable({ alwaysOpen: false, isOpen: false });
export const avatarStore: Writable<Record<string, string>> = writable({});
export const loadingStore = writable<boolean>(false);

export const versionStore = localStore<string | null>('version', null);
export const authStore = localStore<{
	cookie: string | null;
	googleToken: string | null;
	school: number | null;
	username: string | null;
	password: string | null;
	name: string | null;
}>('auth', {
	cookie: null,
	googleToken: null,
	school: null,
	username: null,
	password: null,
	name: null
});

export const scheduleStore = localStore<{ moduler: RawLesson; overskrift: string } | null>(
	'schedule',
	null
);
export const assignmentStore = lectioDataStore<RawSimpleAssignment[] | null>(
	'/opgaver',
	'assignments',
	null
);
export const messageStore = localStore<Message[] | null>('messages', null);
export const frontPageStore = localStore<{
	lessons: Lesson[];
	assignments: { id: number; name: string; date: string }[];
	messages: SimpleMessage[];
	news: News[];
} | null>('frontpage', null);
export const absenceStore = lectioDataStore<RawAbsence | null>('/fravaer', 'absence', null);
export const gradesStore = lectioDataStore<RawGrade | null>('/karakterer', 'grades', null);

export const informationStore = localStore<{
	students: { id: string; name: string }[];
	groups: string[];
} | null>('information', null);
export const fetchInformation = async () => {
	// @ts-ignore
	const res = (await get('/informationer')) as {
		elever: { [key: string]: string };
		lærere: { [key: string]: string };
		hold_og_grupper: { [key: string]: string };
	};
	const students = Object.entries({ ...res.elever, ...res.lærere }).map(([name, id]) => {
		const formatted = name.split(' (')[0].split(' -')[0];
		return {
			id,
			name: formatted
		};
	});
	const groups = Object.entries(res.hold_og_grupper ?? {}).map(([name]) => name);
	informationStore.set({
		students,
		groups
	});
};

export const connectionStore = writable<boolean>(true);
