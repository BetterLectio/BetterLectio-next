import type { RawSimpleAssignment } from '$lib/types/assignments';
import type { RawSimpleDocument } from '$lib/types/documents';
import type { RawLesson } from '$lib/types/lesson';
import type { RawMessage } from '$lib/types/messages';
import type { RawNews } from '$lib/types/news';
import { writable } from 'svelte/store';
import { localStore } from './utils/localStore';

export const sidebarStore = writable({ alwaysOpen: false, isOpen: false });

export const authStore = localStore<{
    cookie: string | null;
    googleToken: string | null;
    school: number | null;
    username: string | null;
    password: string | null;
    name: string | null;
}>('auth', { cookie: null, googleToken: null, school: null, username: null, password: null, name: null });
export const scheduleStore = localStore<{ moduler: RawLesson; overskrift: string } | null>(
    'schedule',
    null
);
export const assignmentStore = localStore<RawSimpleAssignment[] | null>('assignments', null);
export const messageStore = localStore<RawMessage[] | null>('messages', null);
export const frontPageStore = localStore<{
    aktuelt: RawNews[];
    kommunikation: { beskeder: RawMessage[]; dokumenter: RawSimpleDocument[] };
    skema: RawLesson[];
} | null>('frontpage', null);

export const bannerStore = localStore<{ text: string; type: 'info' | 'success' | 'warning' | 'fatalFixable' | 'fatal', to: string }[]>('banners', []);